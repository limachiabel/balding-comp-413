import { useState } from "react";
import { auth, db } from "../firebaseConfig"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; 
import { useNavigate } from "react-router-dom"; // ✅ Import navigation hook

export default function SignupComponent() {
  const authContext = useAuth(); 
  const navigate = useNavigate(); // ✅ Initialize navigation
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null); 

    try {
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;


      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
      });

      authContext.login(email, password);

      console.log("Signup successful!");
    } catch (error) {
      console.error("Signup error:", error.message);
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
        Sign Up
      </h2>
      <form 
        onSubmit={handleSignup} 
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
          Sign Up
        </button>
      </form>
      <p>
        Already have an account?  
        <span 
          onClick={() => navigate("/login")}  // ✅ Redirect to login page
          style={{ color: "#3B82F6", cursor: "pointer", marginLeft: "5px" }}
        >
          Log In
        </span>
      </p>
    </div>
  );
}
