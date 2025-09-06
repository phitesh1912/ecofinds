// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";
import { arrayUnion, arrayRemove } from "firebase/firestore";

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "true";
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [myOwner, setMyOwner] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const ref = doc(db, "products", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setP(null);
      } else {
        const data = { id: snap.id, ...snap.data() };
        setP(data);
        setForm({ title: data.title, description: data.description, category: data.category, price: data.price });
        setMyOwner(user && data.ownerId === user.uid);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const addToCart = async () => {
    if (!user) return alert("Login required");
    const uref = doc(db, "users", user.uid);
    await updateDoc(uref, { cart: arrayUnion(id) });
    alert("Added to cart");
  };

  const removeFromCart = async () => {
    if (!user) return;
    const uref = doc(db, "users", user.uid);
    await updateDoc(uref, { cart: arrayRemove(id) });
    alert("Removed from cart");
  };

  const saveChanges = async () => {
    if (!myOwner) return alert("Not allowed");
    await updateDoc(doc(db, "products", id), {
      ...form
    });
    alert("Saved");
  };

  const del = async () => {
    if (!myOwner) return;
    if (!confirm("Delete product?")) return;
    await deleteDoc(doc(db, "products", id));
    alert("Deleted");
    window.location.href = "/my-listings";
  };

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!p) return <div style={{ padding: 16 }}>Product not found</div>;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <img src={p.imageURL} alt={p.title} style={{ width: 420, height: 300, objectFit: "cover", borderRadius: 8 }} />
        <div>
          {editMode && myOwner ? (
            <div style={{ display: "grid", gap: 8 }}>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={6} />
              <input value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} type="number" />
              <div>
                <button onClick={saveChanges}>Save</button>
                <button onClick={del} style={{ marginLeft: 8 }}>Delete</button>
              </div>
            </div>
          ) : (
            <div>
              <h2>{p.title}</h2>
              <div style={{ color: "#666" }}>{p.category}</div>
              <div style={{ marginTop: 8 }}>{p.description}</div>
              <div style={{ marginTop: 12, fontWeight: 700 }}>₹{p.price}</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={addToCart}>Add to Cart</button>
                <button onClick={removeFromCart} style={{ marginLeft: 8 }}>Remove from Cart</button>
                {myOwner && <a href={`/product/${id}?edit=true`} style={{ marginLeft: 8 }}>Edit</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
