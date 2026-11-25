import Joi from "joi";
import { Model, Schema, Document, Connection } from "mongoose";
import { MongoDB } from "../../mongo/mongoose";
import { IIncome } from "../../common-types/types/expenses";

export interface IIncomeDocument extends Document {
  userId: string;
  date: Date;
  source: string;
  amount: number;
  note?: string;
}

/** ============================
 *  SCHEMA DEFINITION
 *  ============================ */
const incomeSchema = new Schema<IIncomeDocument>(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    source: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { collection: "income", timestamps: true },
);

/** ============================
 *  MODEL INITIALIZATION
 *  ============================ */
export const getIncomeModel = async (
  dbName: string = "transaction_db",
): Promise<Model<IIncomeDocument>> => {
  const Mongo = new MongoDB();
  const db: Connection = await Mongo.connectMongoDB(dbName);
  return db.model<IIncomeDocument>("income", incomeSchema);
};

/** ============================
 *  JOI VALIDATION
 *  ============================ */
export const validateIncome = (data: Partial<IIncome>) => {
  const schema = Joi.object({
    userId: Joi.string().required().label("User ID"),
    date: Joi.date().required().label("Date"),
    source: Joi.string().required().label("Source"),
    amount: Joi.number().positive().required().label("Amount"),
    note: Joi.string().optional().allow("").label("Note"),
  });
  return schema.validate(data);
};
