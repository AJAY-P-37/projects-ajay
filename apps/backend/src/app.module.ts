import { Module } from "@nestjs/common";
// import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";

@Module({
  imports: [AuthModule, UsersModule, ExpensesModule],
})
export class AppModule {}
