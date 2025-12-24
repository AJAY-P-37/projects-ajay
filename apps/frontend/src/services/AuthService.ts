import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { firebaseApp } from "@/modules/firebase/firebase";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { IUser, LoginRequest, LoginResponse } from "common-types/types/auth";
import { api } from "./Service";
export interface IToken {
  token: string;
}

export default class AuthService {
  public googleAuthProvider: GoogleAuthProvider;
  public firebaseAuth: Auth;

  constructor() {
    this.googleAuthProvider = new GoogleAuthProvider();
    this.firebaseAuth = getAuth(firebaseApp);
  }

  public getFirebaseAuth = () => {
    return this.firebaseAuth;
  };

  public loginWithEmail = async (
    email: string,
    password: string,
  ): Promise<LoginResponse | null> => {
    try {
      // 1. Firebase Email/Password Login
      const result = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
      const user = result.user;

      // 2. Get Firebase ID Token
      const idToken = await user.getIdToken();

      // 3. Send to your backend for session creation
      const loginRequest: LoginRequest = { idToken };

      const { data, status } = await api.post("/api/auth/signin", loginRequest);

      if (data?.message === "Authenticated" && status === 200) {
        Toast.success(data.message);
        return data as LoginResponse;
      } else {
        Toast.error("Authentication Failed!");
        return null;
      }
    } catch (error: any) {
      // Logout from Firebase on failure
      await signOut(this.firebaseAuth);
      Toast.error(
        error.response?.data?.message?.message || error.response?.data?.message || error?.message,
      );
      console.error(`Error in loginWithEmail: ${error}`);
    }
  };
  public signupWithEmail = async (
    email: string,
    password: string,
  ): Promise<LoginResponse | null> => {
    try {
      // 1. Create account in Firebase
      const result = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);

      // 2. Fetch Firebase ID token
      const idToken = await result.user.getIdToken();

      // 3. Hit your backend to create user in MongoDB + set cookie
      const { data, status } = await api.post(
        "/api/auth/signin", // backend automatically creates user on first login
        { idToken },
      );

      if (status === 200 && data?.message === "Authenticated") {
        Toast.success("Account created successfully!");
        return data as LoginResponse;
      } else {
        Toast.error("Signup failed!");
        return null;
      }
    } catch (error) {
      await signOut(this.firebaseAuth);
      Toast.error(
        error.response?.data?.message?.message || error.response?.data?.message || error?.message,
      );
      console.error("Error in signupWithEmail:", error);
    }
  };

  public loginWithGoogle = async (): Promise<LoginResponse | null> => {
    return signInWithPopup(this.firebaseAuth, this.googleAuthProvider)
      .then(async (result) => {
        const user = result.user;
        const idToken = await user.getIdToken();

        const loginRequest: LoginRequest = { idToken };

        const { data, status } = await api.post("/api/auth/signin", loginRequest);
        if (data?.message === "Authenticated" && status === 200) {
          Toast.success(data.message);
          return data as LoginResponse;
        } else {
          Toast.error(data?.message?.message || data.message);
          return null;
        }
      })
      .catch(async (error) => {
        await signOut(this.firebaseAuth);
        Toast.error(
          error.response?.data?.message?.message || error.response?.data?.message || error?.message,
        );
        console.error(`Error in loginWithGoogle: ${error}`);
        throw Error(error);
      });
  };

  async isAuthenticated() {
    try {
      const { data } = await api.get("/api/auth/isAuthenticated");
      if (!data.user && data.message !== "isAuthenticated") {
        return { isAuthenticated: false };
      }
      return { isAuthenticated: true, user: data.user };
    } catch {
      return { isAuthenticated: false };
    }
  }

  signOut = async () => {
    const { data } = await api.post("/api/auth/signout");
    await signOut(this.firebaseAuth);
    if (data?.message) {
      Toast.success(data.message);
    }
  };
}
