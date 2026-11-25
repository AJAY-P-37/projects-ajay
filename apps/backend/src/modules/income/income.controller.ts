import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Query,
  Param,
} from "@nestjs/common";
import { IncomeService } from "./income.service";
import { Response } from "express";
import { User } from "../users/users.service";

@Controller("income")
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post("saveMonthlyIncomeData")
  async saveMonthlyIncomeData(
    @User("uid") userId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.incomeService.saveMonthlyIncomeData(body, userId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || "Something went wrong" });
    }
  }

  @Get("getMonthlyIncomeData")
  async getMonthlyIncomeData(
    @User("uid") userId: string,
    @Query("year") year: string,
    @Query("month") month: string,
    @Res() res: Response,
  ) {
    const result = await this.incomeService.getMonthlyIncomeData(
      { year: Number(year), month: Number(month) },
      userId,
    );
    return res.status(200).json(result);
  }

  @Get("getIncomeDataByRange")
  async getIncomeDataByRange(
    @User("uid") userId: string,
    @Query("startYear") startYear: string,
    @Query("startMonth") startMonth: string,
    @Query("endYear") endYear: string,
    @Query("endMonth") endMonth: string,
    @Query("allData") allData: string,
    @Res() res: Response,
  ) {
    const result = await this.incomeService.getIncomeDataByRange(
      {
        startYear: startYear ? Number(startYear) : undefined,
        startMonth: startMonth !== undefined && startMonth !== "" ? Number(startMonth) : undefined,
        endYear: endYear ? Number(endYear) : undefined,
        endMonth: endMonth !== undefined && endMonth !== "" ? Number(endMonth) : undefined,
        allData: allData === "true",
      },
      userId,
    );
    return res.status(200).json(result);
  }

  @Post("saveBulkIncomeData")
  async saveBulkIncomeData(
    @User("uid") userId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.incomeService.saveBulkIncomeData(body, userId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || "Something went wrong" });
    }
  }

  @Get("getMonthlyConsolidatedPivotTable/:year")
  async getMonthlyConsolidatedPivotTable(
    @Param("year") year: number,
    @User("uid") userId: string,
    @Res() res: Response,
  ) {
    const result = await this.incomeService.getMonthlyConsolidatedPivotTable(
      Number(year),
      userId,
    );
    return res.status(200).json(result);
  }

  @Get("getYearlyConsolidatedPivotTable/:year")
  async getYearlyConsolidatedPivotTable(
    @Param("year") year: number,
    @User("uid") userId: string,
    @Res() res: Response,
  ) {
    const result = await this.incomeService.getYearlyConsolidatedPivotTable(
      Number(year),
      userId,
    );
    return res.status(200).json(result);
  }

  @Get("getFinancialOverview/:year")
  async getFinancialOverview(
    @Param("year") year: number,
    @User("uid") userId: string,
    @Res() res: Response,
  ) {
    const result = await this.incomeService.getFinancialOverview(Number(year), userId);
    return res.status(200).json(result);
  }

  @Get("getIncomeSources")
  async getIncomeSources(@User("uid") userId: string, @Res() res: Response) {
    const result = await this.incomeService.getIncomeSources(userId);
    return res.status(200).json(result);
  }

  @Post("saveIncomeSources")
  async saveIncomeSources(@User("uid") userId: string, @Body() body: any, @Res() res: Response) {
    const { message, error } = await this.incomeService.saveIncomeSources(body, userId);
    if (!error) return res.status(200).json({ message });
    return res.status(500).json({ message: error });
  }
}
