export interface IUser {
  uid: string; // Firebase UID
  name?: string;
  email: string;
  role: "admin" | "user";
  authType: "google" | "password";
  picture?: string;
}

export interface LoginRequest {
  idToken: string;
}

export interface LoginResponse {
  message: string;
  user: IUser | null;
  token: string | null;
}
