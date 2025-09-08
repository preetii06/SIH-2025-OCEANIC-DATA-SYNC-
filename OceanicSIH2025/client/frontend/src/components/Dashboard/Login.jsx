import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("user", JSON.stringify({ email: userCredential.user.email }));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔐 OceanicWeb Login</h2>
        <form style={styles.form} onSubmit={handleLogin}>
          <input
            type="email"
            placeholder=" Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder=" Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button style={styles.button} type="submit">
            Login
          </button>
          <div style={styles.signupText}>
            Don’t have an account?{" "}
            <a href="/signup" style={styles.link}>
              Sign Up
            </a>
          </div>
          {error && <div style={styles.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #004080, #66a6ff)",
    padding: 20,
  },
  card: {
    background: "#fff",
    padding: "40px 30px",
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    width: "350px",
    textAlign: "center",
    animation: "fadeIn 0.8s ease-in-out",
  },
  title: {
    marginBottom: 20,
    fontSize: "24px",
    fontWeight: "700",
    color: "#004080",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    padding: 12,
    fontSize: 15,
    borderRadius: 8,
    border: "1px solid #ccc",
    transition: "all 0.3s ease",
  },
  button: {
    padding: 12,
    fontSize: 16,
    background: "linear-gradient(90deg, #004080, #0073e6)",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  signupText: {
    marginTop: 15,
    fontSize: 14,
  },
  link: {
    color: "#0073e6",
    fontWeight: "600",
    textDecoration: "none",
    transition: "0.3s",
  },
  error: {
    color: "red",
    marginTop: 10,
    fontSize: 14,
  },
};

export default Login;