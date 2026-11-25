import Joi from "joi";
import { Model, Schema, Document, Connection } from "mongoose";
import { MongoDB } from "../../mongo/mongoose";
import { IUserSettings } from "../../common-types/types/expenses";

export interface IUserSettingsDocument extends IUserSettings, Document {
  userId: string;
}

/** ============================
 *  SCHEMA DEFINITION
 *  ============================ */
const userSettingsSchema = new Schema<IUserSettingsDocument>(
  {
    userId: { type: String, required: true, unique: true },
    startYear: { type: Number, required: true, default: 2021 },
    initialBalance: { type: Number, required: true, default: 0 },
  },
  { collection: "user_settings", timestamps: true },
);

/** ============================
 *  MODEL INITIALIZATION
 *  ============================ */
export const getUserSettingsModel = async (
  dbName: string = "system_db",
): Promise<Model<IUserSettingsDocument>> => {
  const Mongo = new MongoDB();
  const db: Connection = await Mongo.connectMongoDB(dbName);
  return db.model<IUserSettingsDocument>("user_settings", userSettingsSchema);
};

/** ============================
 *  JOI VALIDATION
 *  ============================ */
export const validateUserSettings = (data: Partial<IUserSettings>) => {
  const schema = Joi.object({
    startYear: Joi.number().integer().min(2000).max(2100).required().label("Start Year"),
    initialBalance: Joi.number().min(0).required().label("Initial Balance"),
  });
  return schema.validate(data);
};
