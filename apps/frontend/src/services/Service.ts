import axios from "axios";
import { AxiosError } from "axios";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";

export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error);
  },
);

export const isAuthError = (error: unknown) => {
  if (!(error instanceof AxiosError)) return false;

  const { status, data } = error.response || {};

  return (
    status === 401 &&
    typeof data?.message === "string" &&
    data.error.toLowerCase().includes("unauthorized")
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
        queryClient.invalidateQueries({
          queryKey: ["auth", "isAuthenticated"],
        });
      }
    },
  }),
});
