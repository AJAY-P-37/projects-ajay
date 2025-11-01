import { Injectable, OnModuleInit } from "@nestjs/common";
import { getUserModel, IUserDocument } from "./users.model";
import { Model } from "mongoose";
import { IUser } from "common-types/types/auth";

@Injectable()
export class UsersService implements OnModuleInit {
  private UsersModel!: Model<IUserDocument>;

  /**
   * NestJS lifecycle hook — perfect place for async initialization.
   * This avoids using `await` in constructor.
   */
  async onModuleInit() {
    this.UsersModel = await getUserModel();
  }

  /** ============================
   *  FIND USER
   *  ============================ */
  async findUserByUid(uid: string) {
    this.UsersModel = await getUserModel();
    return this.UsersModel.findOne({ uid }).exec();
  }

  /** ============================
   *  CREATE USER
   *  ============================ */
  async createUser(user: IUser) {
    const newUser = new this.UsersModel(user);
    await newUser.save();
    return newUser;
  }
}
