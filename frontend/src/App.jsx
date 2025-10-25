import Dashboard from "./pages/Dasboard";
import Login from "./pages/Login";
import { useAuth } from "./store/auth";

export default function App(){
  const { token } = useAuth();
  return token ? <Dashboard/> : <Login/>;
}
