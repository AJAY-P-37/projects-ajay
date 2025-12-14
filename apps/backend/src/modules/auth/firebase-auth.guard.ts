import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private firebase: FirebaseService) {}

  async use(req: any, res: any, next: () => void) {
    const sessionCookie = req.cookies?.session;

    if (!sessionCookie) {
      throw new UnauthorizedException("No session cookie provided");
    }

    try {
      const decoded = await this.firebase.verifySessionCookie(sessionCookie);
      req.user = decoded;
      next();
    } catch (err) {
      throw err;
    }
  }
}
