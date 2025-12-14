import Joi from "joi";
import { Model, Schema, Document, Connection } from "mongoose";
import { MongoDB } from "../../mongo/mongoose";
import { IExpense } from "../../common-types/types/expenses";

export interface IExpenseDocument extends IExpense, Document {}

/** ============================
 *  SCHEMA DEFINITION
 *  ============================ */
const expenseSchema = new Schema<IExpenseDocument>(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    statementRecord: { type: String, default: "Manual" },
    statementType: { type: String, default: "Unknown" },
  },
  { collection: "expenses_new", timestamps: true },
);

/** ============================
 *  MODEL INITIALIZATION
 *  ============================ */
export const getExpenseModel = async (): Promise<Model<IExpenseDocument>> => {
  const Mongo = new MongoDB();
  const transaction_db: Connection = await Mongo.connectMongoDB("transaction_db");
  return transaction_db.model<IExpenseDocument>("expenses_new", expenseSchema);
};

/** ============================
 *  JOI VALIDATION
 *  ============================ */
export const validateExpense = (data: Partial<IExpense>, minDate?: Date, maxDate?: Date) => {
  const schema = Joi.object({
    userId: Joi.string().required().label("User ID"),
    date: Joi.date()
      .min(minDate ?? "1900-01-01")
      .max(maxDate ?? "3000-01-01")
      .required()
      .label("Date"),
    category: Joi.string().required().label("Category"),
    amount: Joi.number().required().label("Amount"),
    statementRecord: Joi.string().optional().label("Statement Record"),
    statementType: Joi.string().optional().label("Statement Type"),
  });

  return schema.validate(data);
};
