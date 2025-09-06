// src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ p }) {
  // p is a product doc object with id and fields
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, width: 260 }}>
      <Link to={`/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <img src={p.imageURL || "https://via.placeholder.com/300x200"} alt={p.title} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 6 }} />
        <h3 style={{ margin: "8px 0 4px" }}>{p.title}</h3>
        <div style={{ color: "#666", fontSize: 14 }}>{p.category}</div>
        <div style={{ marginTop: 8, fontWeight: 700 }}>₹{p.price}</div>
      </Link>
    </div>
  );
}
