import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { loginStart, loginSuccess, loginFailure, logout } from "../store/slices/authSlice";
import AuthService from "@/services/AuthService";
import { LoginResponse } from "common-types/types/auth";
import { useNavigate, useLocation } from "react-router-dom";

export const useLogin = () => {
  const authService = new AuthService();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.loginWithGoogle,
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: async (data: LoginResponse) => {
      localStorage.setItem("authToken", data.token);
      dispatch(loginSuccess(data));
      navigate("/", { state: { from: location } });
      // Invalidate relevant TanStack Query caches if needed
      // Refetch authentication state
      await queryClient.invalidateQueries({ queryKey: ["auth", "isAuthenticated"] });
    },
    onError: (error) => {
      dispatch(loginFailure(error.message));
    },
  });
};

export const useLogout = () => {
  const authService = new AuthService();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  return async () => {
    await authService.signOut();
    localStorage.removeItem("authToken");
    dispatch(logout());
    navigate("/auth", { state: { from: location } });
    // Invalidate relevant TanStack Query caches if needed
    // Refetch authentication state
    await queryClient.invalidateQueries({ queryKey: ["auth", "isAuthenticated"] });
  };
};

export const useAuthCheck = () => {
  const authService = new AuthService();

  const query = useQuery({
    queryKey: ["auth", "isAuthenticated"],
    queryFn: async () => {
      return await authService.isAuthenticated();
    },
    retry: false,
    staleTime: 0, // Never trust old cache
    refetchOnWindowFocus: false, // Recheck when tab is focused
    refetchOnMount: "always", // Always revalidate when the component mounts
  });

  return {
    isAuthenticated: query.data?.isAuthenticated || false,
    isLoading: query.isLoading || query.isFetching,
    data: query.data,
    refetch: query.refetch,
  };
};
