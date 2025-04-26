// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginComponent from "./components/LoginComponent";
import SignupComponent from "./components/SignUp";
import ImageScroller from "./components/ImageScroller";

function AppRoutes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/signup", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {user && (
        <header
          style={{
            flex: "0 0 auto",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "0.5rem 1rem",
            background: "#fafafa",
            borderBottom: "1px solid #ddd",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 10,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              background: "#e53e3e",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </header>
      )}

      <main style={{ flex: "1 1 auto", overflow: "auto" }}>
        <Routes>
          <Route
            path="/"
            element={user ? <ImageScroller /> : <Navigate to="/login" replace />}
          />
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/signup" element={<SignupComponent />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
