import "./App.css";
// import "shadcn-lib/dist/styles/globals.css";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { ROUTER } from "./routes/routes";
import { persistor, store } from "./store/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistGate } from "redux-persist/integration/react";

function App() {
  const queryClient = new QueryClient();
  return (
    <>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={ROUTER} />
          </QueryClientProvider>{" "}
        </PersistGate>
      </Provider>
    </>
  );
}

export default App;
