import { useEffect, useState } from "react";
import "./App.css";
// import "shadcn-lib/dist/styles/globals.css";
import { Login } from "./pages/Auth/LoginOrSignup";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  return (
    <>
      {/* <Expenses props={{}} /> */}

      <Login />
    </>
  );
}

export default App;
