import { Injectable, OnModuleInit } from "@nestjs/common";
import * as admin from "firebase-admin";
// import * as jwt from "jsonwebtoken";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { UsersService } from "../users/users.service";
import { DecodedIdToken } from "firebase-admin/auth";
import { IUser } from "common-types/types/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

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

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

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
  authenticateUserFromFirebase = async (idToken: string): Promise<IUser | null> => {
    const decoded: DecodedIdToken = await this.verifyToken(idToken);

    let user = await this.usersService.findUserByUid(decoded.uid);

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

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return await admin.auth().verifyIdToken(token);
  }
}
