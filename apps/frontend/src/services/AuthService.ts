import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, Auth } from "firebase/auth";
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

  public loginWithPassword = (email: string, password: string) => {};

  public loginWithGoogle = async (): Promise<LoginResponse | null> => {
    return signInWithPopup(this.firebaseAuth, this.googleAuthProvider)
      .then(async (result) => {
        const user = result.user;
        const idToken = await user.getIdToken();

        const loginRequest: LoginRequest = { idToken };

        const { data, status } = await api.post("/api/auth/signin", loginRequest, {
          withCredentials: true,
        });
        if (data?.message === "Authenticated" && status === 200) {
          Toast.success(data.message);
          return data as LoginResponse;
        } else {
          Toast.error("Authentication Failed!");
          return null;
        }
      })
      .catch(async (error) => {
        await signOut(this.firebaseAuth);
        console.log(`Error in loginWithGoogle: ${error}`);
        throw Error(error);
      });
  };

  async isAuthenticated() {
    // const token = localStorage.getItem("authToken");

    // if (!token) return { isAuthenticated: false };
    try {
      const { data } = await api.get("/api/auth/isAuthenticated");

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

  public signupWithPassword = (email: string, password: string) => {};

  public signupWithGoogle = () => {};
}
