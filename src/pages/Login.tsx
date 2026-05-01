import { Navigate } from "react-router-dom";

// /login is kept as a redirect for backwards-compatibility.
// All authentication is handled by /auth.
const Login = () => <Navigate to="/auth" replace />;

export default Login;
