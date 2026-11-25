import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private firebase: FirebaseService) {}

  async use(req: any, res: any, next: () => void) {
    const fullUrl = req.originalUrl || req.url || req.baseUrl || req.path || "";

    // Fast-path bypass for public authentication endpoints & CORS preflights
    if (
      req.method === "OPTIONS" ||
      fullUrl.includes("/auth/signin") ||
      fullUrl.includes("/auth/signout") ||
      fullUrl.endsWith("/signin") ||
      fullUrl.endsWith("/signout")
    ) {
      return next();
    }

    // Support both __session (required by Firebase Hosting CDN) and session (fallback/dev)
    const sessionCookie = req.cookies?.__session || req.cookies?.session;
    console.log(
      `[AuthMiddleware] fullUrl=${fullUrl}, path=${req.path}, method=${req.method}, sessionCookie=${sessionCookie ? "present" : "undefined"}`
    );

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
