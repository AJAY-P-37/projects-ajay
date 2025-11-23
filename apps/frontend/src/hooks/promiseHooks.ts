import { useReducer, useCallback } from "react";

// ---------------- TYPES ----------------
interface State {
  loading: boolean;
  success: boolean;
  error: string | null;
}

type Action =
  | { type: "START" }
  | { type: "SUCCESS" }
  | { type: "ERROR"; payload: string }
  | { type: "RESET" };

const initialState: State = {
  loading: false,
  success: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return { loading: true, success: false, error: null };
    case "SUCCESS":
      return { loading: false, success: true, error: null };
    case "ERROR":
      return { loading: false, success: false, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ---------------- HOOK ----------------
export const usePromise = <T>() => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const run = useCallback(async (promiseFn: () => Promise<T>): Promise<T | null> => {
    dispatch({ type: "START" });
    try {
      const result = await promiseFn();
      dispatch({ type: "SUCCESS" });
      return result;
    } catch (err: any) {
      dispatch({ type: "ERROR", payload: err?.message || "Something went wrong" });
      return null;
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    ...state,
    run,
    reset,
  };
};
