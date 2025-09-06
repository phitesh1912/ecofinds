// src/App.jsx
import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

// pages
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import MyListings from "./pages/MyListings.jsx";
import Browse from "./pages/Browse.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Purchases from "./pages/Purchases.jsx";

export default function App() {
  const { user, logout } = useAuth() || {}; // defensive: in case useAuth returns undefined

  // simple inline styles kept to match your existing style approach
  const containerStyle = { maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "system-ui, Arial" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" };
  const navGroupStyle = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" };
  const linkStyle = { textDecoration: "none", color: "#064e3b" };
  const buttonStyle = { marginLeft: 6, padding: "6px 10px", borderRadius: 6, cursor: "pointer" };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <Link to="/" style={{ textDecoration: "none", fontSize: 20, fontWeight: 700, color: "#064e3b" }}>
          EcoFinds
        </Link>

        <nav>
          {user ? (
            <div style={navGroupStyle}>
              {/* Primary navigation for logged-in users */}
              <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
              <Link to="/browse" style={linkStyle}>Browse</Link>
              <Link to="/add-product" style={linkStyle}>Add Product</Link>
              <Link to="/my-listings" style={linkStyle}>My Listings</Link>
              <Link to="/cart" style={linkStyle}>Cart</Link>
              <Link to="/purchases" style={linkStyle}>Purchases</Link>

              <button
                onClick={() => logout?.()}
                style={buttonStyle}
                title="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={navGroupStyle}>
              {/* Navigation for visitors */}
              <Link to="/login" style={linkStyle}>Login</Link>
              <Link to="/signup" style={linkStyle}>Sign Up</Link>
              <Link to="/browse" style={linkStyle}>Browse</Link>
            </div>
          )}
        </nav>
      </header>

      <main style={{ marginTop: 20 }}>
        <Routes>
          {/* root: take user to dashboard if logged in, otherwise show browse page */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/browse"} replace />} />

          {/* Auth */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes (guard with Navigate to /login if not authenticated) */}
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/add-product"
            element={user ? <AddProduct /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/my-listings"
            element={user ? <MyListings /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/cart"
            element={user ? <Cart /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/purchases"
            element={user ? <Purchases /> : <Navigate to="/login" replace />}
          />

          {/* Public pages */}
          <Route path="/browse" element={<Browse />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

