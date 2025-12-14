import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { expiresIn, FirebaseService } from "./firebase.service";
import { Response } from "express";
import { IUser, LoginResponse } from "common-types/dist/types/auth";
@Controller("auth")
export default class FirebaseController {
  private firebaseService: FirebaseService;
  constructor() {
    this.firebaseService = new FirebaseService();
  }

  public sendAuthenticatedResponse = (res: Response, user: IUser | null, sessionCookie: string) => {
    if (user) {
      const { uid, name, email, picture, authType, role } = user;
      return (
        res
          .status(200)
          // Create a signed cookie (session)
          // 4. Set secure HTTP-only cookie
          .cookie("session", sessionCookie, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge: expiresIn,
          })
          .json({
            message: "Authenticated",
            user: { uid, name, email, picture, authType, role },
          } as LoginResponse)
      );
    }
    return res.status(400).json({ message: "Failed to Authenticate" });
  };

  /** --------------------- SESSION CHECK ---------------------------- */
  @Get("isAuthenticated")
  public async isAuthenticated(@Req() req: any, @Res() res: Response) {
    try {
      const sessionCookie = req.cookies?.session;
      if (!sessionCookie) {
        throw new UnauthorizedException("No session cookie");
      }

      // verify session cookie
      const decoded = await this.firebaseService.verifySessionCookie(sessionCookie);

      // get Mongo user
      const user = await this.firebaseService.authenticateUserFromFirebase(decoded);

      return this.sendAuthenticatedResponse(res, user, sessionCookie);
    } catch (error) {
      throw new UnauthorizedException("Session expired or invalid");
    }
  }

  /** -------------------------- SIGNIN ----------------------------- */
  @Post("signin")
  async signin(@Body("idToken") idToken: string, @Res() res: Response) {
    try {
      // 1. Decode the Firebase ID token
      const decoded = await this.firebaseService.verifyIdToken(idToken);

      // 2. Create / find user in MongoDB
      const user = await this.firebaseService.authenticateUserFromFirebase(decoded);

      // 3. Create Firebase SESSION COOKIE
      const sessionCookie = await this.firebaseService.createSessionCookie(idToken);

      return this.sendAuthenticatedResponse(res, user, sessionCookie);
    } catch (error) {
      return res.status(400).json({ message: error || "Failed to Authenticate" });
    }
  }

  /** -------------------------- SIGNOUT ----------------------------- */
  @Post("signout")
  async signout(@Res() res: Response) {
    res.clearCookie("session", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return res.status(200).send({ message: "Logged out" });
  }
}
