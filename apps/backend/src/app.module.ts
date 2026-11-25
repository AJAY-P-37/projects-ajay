import { Module } from "@nestjs/common";
// import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { IncomeModule } from "./modules/income/income.module";
import { SettingsModule } from "./modules/settings/settings.module";

@Module({
  imports: [AuthModule, UsersModule, ExpensesModule, IncomeModule, SettingsModule],
})
export class AppModule {}
