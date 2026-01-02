import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Save JWT token
        localStorage.setItem("token", data.token);

        // ✅ Save username for dashboard
        localStorage.setItem("username", username.trim());

        // ✅ Redirect to React Dashboard
        navigate("/dashboard");
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert("Backend server not running");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Secure Login</h2>

        <p className="login-subtitle">
          Access the Loan Eligibility Advisory Portal
        </p>

        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="login-btn" onClick={submit}>
          Sign In
        </button>

        <p className="switch-auth">
          New user?{" "}
          <span
            style={{ color: "#4cc9f0", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            Create Account
          </span>
        </p>

        <div className="login-footer">
          AI-Powered Credit Evaluation System
        </div>
      </div>
    </div>
  );
}
