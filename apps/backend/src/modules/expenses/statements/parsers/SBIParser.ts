// src/statements/parsers/SBIParser.ts
import XLSX from "xlsx";
import { BaseParser, StatementRowResult } from "./BaseParser";

export class SBIParser extends BaseParser {
  async parse(buffer: ArrayBuffer): Promise<StatementRowResult[]> {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    const headerIndex = rows.findIndex((r) => {
      const txt = r.join(" ").toLowerCase();
      return (
        txt.includes("txn") &&
        txt.includes("value") &&
        (txt.includes("debit") || txt.includes("withdraw"))
      );
    });

    if (headerIndex === -1) throw new Error("SBI: Transaction header row not found");

    const dataRows = rows.slice(headerIndex + 1);
    const results: StatementRowResult[] = [];

    for (const row of dataRows) {
      if (!row || row.length < 3) continue;
      const [txnDateRaw, , descriptionRaw, , debitRaw] = row;

      if (!txnDateRaw || (debitRaw === "" && !descriptionRaw)) continue;

      const txnDate = this.parseDate(txnDateRaw, "auto");
      const description = String(descriptionRaw || "").trim();
      const debitAmount = debitRaw ? this.toNumber(debitRaw) : null;

      results.push({
        txnDate,
        description,
        debitAmount,
      });
    }

    return results;
  }
}
