import Joi from "joi";
import { Model, Schema, Document, Connection } from "mongoose";
import { MongoDB } from "../../mongo/mongoose";
import { IIncomeSourceSchema } from "../../common-types/types/expenses";

export interface IIncomeSourceDocument extends IIncomeSourceSchema, Document {}

/** ============================
 *  SCHEMA DEFINITION
 *  ============================ */
const incomeSourceSchema = new Schema<IIncomeSourceDocument>(
  {
    userId: { type: String, required: true },
    source: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { collection: "income_sources", timestamps: true },
);
incomeSourceSchema.index({ userId: 1, source: 1 }, { unique: true });

/** ============================
 *  MODEL INITIALIZATION
 *  ============================ */
export const getIncomeSourceModel = async (
  dbName: string = "transaction_db",
): Promise<Model<IIncomeSourceDocument>> => {
  const Mongo = new MongoDB();
  const transaction_db: Connection = await Mongo.connectMongoDB(dbName);
  return transaction_db.model<IIncomeSourceDocument>("income_sources", incomeSourceSchema);
};

/** ============================
 *  JOI VALIDATION
 *  ============================ */
export const validateIncomeSource = (data: Partial<IIncomeSourceSchema>) => {
  const schema = Joi.object({
    userId: Joi.string().required().label("User ID"),
    source: Joi.string().required().label("Source"),
    description: Joi.string().optional().allow("").label("Description"),
  });

  return schema.validate(data);
};
