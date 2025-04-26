import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginComponent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!auth || !auth.login) {
      console.error("AuthContext is not providing the login function");
      setError("Authentication service is unavailable. Please try again.");
      return;
    }

    try {
      await auth.login(email, password);
      console.log("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error.message);
      setError(error.message);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "#f3f4f6"
    }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "16px" }}>
        Login
      </h2>
      <form 
        onSubmit={handleSubmit} 
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          width: "320px"
        }}
      >
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#374151", marginBottom: "4px" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "6px"
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#374151", marginBottom: "4px" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "6px"
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            backgroundColor: "#3B82F6",
            color: "white",
            padding: "10px",
            borderRadius: "6px",
            cursor: "pointer",
            border: "none",
            fontSize: "1rem"
          }}
        >
          Log In
        </button>
      </form>

      <p style={{ marginTop: "10px", fontSize: "14px", color: "#374151" }}>
        Don't have an account?  
        <span 
          onClick={() => navigate("/signup")} 
          style={{ color: "#3B82F6", cursor: "pointer", marginLeft: "5px" }}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
}
