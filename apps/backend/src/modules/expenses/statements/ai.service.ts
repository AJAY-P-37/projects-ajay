import { GoogleGenerativeAI } from "@google/generative-ai";

export class AICategoryService {
  private genAI: GoogleGenerativeAI | null = null;

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

  /**
   * Dynamically maps a statement transaction to the closest matching category
   * using Gemini. Returns the category string if successfully matched, or "Unknown".
   */
  public async suggestCategory(
    comment: string,
    statementRecord: string,
    categories: string[],
  ): Promise<string> {
    if (!this.genAI) {
      return "Unknown";
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    } catch (error) {
      console.error("AICategoryService Error:", error);
      return "Unknown";
    }
  }
}
