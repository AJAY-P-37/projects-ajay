import axios from "axios";
import { AxiosError } from "axios";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
});

// Normalize all errors here
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 500,
      message:
        typeof error.response?.data?.error === "string" &&
        error.response?.data?.error?.toLowerCase() === "unauthorized"
          ? "Unauthorized"
          : error.response?.data?.error?.message ||
            error.response?.data?.message ||
            "Unexpected server error",
      code: error.response?.data?.error?.code,
    };

    return Promise.reject(apiError);
  },
);

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export const isAuthError = (error: any) => {
  if (!error || typeof error !== "object") return false;
  // if (!(error instanceof AxiosError)) return false;

  const { status, message } = error || {};

  return (
    status === 401 && typeof message === "string" && message.toLowerCase().includes("unauthorized")
  );
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // ⚠️ do not invalidate auth query itself
      if (isAuthError(error) && query.queryKey[0] !== "auth") {
        Toast.error("Session expired. Please log in again.");
        queryClient.invalidateQueries({
          queryKey: ["auth", "isAuthenticated"],
        });
      }
    },
  }),

  mutationCache: new MutationCache({
    onError: (error) => {
      if (isAuthError(error)) {
        Toast.error("Session expired. Please log in again.");
        queryClient.invalidateQueries({
          queryKey: ["auth", "isAuthenticated"],
        });
      }
    },
  }),
});
