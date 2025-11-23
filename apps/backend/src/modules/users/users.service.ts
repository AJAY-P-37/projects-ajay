import { Injectable, OnModuleInit } from "@nestjs/common";
import { getUserModel, IUserDocument } from "./users.model";
import { Model } from "mongoose";
import { IUser } from "common-types/dist/types/auth";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return data ? req.user?.[data] : req.user;
});

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
