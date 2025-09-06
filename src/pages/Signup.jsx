// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (!form.username.trim()) throw new Error("Username required");
      await signup(form.email, form.password, form.username.trim());
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h2>Sign Up</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          required
          minLength={6}
        />
        <input
          name="username"
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={onChange}
          required
        />
        <button type="submit">Create Account</button>
        {error && <div style={{ color: "red" }}>{error}</div>}
      </form>
      <p style={{ marginTop: 8 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
