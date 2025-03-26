import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginComponent from "./components/LoginComponent";
import SignupComponent from "./components/SignUp";
import ImageScroller from "./components/ImageScroller";

export default function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <ImageScroller /> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/signup" element={<SignupComponent />} />
      </Routes>
    </Router>
  );
}
