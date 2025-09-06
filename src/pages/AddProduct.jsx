// src/pages/AddProduct.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "" });
  const [loading, setLoading] = useState(false);
  const placeholder = "https://via.placeholder.com/600x400";

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Login required");
    setLoading(true);
    try {
      const col = collection(db, "products");
      const docRef = await addDoc(col, {
        title: form.title,
        description: form.description,
        category: form.category || "Other",
        price: Number(form.price) || 0,
        imageURL: placeholder,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      navigate(`/product/${docRef.id}`);
    } catch (err) {
      console.error("Add product error", err);
      alert("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2>Add Product</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input name="title" placeholder="Title" value={form.title} onChange={onChange} required />
        <input name="category" placeholder="Category" value={form.category} onChange={onChange} />
        <textarea name="description" placeholder="Description" value={form.description} onChange={onChange} rows={4} />
        <input name="price" placeholder="Price" value={form.price} onChange={onChange} type="number" />
        <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
      </form>
    </div>
  );
}
