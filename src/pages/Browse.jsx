// src/pages/Browse.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard.jsx";

export default function Browse() {
  const [all, setAll] = useState([]);
  const [search, setSearch] = useState("");   // renamed from `q`
  const [cat, setCat] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const colRef = collection(db, "products");
        const qRef = query(colRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(qRef);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAll(items);
      } catch (err) {
        console.error("Failed to load products:", err);
        // fallback: try without orderBy if createdAt index missing
        try {
          const snap2 = await getDocs(collection(db, "products"));
          setAll(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err2) {
          console.error("Fallback load also failed:", err2);
          setAll([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cats = Array.from(new Set(all.map(p => p.category || "Other")));

  const filtered = all.filter(p => {
    if (cat && p.category !== cat) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h2>Browse Products</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search title"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 260px)", gap: 12 }}>
          {filtered.length === 0 && <div>No products</div>}
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
