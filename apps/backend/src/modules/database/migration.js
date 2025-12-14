/**
 * MIGRATION SCRIPT
 * Copies data from old collections (expenses, categories, expensesHistory)
 * into new collections (expenses_new, categories_new, expensesHistory_new)
 */

import mongoose from "mongoose";

// -------------------------------
// CONFIG
// -------------------------------

const MONGO_URI =
  "mongodb+srv://Ajay:IOlcSFqOpfbkEk97@personalblogcluster.qffdy8d.mongodb.net/transaction_db_DEV";
const USER_ID = "CqhsM3xLbsNXCvJUv6Z7qzB3slj1";
const TEST_MODE = false; // set false to actually write to DB

// -------------------------------
// OLD SCHEMAS
// -------------------------------
const OldExpense = mongoose.model(
  "expenses",
  new mongoose.Schema(
    {
      date: Date,
      category: String,
      amount: Number,
      statementRecord: String,
      transactionType: String,
    },
    { collection: "expenses" },
  ),
);

const OldCategory = mongoose.model(
  "categories",
  new mongoose.Schema(
    {
      category: String,
    },
    { collection: "categories" },
  ),
);

const OldExpenseHistory = mongoose.model(
  "expensesHistory",
  new mongoose.Schema(
    {
      statementRecord: String,
      category: String,
      transactionType: String,
    },
    { collection: "expensesHistory" },
  ),
);

// -------------------------------
// NEW SCHEMAS
// -------------------------------
const NewExpense = mongoose.model(
  "expenses_new",
  new mongoose.Schema(
    {
      userId: String,
      date: Date,
      category: String,
      amount: Number,
      statementRecord: String,
      statementType: String,
    },
    { collection: "expenses_new", timestamps: true },
  ),
);

const NewCategory = mongoose.model(
  "categories_new",
  new mongoose.Schema(
    {
      userId: String,
      category: String,
    },
    { collection: "categories_new", timestamps: true },
  ).index({ userId: 1, category: 1 }, { unique: true }),
);

const NewExpenseHistory = mongoose.model(
  "expensesHistory_new",
  new mongoose.Schema(
    {
      userId: String,
      statementRecord: String,
      category: [String],
      statementType: String,
    },
    { collection: "expensesHistory_new", timestamps: true },
  ).index({ userId: 1, statementRecord: 1 }, { unique: true }),
);

// -------------------------------
// MIGRATION LOGIC
// -------------------------------
async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");

  // --- 1) Expenses Migration ---
  const oldExpenses = await OldExpense.find();
  console.log(`Found ${oldExpenses.length} old expenses`);

  for (const e of oldExpenses) {
    const doc = {
      userId: USER_ID,
      date: e.date,
      category: e.category,
      amount: e.amount,
      statementRecord: e.statementRecord,
      statementType: "unknown",
    };

    if (!TEST_MODE) {
      await NewExpense.create(doc);
    }
  }

  console.log("✔️ Expenses migrated");

  // ---------------------------
  // 2️⃣ MIGRATE CATEGORIES

  const oldCats = await OldCategory.find({});
  console.log(`Found ${oldCats.length} old categories`);

  for (const c of oldCats) {
    const doc = {
      userId: USER_ID,
      category: c.category,
    };

    if (!TEST_MODE) {
      try {
        await NewCategory.updateOne(doc, doc, { upsert: true });
      } catch (err) {
        console.log("Duplicate category skipped:", c.category);
      }
    }
  }

  console.log("✔️ Categories migrated");

  // ---------------------------
  // 3️⃣ MIGRATE EXPENSE HISTORY

  const oldHistory = await OldExpenseHistory.find({});
  console.log(`Found ${oldHistory.length} history entries`);

  for (const h of oldHistory) {
    const doc = {
      userId: USER_ID,
      statementRecord: h.statementRecord,
      category: [h.category],
      statementType: h.transactionType || "unknown",
    };

    if (!TEST_MODE) {
      try {
        await NewExpenseHistory.updateOne(
          { userId: USER_ID, statementRecord: h.statementRecord },
          doc,
          { upsert: true },
        );
      } catch (err) {
        console.log("Duplicate expenseHistory skipped:", h.statementRecord);
      }
    }
  }

  console.log("✔️ ExpenseHistory migrated");

  console.log("🎉 Migration Complete");
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
