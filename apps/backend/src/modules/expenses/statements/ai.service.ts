import { GoogleGenerativeAI } from "@google/generative-ai";

export class AICategoryService {
  private genAI: GoogleGenerativeAI | null = null;

  /** Minimum ms between consecutive API calls (free tier = 5 req/min ≈ 12s apart) */
  private static readonly MIN_DELAY_MS = 13_000;
  private static readonly MAX_RETRIES = 3;
  private static lastCallTime = 0;
  private static queue: Promise<void> = Promise.resolve();

  constructor() {
    // Read GEMINI_API_KEY first, fallback to API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn(
        "AICategoryService: Neither GEMINI_API_KEY nor API_KEY is defined in environment.",
      );
    }
  }

  private static readonly MODEL_NAME = "gemini-3.6-flash";
  private static readonly BATCH_SIZE = 80;

  /** Sleep helper */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Enqueue a call to respect rate limits across all concurrent callers */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      AICategoryService.queue = AICategoryService.queue.then(async () => {
        try {
          // Wait until enough time has passed since the last call
          const now = Date.now();
          const elapsed = now - AICategoryService.lastCallTime;
          if (elapsed < AICategoryService.MIN_DELAY_MS) {
            await this.sleep(AICategoryService.MIN_DELAY_MS - elapsed);
          }
          AICategoryService.lastCallTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /** Normalize a model category output against the user's valid category list */
  private normalizeCategory(rawCategory: string, categories: string[]): string {
    const text = (rawCategory || "").trim();
    if (!text || text === "Unknown") {
      return "Unknown";
    }
    if (categories.includes(text)) {
      return text;
    }
    const matched = categories.find((c) => c.toLowerCase() === text.toLowerCase());
    return matched || "Unknown";
  }

  /** Shared retry wrapper for transient overload (503) errors; fails immediately on rate/usage limits (429) */
  private async withRetry<T>(operation: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const status = error?.status;
      if (status === 503 && attempt < AICategoryService.MAX_RETRIES) {
        const retryDelay = error?.errorDetails
          ?.find((d: any) => d["@type"]?.includes("RetryInfo"))
          ?.retryDelay;
        const waitSec = retryDelay ? parseInt(retryDelay) : Math.pow(2, attempt + 1) * 15;
        const waitMs = (isNaN(waitSec) ? 30 : waitSec) * 1000;

        console.warn(
          `[AICategoryService] Service overloaded (${status}). Retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${AICategoryService.MAX_RETRIES})`,
        );
        await this.sleep(waitMs);
        AICategoryService.lastCallTime = Date.now();
        return this.withRetry(operation, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Dynamically maps a statement transaction to the closest matching category
   * using Gemini. Returns the category string if successfully matched, or "Unknown".
   */
  public async suggestCategory(
    comment: string,
    statementRecord: string,
    categories: string[],
  ): Promise<string> {
    if (!this.genAI || process.env.ENABLE_AI_CATEGORIZATION !== "true") {
      return "Unknown";
    }

    return this.enqueue(() =>
      this.callGeminiWithRetry(comment, statementRecord, categories),
    );
  }

  /**
   * Classifies a batch of transactions in minimal Gemini API calls (typically a single call),
   * deduplicating identical statement records + hints.
   * Returns an array of categories aligned by index with the input items.
   */
  public async suggestCategoriesBatch(
    items: Array<{ statementRecord: string; currentCategory?: string; amount?: number }>,
    categories: string[],
  ): Promise<string[]> {
    if (!this.genAI) {
      throw new Error("AI categorization is not configured (missing Gemini API key)");
    }

    if (items.length === 0 || categories.length === 0) {
      return items.map(() => "Unknown");
    }

    // Deduplicate identical (statementRecord, currentCategory) pairs to minimize token usage
    const uniqueKeyToIndex = new Map<string, number>();
    const uniqueItems: Array<{ statementRecord: string; currentCategory?: string; amount?: number }> =
      [];
    const itemToUniqueIndex: number[] = items.map((item) => {
      const record = (item.statementRecord || "").trim();
      const hint =
        item.currentCategory && item.currentCategory !== "Unknown"
          ? item.currentCategory.trim()
          : "";
      const key = `${record}||${hint}`;

      if (!uniqueKeyToIndex.has(key)) {
        uniqueKeyToIndex.set(key, uniqueItems.length);
        uniqueItems.push({
          statementRecord: record,
          currentCategory: hint || undefined,
          amount: item.amount,
        });
      }
      return uniqueKeyToIndex.get(key)!;
    });

    const uniqueResults = new Array<string>(uniqueItems.length).fill("Unknown");

    for (let start = 0; start < uniqueItems.length; start += AICategoryService.BATCH_SIZE) {
      const chunk = uniqueItems.slice(start, start + AICategoryService.BATCH_SIZE);
      const chunkResults = await this.enqueue(() =>
        this.callGeminiBatchWithRetry(chunk, categories),
      );
      chunkResults.forEach((cat, offset) => {
        uniqueResults[start + offset] = cat;
      });
    }

    return itemToUniqueIndex.map((uIdx) => uniqueResults[uIdx] || "Unknown");
  }

  private async callGeminiBatchWithRetry(
    items: Array<{ statementRecord: string; currentCategory?: string; amount?: number }>,
    categories: string[],
  ): Promise<string[]> {
    try {
      return await this.withRetry(async () => {
        const model = this.genAI!.getGenerativeModel({
          model: AICategoryService.MODEL_NAME,
          generationConfig: { responseMimeType: "application/json" },
        });

        const payload = items.map((item, index) => ({
          index,
          statementRecord: item.statementRecord || "N/A",
          ...(item.currentCategory ? { hint: item.currentCategory } : {}),
          ...(item.amount !== undefined ? { amount: item.amount } : {}),
        }));

        const prompt = `You are a bank statement transaction classification assistant.
Given the following list of valid expense categories:
${JSON.stringify(categories)}

Classify each transaction in the JSON array below into the best matching valid category from the list.
If none of the categories match or a transaction is too ambiguous, use "Unknown".

Transactions:
${JSON.stringify(payload)}

CRITICAL RULES:
1. Return ONLY a JSON array of objects with the shape: [{"index": number, "category": string}].
2. Include exactly one entry for each input index (0 through ${items.length - 1}).
3. Each "category" value MUST be an exact string from the valid expense categories list above, or "Unknown".`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text().trim();
        const cleaned = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) {
          throw new Error("Unexpected AI response format (expected JSON array)");
        }

        const resolved = new Array<string>(items.length).fill("Unknown");
        for (const entry of parsed) {
          const idx = Number(entry?.index);
          if (Number.isInteger(idx) && idx >= 0 && idx < items.length) {
            resolved[idx] = this.normalizeCategory(String(entry?.category || ""), categories);
          }
        }
        return resolved;
      });
    } catch (error) {
      console.error("AICategoryService Batch Error:", error);
      throw error;
    }
  }

  private async callGeminiWithRetry(
    comment: string,
    statementRecord: string,
    categories: string[],
  ): Promise<string> {
    try {
      return await this.withRetry(async () => {
        const model = this.genAI!.getGenerativeModel({ model: AICategoryService.MODEL_NAME });

        const prompt = `You are a bank statement transaction classification assistant.
Given the following list of valid expense categories:
${JSON.stringify(categories)}

Analyze this transaction record:
- Transaction Detail/Comment: "${comment || "N/A"}"
- Raw Statement Record: "${statementRecord || "N/A"}"

Determine which valid category matches this transaction. If none of the categories match or it is ambiguous, respond with "Unknown".

CRITICAL RULE: Your response must contain ONLY the matched category name from the list, or "Unknown". Do not include any explanation, prefix, suffix, quotes, or formatting.`;

        const result = await model.generateContent(prompt);
        return this.normalizeCategory(result.response.text(), categories);
      });
    } catch (error) {
      console.error("AICategoryService Error:", error);
      return "Unknown";
    }
  }
}
