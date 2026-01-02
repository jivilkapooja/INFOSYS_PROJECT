import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone_number, setPhone] = useState("");
  const nav = useNavigate();

  const register = async () => {
    if (!username || !password || !phone_number) {
      alert("All fields are required");
      return;
    }

    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
        phone_number: phone_number.trim()
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registration successful");
      nav("/login");
    } else {
      alert(data.msg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Account</h2>

        <p className="login-subtitle">
          Register to access AI Loan Eligibility Advisor
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

        <input
          placeholder="Phone Number"
          value={phone_number}
          onChange={e => setPhone(e.target.value)}
        />

        <button className="login-btn" onClick={register}>
          Register
        </button>

        <p className="switch-auth">
          Already have an account?{" "}
          <span
            style={{ color: "#4cc9f0", cursor: "pointer" }}
            onClick={() => nav("/login")}
          >
            Login
          </span>
        </p>

        <div className="login-footer">
          AI-Powered Credit Evaluation System
        </div>
      </div>
    </div>
  );
}
