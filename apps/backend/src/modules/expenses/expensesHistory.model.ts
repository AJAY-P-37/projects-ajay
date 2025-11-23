import Joi from "joi";
import { Model, Schema, Document, Connection } from "mongoose";
import { MongoDB } from "../../mongo/mongoose";
import { IExpenseHistory } from "common-types/dist/types/expenses";

/** ============================
 *  EXPENSE HISTORY INTERFACES
 *  ============================ */

export interface IExpenseHistoryDocument extends IExpenseHistory, Document {}

/** ============================
 *  SCHEMA DEFINITION
 *  ============================ */
const expenseHistorySchema = new Schema<IExpenseHistoryDocument>(
  {
    userId: { type: String, required: true }, // ADD THIS
    statementRecord: { type: String, required: true },
    category: { type: [String], required: true }, // ✅ array of strings
    statementType: { type: String },
  },
  { collection: "expensesHistory_new", timestamps: true },
);

expenseHistorySchema.index({ userId: 1, statementRecord: 1 }, { unique: true });

/** ============================
 *  MODEL INITIALIZATION
 *  ============================ */
export const getExpenseHistoryModel = async (): Promise<Model<IExpenseHistoryDocument>> => {
  const Mongo = new MongoDB();
  const transaction_db: Connection = await Mongo.connectMongoDB("transaction_db");
  return transaction_db.model<IExpenseHistoryDocument>("expensesHistory_new", expenseHistorySchema);
};

/** ============================
 *  JOI VALIDATION
 *  ============================ */
export const validateExpenseHistory = (data: Partial<IExpenseHistory>) => {
  const schema = Joi.object({
    userId: Joi.string().required().label("User ID"),
    statementRecord: Joi.string().required().label("Statement Record"),
    category: Joi.string().required().label("Category"),
    statementType: Joi.string().optional().label("Statement Type"),
  });

  return schema.validate(data);
};
