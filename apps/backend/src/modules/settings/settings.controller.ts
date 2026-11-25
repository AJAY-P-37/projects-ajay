import { Controller, Post, Body, Res, Get, HttpException, HttpStatus } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { Response } from "express";
import { User } from "../users/users.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("getSettings")
  async getSettings(@User("uid") userId: string, @Res() res: Response) {
    try {
      const result = await this.settingsService.getSettings(userId);
      return res.status(200).json(result);
    } catch (error) {
      throw new HttpException("Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post("saveSettings")
  async saveSettings(
    @User("uid") userId: string,
    @Body() body: { startYear: number; initialBalance: number },
    @Res() res: Response,
  ) {
    try {
      const result = await this.settingsService.saveSettings(body, userId);
      if (result.error) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      throw new HttpException("Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
