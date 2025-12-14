import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { loginStart, loginSuccess, loginFailure, logout } from "../store/slices/authSlice";
import AuthService from "@/services/AuthService";
import { LoginResponse } from "common-types/types/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutAction } from "@/store/actions/globalActions";
import { persistor } from "@/store/store";
import { useEffect, useRef } from "react";

export const useLoginWithGoogle = () => {
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

type LoginWithEmailArgs = {
  email: string;
  password: string;
};

export const useLoginWithEmail = () => {
  const authService = new AuthService();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<LoginResponse | null, Error, LoginWithEmailArgs>({
    mutationFn: ({ email, password }) => authService.loginWithEmail(email, password),

    onMutate: () => {
      dispatch(loginStart());
    },

    onSuccess: async (data) => {
      if (!data) return;

      dispatch(loginSuccess(data));
      navigate("/");

      await queryClient.invalidateQueries({
        queryKey: ["auth", "isAuthenticated"],
      });
    },

    onError: (error) => {
      dispatch(loginFailure(error.message));
    },
  });
};

export const useSignupWithEmail = () => {
  const authService = new AuthService();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      return authService.signupWithEmail(payload.email, payload.password);
    },
    onMutate: () => {
      dispatch(loginStart());
    },

    onSuccess: async (data) => {
      if (!data) return;
      dispatch(loginSuccess(data));
      navigate("/");

      await queryClient.invalidateQueries({
        queryKey: ["auth", "isAuthenticated"],
      });
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
  const queryClient = useQueryClient();

  return async () => {
    await authService.signOut();

    dispatch(logout());
    dispatch(logoutAction());

    persistor.purge();

    queryClient.clear();

    navigate("/auth", { replace: true });
  };
};

export const useAuthCheck = () => {
  const authService = new AuthService();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasHandledRef = useRef(false);

  const query = useQuery({
    queryKey: ["auth", "isAuthenticated"],
    queryFn: () => authService.isAuthenticated(),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // if (hasHandledRef.current) return;

    // ✅ logged in
    if (query.isSuccess && query.data?.isAuthenticated) {
      dispatch(loginSuccess(query.data));
      return;
    }

    // 🚫 logged out or session expired
    if ((query.isSuccess && !query.data?.isAuthenticated) || query.isError) {
      hasHandledRef.current = true;

      dispatch(logout());
      dispatch(logoutAction());

      navigate("/auth", { replace: true });
    }
  }, [query.isSuccess, query.isError, query.data, dispatch, navigate]);

  return {
    isAuthenticated: query.data?.isAuthenticated ?? false,
    isLoading: query.isLoading || query.isFetching,
  };
};
