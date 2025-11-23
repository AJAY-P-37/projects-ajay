import { Controller, Post, Body, Res, HttpException, HttpStatus, Get, Query } from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { Response } from "express";
import { User } from "../users/users.service";

@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post("processMonthlyExpenseStatements")
  async processMonthlyExpenseStatements(
    @User("uid") userId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.expensesService.processMonthlyExpenseStatements(body, userId);
      return res.status(200).json(result);
    } catch (error) {
      throw new HttpException("Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post("saveMonthlyExpenseData")
  async saveMonthlyExpenseData(
    @User("uid") userId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const result = await this.expensesService.saveMonthlyExpenseData(body, userId);
    return res.status(200).json(result);
  }

  @Get("getMonthlyExpensesPivotTable")
  async getMonthlyExpensesPivotTable(
    @User("uid") userId: string,
    @Query("year") year: string,
    @Query("month") month: string,
    @Res() res: Response,
  ) {
    const result = await this.expensesService.getMonthlyExpensesPivotTable(
      { year: Number(year), month: Number(month) },
      userId,
    );
    return res.status(200).json(result);
  }

  @Get("getExpenseHistoryData")
  async getExpenseHistoryData(@Res() res: Response) {
    const result = await this.expensesService.getExpenseHistoryData();
    return res.status(200).json(result);
  }
}
