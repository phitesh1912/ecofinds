// src/pages/Cart.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Cart() {
  const { user, getCart, setCartQty, removeFromCart, checkoutCart } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  // load cart when auth/profile changes
  useEffect(() => {
    setLoading(true);
    try {
      const cur = getCart ? getCart() : [];
      setItems(cur);
    } catch (err) {
      console.error("Failed to read cart:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getCart, user]);

  // helper: recalc total
  const total = items.reduce((acc, it) => acc + (Number(it.pr) || 0) * (Number(it.qty) || 0), 0);

  // update qty locally and in backend
  const onQty = async (id, qty) => {
    if (!id) return;
    const q = Number(qty) || 0;
    // optimistic UI
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, qty: q } : it)).filter(it => it.qty > 0));
    try {
      await setCartQty(id, q);
    } catch (err) {
      console.error("setCartQty failed:", err);
      setMsg("Failed to update cart. Try again.");
      // reload cart to be safe
      const cur = getCart ? getCart() : [];
      setItems(cur);
    }
  };

  const onRemove = async (id) => {
    if (!id) return;
    // optimistic UI
    setItems((cur) => cur.filter((it) => it.id !== id));
    try {
      await removeFromCart(id);
    } catch (err) {
      console.error("removeFromCart failed:", err);
      setMsg("Failed to remove item. Try again.");
      const cur = getCart ? getCart() : [];
      setItems(cur);
    }
  };

  const onCheckout = async () => {
    if (!items || items.length === 0) {
      setMsg("Your cart is empty.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await checkoutCart();
      if (res && res.success) {
        setMsg("Checkout successful — redirecting to Purchases...");
        // small delay so user sees the message
        setTimeout(() => {
          nav("/purchases");
        }, 700);
      } else {
        setMsg(res?.message || "Checkout failed");
      }
    } catch (err) {
      console.error("checkout failed:", err);
      setMsg(err.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Your Cart</h2>
        <div>Please log in to view and checkout your cart.</div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 16 }}>Loading cart...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Your Cart</h2>

      {items.length === 0 ? (
        <div style={{ padding: 16, color: "#666" }}>Your cart is empty.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                border: "1px solid #eee",
                padding: 12,
                borderRadius: 8,
                background: "#fff",
              }}
            >
              <div style={{ width: 120, height: 80, background: "#f3f3f3", borderRadius: 6, overflow: "hidden" }}>
                <img
                  src={it.img || "https://via.placeholder.com/320x180?text=Image"}
                  alt={it.t || "product"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{it.t || "Untitled product"}</div>
                <div style={{ color: "#666", marginTop: 6 }}>₹{it.pr}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 13 }}>Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={it.qty || 1}
                    onChange={(e) => onQty(it.id, Number(e.target.value || 1))}
                    style={{ width: 80, padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd" }}
                  />
                  <button
                    onClick={() => onRemove(it.id)}
                    style={{ marginLeft: 8, padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ textAlign: "right", minWidth: 120 }}>
                <div style={{ fontWeight: 600 }}>₹{(Number(it.pr) || 0) * (Number(it.qty) || 0)}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{it.id}</div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Total: ₹{total}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  // navigate back to browse
                  nav("/browse");
                }}
                style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
              >
                Continue shopping
              </button>

              <button
                onClick={onCheckout}
                disabled={busy}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "#059669",
                  color: "#fff",
                  border: "none",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                {busy ? "Processing..." : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && <div style={{ marginTop: 12, color: "#064e3b" }}>{msg}</div>}
    </div>
  );
}
