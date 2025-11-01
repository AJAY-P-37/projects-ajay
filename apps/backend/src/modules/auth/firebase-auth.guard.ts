import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: FirebaseService) {}

  use(req: any, res: any, next: () => void) {
    const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) throw new UnauthorizedException("No token provided");

    try {
      const decoded = this.authService.verifyToken(token);
      req.user = decoded; // attach user to request
      next();
    } catch (err) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
