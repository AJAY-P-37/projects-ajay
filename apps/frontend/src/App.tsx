import "./App.css";
import { LoginForm } from "./pages/Auth/LoginOrSignup";
import { AppMainSidebar } from "./components/common/sidebar/app-sidebar";

function App() {
  return (
    <>
      <AppMainSidebar>
        <LoginForm />
      </AppMainSidebar>
    </>
  );
}

export default App;
