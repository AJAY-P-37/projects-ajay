// src/statements/parsers/BaseParser.ts
import XLSX from "xlsx";

export interface StatementRowResult {
  txnDate: string; // "DD-MM-YYYY"
  description: string;
  debitAmount: number | null;
}

export abstract class BaseParser {
  abstract parse(buffer: ArrayBuffer): Promise<any[]>;

  protected toNumber(v: any): number | null {
    if (v === "" || v === null || v === undefined) return null;
    const cleaned = String(v)
      .toString()
      .replace(/[,₹\s]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  /**
   * Generic date parser for SBI / HDFC / Excel / String dates.
   * Output always: "DD-MM-YYYY"
   */
  protected parseDate(
    raw: any,
    pattern: "dd/mm/yy" | "dd-mm-yy" | "excel" | "auto" = "auto",
  ): string {
    if (!raw) return "";

    // -----------------------------
    // ✅ 1. Excel numeric date
    // -----------------------------
    if (typeof raw === "number") {
      const js = XLSX.SSF.parse_date_code(raw);
      return `${js.y.toString().padStart(4, "0")}-${js.m
        .toString()
        .padStart(2, "0")}-${js.d.toString().padStart(2, "0")}`;
    }

    const value = String(raw).trim();

    // Helper: convert split values to YYYY-MM-DD safely
    const toYMD = (d: string, m: string, y: string) => {
      const year = y.length === 2 ? `20${y}` : y;
      return `${year.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    };

    // -----------------------------
    // ✅ 2. Forced pattern mode
    // -----------------------------
    if (pattern === "dd/mm/yy" && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) {
      const [d, m, y] = value.split("/");
      return toYMD(d, m, y);
    }

    if (pattern === "dd-mm-yy" && /^\d{1,2}-\d{1,2}-\d{2,4}$/.test(value)) {
      const [d, m, y] = value.split("-");
      return toYMD(d, m, y);
    }

    if (pattern === "excel") return "";

    // -----------------------------
    // ✅ 3. Auto-detection
    // -----------------------------
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) {
      const [d, m, y] = value.split("/");
      return toYMD(d, m, y);
    }

    if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(value)) {
      const [d, m, y] = value.split("-");
      return toYMD(d, m, y);
    }

    // 01-Jan-2025 or 01-Jan-25
    if (/^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10); // YYYY-MM-DD
      }
    }

    // Generic fallback
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

    return "";
  }
}
