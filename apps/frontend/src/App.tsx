import "./App.css";
// import "shadcn-lib/dist/styles/globals.css";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { ROUTER } from "./routes/routes";
import { store } from "./store/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();
  return (
    <>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={ROUTER} />
        </QueryClientProvider>
      </Provider>
    </>
  );
}

export default App;
