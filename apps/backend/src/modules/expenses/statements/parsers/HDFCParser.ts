// src/statements/parsers/HDFCParser.ts
import XLSX from "xlsx";
import { BaseParser, StatementRowResult } from "./BaseParser";

export class HDFCParser extends BaseParser {
  async parse(buffer: ArrayBuffer): Promise<StatementRowResult[]> {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });

    // Find header row where narration/withdrawal/deposit words appear
    const headerIndex = rows.findIndex((r) => {
      const txt = r.join(" ").toLowerCase();
      return (
        txt.includes("narration") &&
        (txt.includes("withdraw") || txt.includes("withdrawal")) &&
        txt.includes("deposit")
      );
    });

    if (headerIndex === -1) throw new Error("HDFC: Transaction header row not found");

    const txRows = rows.slice(headerIndex + 1);
    const results: StatementRowResult[] = [];

    for (const row of txRows) {
      if (!row || row.length < 3) continue;

      // HDFC layout in sample: [Date, Narration, Chq/Ref No., Value Dt, Withdrawal Amt, Deposit Amt, Closing Balance]
      const [dateRaw, narrationRaw, , , withdrawalRaw] = row;

      if (!dateRaw || !narrationRaw) continue;

      const txnDate = this.parseDate(dateRaw, "dd/mm/yy");
      const description = String(narrationRaw || "").trim();
      const debitAmount = withdrawalRaw ? this.toNumber(withdrawalRaw) : null;

      // skip rows that are evidently separators or empties
      // sometimes there are small fee rows with only balance; keep only if amounts exist
      if (!debitAmount) continue;

      results.push({
        txnDate,
        description,
        debitAmount,
      });
    }

    return results;
  }
}
