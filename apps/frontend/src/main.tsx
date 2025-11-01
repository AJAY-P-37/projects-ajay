import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";
import App from "./App";
import { ThemeProvider } from "./context/global/ThemeProvider";
import { Toaster } from "shadcn-lib/dist/components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
);
