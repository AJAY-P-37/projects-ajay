import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import * as admin from "firebase-admin";
import { UsersService } from "../users/users.service";
import { DecodedIdToken } from "firebase-admin/auth";
import { IUser } from "common-types/dist/types/auth";
import { Bucket } from "@google-cloud/storage";

// import * as jwt from "jsonwebtoken";

const serviceAccount = {
  type: process.env.ACCOUNT_TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};
@Injectable()
export class FirebaseService implements OnModuleInit {
  // private readonly jwtSecret = process.env.JWT_SECRET || "supersecret";
  private usersService = new UsersService();

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }
  }

  getFirebaseStorage = (): Bucket => {
    return admin.storage().bucket(process.env.STORAGE_BUCKET);
  };

  /** 🔹 Helper: Generate signed URL */
  getDownloadUrlFromFirebaseStorageBucket = async (filePath: string): Promise<string> => {
    const storageBucket: Bucket = this.getFirebaseStorage();

    const file = storageBucket.file(filePath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-09-2030",
    });
    return url;
  };

  authenticateUserFromFirebase = async (idToken: string): Promise<IUser | null> => {
    const decoded: DecodedIdToken = await this.verifyToken(idToken);

    let user = await this.usersService.findUserByUid(decoded.uid);
    // await admin.auth().revokeRefreshTokens(decoded.uid);

    if (!user) {
      user = await this.usersService.createUser({
        uid: decoded.uid,
        name: decoded.name || decoded.email,
        email: decoded.email || "",
        picture: decoded.picture,
        authType: decoded.firebase.sign_in_provider === "google.com" ? "google" : "password",
        role: "user",
      });
    }

    return user;

    // const user = await UserModel.findOneAndUpdate(
    //   { uid: firebaseUid },
    //   {
    //     uid: firebaseUid,
    //     email,
    //     name,
    //     picture,
    //     authType: provider === "google.com" ? "google" : "password",
    //   },
    //   { upsert: true, new: true },
    // );
  };

  async verifyToken(token: string) {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (err: any) {
      if (err?.code === "auth/id-token-expired") {
        throw new UnauthorizedException("id-token-expired");
      }

      throw new UnauthorizedException(err.message || "Invalid token");
    }
  }
}
