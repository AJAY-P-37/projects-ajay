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

  private async callGeminiWithRetry(
    comment: string,
    statementRecord: string,
    categories: string[],
    attempt = 0,
  ): Promise<string> {
    try {
      const model = this.genAI!.getGenerativeModel({ model: "gemini-3.6-flash" });

      const prompt = `You are a bank statement transaction classification assistant.
Given the following list of valid expense categories:
${JSON.stringify(categories)}

Analyze this transaction record:
- Transaction Detail/Comment: "${comment || "N/A"}"
- Raw Statement Record: "${statementRecord || "N/A"}"

Determine which valid category matches this transaction. If none of the categories match or it is ambiguous, respond with "Unknown".

CRITICAL RULE: Your response must contain ONLY the matched category name from the list, or "Unknown". Do not include any explanation, prefix, suffix, quotes, or formatting.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Validate that the output is exactly one of the categories or "Unknown"
      if (categories.includes(text) || text === "Unknown") {
        return text;
      }

      // Case-insensitive fallback check
      const matched = categories.find((c) => c.toLowerCase() === text.toLowerCase());
      if (matched) {
        return matched;
      }

      return "Unknown";
    } catch (error: any) {
      const status = error?.status;

      // Retry on rate limit (429) or overload (503) with exponential backoff
      if ((status === 429 || status === 503) && attempt < AICategoryService.MAX_RETRIES) {
        const retryDelay = error?.errorDetails
          ?.find((d: any) => d["@type"]?.includes("RetryInfo"))
          ?.retryDelay;
        const waitSec = retryDelay ? parseInt(retryDelay) : Math.pow(2, attempt + 1) * 15;
        const waitMs = (isNaN(waitSec) ? 30 : waitSec) * 1000;

        console.warn(
          `[AICategoryService] Rate limited (${status}). Retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${AICategoryService.MAX_RETRIES})`,
        );
        await this.sleep(waitMs);
        AICategoryService.lastCallTime = Date.now();
        return this.callGeminiWithRetry(comment, statementRecord, categories, attempt + 1);
      }

      console.error("AICategoryService Error:", error);
      return "Unknown";
    }
  }
}
