import Joi from "joi";
import { Model, Schema, Document, Connection } from "mongoose";
import { MongoDB } from "../../mongo/mongoose";
import { IExpensesCategorySchema } from "common-types/dist/types/expenses";

/** ============================
 *  CATEGORY INTERFACES
 *  ============================ */

export interface ICategoryDocument extends IExpensesCategorySchema, Document {}

/** ============================
 *  SCHEMA DEFINITION
 *  ============================ */
const categorySchema = new Schema<ICategoryDocument>(
  {
    userId: { type: String, required: true },
    category: { type: String, required: true },
    keywords: { type: [String], required: true },
  },
  { collection: "categories_new", timestamps: true },
);
categorySchema.index({ userId: 1, category: 1 }, { unique: true });

/** ============================
 *  MODEL INITIALIZATION
 *  ============================ */
export const getCategoryModel = async (): Promise<Model<ICategoryDocument>> => {
  const Mongo = new MongoDB();
  const transaction_db: Connection = await Mongo.connectMongoDB("transaction_db");
  return transaction_db.model<ICategoryDocument>("categories_new", categorySchema);
};

/** ============================
 *  JOI VALIDATION
 *  ============================ */
export const validateCategory = (data: Partial<IExpensesCategorySchema>) => {
  const schema = Joi.object({
    userId: Joi.string().required().label("User ID"),
    category: Joi.string().required().label("Category"),
    keywords: Joi.array(),
  });

  return schema.validate(data);
};

/** ============================
 *  OPTIONAL: SEEDING EXAMPLE
 *  ============================ */
// export const seedCategories = async () => {
//   const categories = [
//     "Bike",
//     "Contribution",
//     "Family",
//     "Food",
//     "Gym",
//     "Health",
//     "Investment",
//     "Movie",
//     "Others",
//     "Outing",
//     "Rent",
//     "Shopping",
//     "Snacks",
//     "Travel",
//   ];

//   const CategoryModel = await getCategoryModel();
//   for (const value of categories) {
//     await new CategoryModel({ category: value, userId: "CqhsM3xLbsNXCvJUv6Z7qzB3slj1" }).save();
//   }
// };

// seedCategories()
