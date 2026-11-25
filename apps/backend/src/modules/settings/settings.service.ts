import { Injectable, OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import { getUserSettingsModel, IUserSettingsDocument, validateUserSettings } from "./settings.model";
import { IUserSettings } from "../../common-types/types/expenses";
import { shouldMirrorUser } from "../../mongo/mirror-users";

const DEFAULT_SETTINGS: IUserSettings = {
  startYear: 2021,
  initialBalance: 0,
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private SettingsModel!: Model<IUserSettingsDocument>;
  private MirrorSettingsModel?: Model<IUserSettingsDocument>;

  private getMirrorDatabaseName(): string | null {
    if (process.env.MIRROR_DATABASE_NAME) {
      return process.env.MIRROR_DATABASE_NAME;
    }

    const env = (process.env.ENV || process.env.NODE_ENV || "DEV").toUpperCase();

    if (env === "PROD" || env === "PRODUCTION") {
      return "system_db_DEV";
    }

    if (env === "DEV" || env === "DEVELOPMENT" || env === "LOCAL") {
      return "system_db_PROD";
    }

    return null;
  }

  private async initializeMirrorModels() {
    const mirrorDbName = this.getMirrorDatabaseName();

    if (!mirrorDbName) {
      return;
    }

    this.MirrorSettingsModel = await getUserSettingsModel(mirrorDbName);
  }

  async onModuleInit() {
    this.SettingsModel = await getUserSettingsModel();
    await this.initializeMirrorModels();
  }

  /** ---------------------------------------------------
   * 🔹 GET USER SETTINGS
   * --------------------------------------------------- */
  async getSettings(userId: string): Promise<IUserSettings> {
    this.SettingsModel = await getUserSettingsModel();
    const doc = await this.SettingsModel.findOne({ userId });

    if (!doc) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      startYear: doc.startYear,
      initialBalance: doc.initialBalance,
    };
  }

  /** ---------------------------------------------------
   * 🔹 SAVE USER SETTINGS (upsert)
   * --------------------------------------------------- */
  async saveSettings(body: { startYear: number; initialBalance: number }, userId: string) {
    try {
      const { error } = validateUserSettings({
        startYear: body.startYear,
        initialBalance: body.initialBalance,
      });

      if (error) {
        return { error: `Validation failed: ${error.details[0].message}` };
      }

      const shouldMirror = shouldMirrorUser(userId);

      const update = {
        startYear: body.startYear,
        initialBalance: body.initialBalance,
      };

      await this.SettingsModel.updateOne(
        { userId },
        { $set: update },
        { upsert: true },
      );

      if (shouldMirror && this.MirrorSettingsModel) {
        await this.MirrorSettingsModel.updateOne(
          { userId },
          { $set: update },
          { upsert: true },
        );
      }

      return { message: "Settings saved successfully" };
    } catch (error: any) {
      return { error: `Error saving settings: ${error?.message}` };
    }
  }
}
