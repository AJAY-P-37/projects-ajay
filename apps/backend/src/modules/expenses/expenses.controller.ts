import {
  Controller,
  Post,
  Body,
  Res,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Param,
  Req,
} from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { Response } from "express";
import { User } from "../users/users.service";
import { IExpensesCategory } from "../../common-types/types/expenses";

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
      if (result.error) {
        return res.status(500).json(result);
      }
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

  @Get("getMonthlyExpenseData")
  async getMonthlyExpenseData(
    @User("uid") userId: string,
    @Query("year") year: string,
    @Query("month") month: string,
    @Res() res: Response,
  ) {
    const result = await this.expensesService.getMonthlyExpenseData(
      { year: Number(year), month: Number(month) },
      userId,
    );
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
  async getExpenseHistoryData(@User("uid") userId: string, @Res() res: Response) {
    const result = await this.expensesService.getExpenseHistoryData(userId);
    return res.status(200).json(result);
  }

  @Get("getCategories")
  async getCategories(@User("uid") userId: string, @Res() res: Response) {
    const result: IExpensesCategory[] = await this.expensesService.getCategories(userId);
    return res.status(200).json(result);
  }

  @Post("saveCategories")
  async saveCategories(@User("uid") userId: string, @Body() body: any, @Res() res: Response) {
    const { message, error } = await this.expensesService.saveCategories(body, userId);
    if (!error) return res.status(200).json({ message });

    return res.status(500).json({ message: error });
  }

  @Get("getYearlyConsolidatedPivotTable/:year")
  async getYearlyConsolidated(
    @Param("year") year: number,
    @Req() @User("uid") userId: string,
    @Res() res: Response,
  ) {
    const result = await this.expensesService.getYearlyConsolidatedPivotTable(Number(year), userId);
    return res.status(200).json(result);
  }

  @Get("getMonthlyConsolidatedPivotTable/:year")
  async getMonthlyConsolidatedPivotTable(
    @Param("year") year: number,
    @Req() @User("uid") userId: string,
    @Res() res: Response,
  ) {
    const result = await this.expensesService.getMonthlyConsolidatedPivotTable(
      Number(year),
      userId,
    );
    return res.status(200).json(result);
  }
}
