// src/pages/Purchases.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Purchases() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return setLoading(false);
      setLoading(true);
      try {
        const uref = doc(db, "users", user.uid);
        const usnap = await getDoc(uref);
        const purchases = usnap.exists() ? usnap.data().purchases || [] : [];

        // purchases is array of { productId, boughtAt }
        const proms = purchases.map(async (p) => {
          try {
            const psnap = await getDoc(doc(db, "products", p.productId));
            if (!psnap.exists()) {
              return { productId: p.productId, title: "(deleted)", price: 0, boughtAt: p.boughtAt };
            }
            const pdata = psnap.data();
            return {
              productId: p.productId,
              title: pdata.title,
              price: pdata.price,
              imageURL: pdata.imageURL,
              boughtAt: p.boughtAt,
            };
          } catch (err) {
            console.error("product fetch failed", err);
            return { productId: p.productId, title: "(error)", price: 0, boughtAt: p.boughtAt };
          }
        });

        const results = await Promise.all(proms);
        setItems(results);
      } catch (err) {
        console.error("Failed to load purchases", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return <div style={{ padding: 16 }}>Login to see purchases</div>;
  if (loading) return <div style={{ padding: 16 }}>Loading purchases...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Your Purchases</h2>
      {items.length === 0 && <div>No purchases yet</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,260px)", gap: 12, marginTop: 12 }}>
        {items.map((it) => (
          <div key={it.productId} style={{ border: "1px solid #ddd", padding: 10, borderRadius: 8 }}>
            <img
              src={it.imageURL || "https://via.placeholder.com/200"}
              alt={it.title}
              style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }}
            />
            <h4 style={{ marginTop: 8 }}>{it.title}</h4>
            <div>₹{it.price}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
              Bought: {it.boughtAt ? new Date(it.boughtAt).toLocaleString() : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
