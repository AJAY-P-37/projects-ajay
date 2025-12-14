// import Joi from "joi";
import { Model, Schema, Document, Connection } from "mongoose";
// import bcrypt from "bcrypt";
import { MongoDB } from "../../mongo/mongoose";
import { IUser } from "../../common-types/types/auth";

/** ============================
 *  USER INTERFACES
 *  ============================ */

export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
}

/** ============================
 *  SCHEMA DEFINITION
 *  ============================ */
const userSchema = new Schema<IUserDocument>(
  {
    uid: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    authType: { type: String, enum: ["google", "password"], required: true },
    picture: String,
  },
  { collection: "users", timestamps: true },
);

/** ============================
 *  HOOKS & METHODS
 *  ============================ */
// userSchema.pre("save", async function (next) {
//   const user = this as IUserDocument;

//   if (!user.isModified("password") || !user.password) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//     next();
//   } catch (err) {
//     next(err as Error);
//   }
// });

// userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
//   if (!this.password) return false;
//   return bcrypt.compare(password, this.password);
// };

/** ============================
 *  MODEL INITIALIZATION
 *  ============================ */

// ✅ Define model factory (no uninitialized variable)
export const getUserModel = async (): Promise<Model<IUserDocument>> => {
  const Mongo = new MongoDB();
  const system_db: Connection = await Mongo.connectMongoDB("system_db");
  return system_db.model<IUserDocument>("users", userSchema);
};

/** ============================
 *  JOI VALIDATION
 *  ============================ */
// export const validateUser = (data: IUser) => {
//   const schema = Joi.object({
//     username: Joi.string().required().label("Username"),
//     password: Joi.string().required().label("Password"),
//   });

//   return schema.validate(data);
// };
