import { Controller, Get, Req } from "@nestjs/common";

@Controller("users")
export class UsersController {
  // @UseGuards(FirebaseAuthGuard)
  @Get("profile")
  getProfile(@Req() req: any) {
    // req.user comes from FirebaseAuthGuard
    return {
      message: "User profile fetched successfully",
      user: "req.user,",
    };
  }
}
