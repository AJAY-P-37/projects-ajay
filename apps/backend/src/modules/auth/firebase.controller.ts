import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { Response } from "express";
import { IUser, LoginResponse } from "common-types/types/auth";
import { UsersService } from "../users/users.service";

@Controller("auth")
export default class FirebaseController {
  private firebaseService: FirebaseService;
  private usersService: UsersService;
  constructor() {
    this.firebaseService = new FirebaseService();
    this.usersService = new UsersService();
  }

  public sendAuthenticatedResponse = (res: Response, user: IUser | null, idToken: string) => {
    if (user) {
      const { uid, name, email, picture, authType, role } = user;
      return (
        res
          .status(200)
          // Create a signed cookie (session)
          .cookie("token", idToken, {
            httpOnly: true,
            secure: true, //process.env.NODE_ENV === "production",
            sameSite: "none",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .json({
            message: "Authenticated",
            user: { uid, name, email, picture, authType, role },
            token: idToken,
          } as LoginResponse)
      );
    }
    return res.status(400).json({ message: "UnAuthenticated" });
  };

  @Get("isAuthenticated")
  public async verifyFirebaseToken(@Req() req: any, @Res() res: Response) {
    try {
      let idToken: string | undefined = undefined;

      // 1. Try cookie first (preferred)
      if (req.cookies?.token) {
        idToken = req.cookies.token;
      }
      // Express headers are lowercase and may be string or array
      // const authHeader = req.headers["authorization"];

      // if (!authHeader) {
      //   throw new UnauthorizedException("Missing Authorization header");
      // }

      // // If header is an array, pick the first element
      // const tokenString = Array.isArray(authHeader) ? authHeader[0] : authHeader;

      // if (!tokenString.startsWith("Bearer ")) {
      //   throw new UnauthorizedException("Invalid Authorization header format");
      // }

      // const idToken = tokenString.split(" ")[1]; // Extract the token

      // 3. If still no token, reject
      if (!idToken) {
        throw new UnauthorizedException("No token provided");
      }

      const decodedToken = await this.firebaseService.verifyToken(idToken);
      const user = await this.usersService.findUserByUid(decodedToken.uid);

      return this.sendAuthenticatedResponse(res, user, idToken);
    } catch (err: any) {
      throw new UnauthorizedException(err.message);
    }
  }

  @Post("signin")
  async userAuth(@Body("idToken") idToken: string, @Res() res: Response) {
    const user: IUser | null = await this.firebaseService.authenticateUserFromFirebase(idToken);
    return this.sendAuthenticatedResponse(res, user, idToken);
  }

  @Post("signout")
  async logout(@Res() res: Response) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    return res.json({ message: "Logged out" });
  }
}
