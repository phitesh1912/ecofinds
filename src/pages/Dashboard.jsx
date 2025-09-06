// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, profile, updateUsername, logout } = useAuth() || {};
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // set username when profile arrives
    if (profile && profile.username) setUsername(profile.username);
  }, [profile]);

  // Defensive: if useAuth didn't return expected funcs, show an error in console
  useEffect(() => {
    if (!user) {
      // not logged in — fine if redirect handled elsewhere
      console.debug("Dashboard: no user (not logged in)");
    }
    if (!updateUsername || !logout) {
      console.warn("Dashboard: auth helpers missing", { updateUsername, logout });
    }
  }, [user, updateUsername, logout]);

  const handleSave = async () => {
    setStatus("");
    try {
      if (!username || !username.trim()) {
        setStatus("Username cannot be empty");
        return;
      }
      if (typeof updateUsername !== "function") {
        setStatus("Cannot save: updateUsername not available");
        return;
      }
      await updateUsername(username.trim());
      setStatus("Saved!");
      setTimeout(() => setStatus(""), 1500);
    } catch (err) {
      console.error("Failed to save username:", err);
      setStatus("Save failed");
    }
  };

  // If user is not present, render a friendly message (or you can redirect)
  if (!user) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: 16 }}>
        <h2>Dashboard</h2>
        <p>You are not logged in. Please <a href="/login">login</a>.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 16 }}>
      <h2>Dashboard</h2>
      <div style={{ marginTop: 12 }}>
        <div><strong>Email:</strong> {user?.email || "—"}</div>

        <div style={{ marginTop: 8 }}>
          <label>
            <div><strong>Username</strong></div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
          </label>
        </div>

        <div style={{ marginTop: 8 }}>
          <button onClick={handleSave}>Save</button>
          <button
            onClick={() => {
              if (typeof logout === "function") logout();
              else console.warn("logout not available");
            }}
            style={{ marginLeft: 8 }}
          >
            Logout
          </button>
        </div>

        {status && <div style={{ marginTop: 8 }}>{status}</div>}
      </div>
    </div>
  );
}
