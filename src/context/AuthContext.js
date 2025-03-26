import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// Create Auth Context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Stop loading after checking auth state
    });

    return () => unsubscribe();
  }, []);

  // Force logout when app starts (Prevents auto-login)
  useEffect(() => {
    signOut(auth);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully!");
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom Hook to Use Auth Context
export function useAuth() {
  return useContext(AuthContext);
}
