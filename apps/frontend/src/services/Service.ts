import axios from "axios";
import { auth } from "./FirebaseService";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
});

export const getFreshToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  // force refresh
  return await user.getIdToken(true);
};

// let isRefreshing = false;
// let pendingRequests: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    // If Axios couldn't even reach the server
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    const isExpired =
      status === 401 &&
      typeof data?.message === "string" &&
      data.message.includes("id-token-expired");

    if (isExpired) {
      Toast.error("Session expired. Please login again.");
      // ✅ You may also want to logout user here
      // dispatch(logout());
      return Promise.reject(error);
    }

    // ✅ Just pass all other errors up
    return Promise.reject(error);
  },
);

// api.interceptors.request.use(async (config) => {
//   const user = auth.currentUser;
//   if (user) {
//     const token = await user.getIdToken();
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });
