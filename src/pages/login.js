import React, { useState } from "react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import "../styles/components/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(""); // Renamed state to avoid conflict
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate email format
    if (!validateEmail(email)) {
      setError("Please enter a valid email.");
      setLoading(false);
      return;
    }

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User signed in:", user);

      // Fetch user's role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role; // Fetch role from Firestore
        console.log("User role from Firestore:", userRole);

        // Check if the selected role matches the role in Firestore
        if (userRole !== selectedRole) {
          await auth.signOut();
          setError("The role you selected does not match your credentials.");
          setLoading(false);
          return;
        }

        // Redirect based on role
        if (userRole === "Admin") navigate("/admin-dashboard");
        else if (userRole === "Dealer") navigate("/dealer-dashboard");
        else navigate("/installer-dashboard");
      } else {
        setError("No user data found. Please contact support.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(`Failed to log in. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <label>Role:</label>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} required>
          <option value="">Select your role</option>
          <option value="Admin">Admin</option>
          <option value="Dealer">Dealer</option>
          <option value="Installer">Installer</option>
        </select>

        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p className="error-message">{error}</p>}

        <p className="link" onClick={() => navigate("/signup")}>
          Don't have an account? <span>Sign up</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
