// src/statements/parsers/HDFCCreditParser.ts
import XLSX from "xlsx";
import { BaseParser, StatementRowResult } from "./BaseParser";

export class HDFCCreditParser extends BaseParser {
  async parse(buffer: ArrayBuffer): Promise<StatementRowResult[]> {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    // Identify header row
    const headerIndex = rows.findIndex((r) => {
      const txt = r.join(" ").toLowerCase();
      return (
        txt.includes("transaction type") &&
        txt.includes("date") &&
        txt.includes("description") &&
        txt.includes("amt") &&
        txt.includes("debit") &&
        txt.includes("credit")
      );
    });

    if (headerIndex === -1) {
      throw new Error("HDFC Credit: Transaction header row not found");
    }

    const header = rows[headerIndex];

    // -------------------------------------------
    // ✔️ Detect column indexes dynamically
    // -------------------------------------------
    const indexTxnType = header.findIndex((c) => String(c).toLowerCase().includes("transaction"));

    const indexDate = header.findIndex((c) => String(c).toLowerCase().includes("date"));

    const indexDescription = header.findIndex((c) =>
      String(c).toLowerCase().includes("description"),
    );

    const indexAmount = header.findIndex((c) => String(c).toLowerCase().includes("amt"));

    const indexDC = header.findIndex((c) => String(c).toLowerCase().includes("debit"));

    const txRows = rows.slice(headerIndex + 1);
    const results: StatementRowResult[] = [];

    for (const row of txRows) {
      if (!row || row.length < 5) continue;

      const txnType = row[indexTxnType];
      const dateRaw = row[indexDate];
      const descRaw = row[indexDescription];
      const amtRaw = row[indexAmount];
      const dcRaw = row[indexDC];

      // Stop parsing when summary/footer rows start
      if (String(txnType).toLowerCase() === "") break;

      const dc = String(dcRaw).trim().toLowerCase();
      // Only keep Debit rows → skip "Cr"
      const isCredit = dc === "cr" || dc === "credit";
      if (isCredit) continue;

      // Parse date (extract first part before time)
      const datePart = String(dateRaw).split(" ")[0].trim();
      if (!datePart) continue;

      const txnDate = this.parseDate(datePart, "dd/mm/yy");

      const description = String(descRaw || "").trim();
      const amount = this.toNumber(amtRaw);

      if (!amount) continue;

      results.push({
        txnDate,
        description,
        debitAmount: amount,
      });
    }

    return results;
  }
}
