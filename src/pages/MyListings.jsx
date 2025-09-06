// src/pages/MyListings.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function MyListings() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const q = query(collection(db, "products"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);
      setList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, [user]);

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    setList(l => l.filter(p => p.id !== id));
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>My Listings</h2>
      <div style={{ marginBottom: 12 }}><Link to="/add-product">Add New Product</Link></div>
      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 260px)", gap: 12 }}>
          {list.length === 0 && <div>No listings yet</div>}
          {list.map(p => (
            <div key={p.id} style={{ border: "1px solid #ddd", padding: 8, borderRadius: 8 }}>
              <img src={p.imageURL} alt={p.title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />
              <h3>{p.title}</h3>
              <div>₹{p.price}</div>
              <div style={{ marginTop: 8 }}>
                <Link to={`/product/${p.id}`} style={{ marginRight: 8 }}>View</Link>
                <Link to={`/product/${p.id}?edit=true`} style={{ marginRight: 8 }}>Edit</Link>
                <button onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
