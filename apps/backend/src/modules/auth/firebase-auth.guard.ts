import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: FirebaseService) {}

  async use(req: any, res: any, next: () => void) {
    const token = req.cookies?.token;
    if (!token) throw new UnauthorizedException("No token provided");

    try {
      const decoded = await this.authService.verifyToken(token);
      req.user = decoded; // attach user to request
      next();
    } catch (err) {
      throw err;
    }
  }
}
