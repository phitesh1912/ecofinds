/* eslint-disable react-refresh/only-export-components */
/*
  AuthContext.jsx
  - Exports AuthProvider (component) and useAuth (hook).
  - signup seeds demo products into `products` if empty.
  - Provides cart & purchase helpers with Firestore and localStorage fallback.
*/

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// demo localStorage keys
const DEMO_CART_KEY = "eco_demo_cart";
const DEMO_PURCHASES_KEY = "eco_demo_purchases";

function readDemoCart() {
  try {
    const raw = localStorage.getItem(DEMO_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    // Non-fatal: return empty cart on parse/localStorage errors
    console.warn("readDemoCart failed:", err);
    return [];
  }
}
function saveDemoCart(arr) {
  try {
    localStorage.setItem(DEMO_CART_KEY, JSON.stringify(arr));
  } catch (err) {
    // Non-fatal, but surface a warning so ESLint doesn't complain about empty catch
    console.warn("saveDemoCart failed:", err);
  }
}
function readDemoPurchases() {
  try {
    const raw = localStorage.getItem(DEMO_PURCHASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("readDemoPurchases failed:", err);
    return [];
  }
}
function saveDemoPurchases(arr) {
  try {
    localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn("saveDemoPurchases failed:", err);
  }
}

// safer profile patch
function safeSetProfilePatch(setProfile, patch) {
  setProfile((prev) => {
    const base = prev && typeof prev === "object" ? prev : {};
    return { ...base, ...patch };
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // auth listener + load profile doc
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        setUser(fbUser);
        if (fbUser) {
          const ref = doc(db, "users", fbUser.uid);
          const snap = await getDoc(ref);
          const data = snap.exists() ? snap.data() : null;
          if (data) {
            if (!Array.isArray(data.cart)) data.cart = [];
            if (!Array.isArray(data.purchases)) data.purchases = [];
          }
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth listener error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // --- signup with seeding demo products ---
  const signup = async (email, password, username) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        username,
        cart: [],
        purchases: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await updateProfile(cred.user, { displayName: username });
      } catch (e) {
        console.warn("updateProfile non-fatal:", e);
      }

      // Seed demo products if collection empty
      try {
        const snap = await getDocs(collection(db, "products"));
        if (snap.empty) {
          const demo = [
            {
              title: "Vintage Lamp",
              price: 1200,
              imageURL: "https://via.placeholder.com/300x200?text=Lamp",
              description: "Classic brass lamp for your desk.",
              category: "Home",
            },
            {
              title: "Office Chair",
              price: 3500,
              imageURL: "https://via.placeholder.com/300x200?text=Chair",
              description: "Ergonomic chair with lumbar support.",
              category: "Furniture",
            },
            {
              title: "DSLR Camera",
              price: 15000,
              imageURL: "https://via.placeholder.com/300x200?text=Camera",
              description: "Perfect for beginners.",
              category: "Electronics",
            },
          ];

          for (const p of demo) {
            await addDoc(collection(db, "products"), {
              ...p,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          console.log("Seeded demo products ✅");
        }
      } catch (err) {
        console.error("Seeding products failed:", err);
      }

      return { success: true };
    } catch (err) {
      console.error("Signup failed:", err);
      throw err;
    }
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const updateUsername = async (newUsername) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: newUsername,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(doc(db, "users", user.uid));
      setProfile(snap.data());
    } catch (err) {
      console.error("updateUsername failed:", err);
      throw err;
    }

    try {
      await updateProfile(auth.currentUser, { displayName: newUsername });
    } catch (e) {
      console.warn("updateProfile during updateUsername non-fatal:", e);
    }
  };

  // --- cart & purchases helpers ---
  const addToCart = async (item, qty = 1) => {
    if (!item || !item.id) throw new Error("Invalid item");
    if (user && profile) {
      const ref = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : { cart: [] };
        const cart = Array.isArray(data.cart) ? [...data.cart] : [];
        const idx = cart.findIndex((it) => it.id === item.id);
        if (idx >= 0) {
          cart[idx] = { ...cart[idx], qty: (Number(cart[idx].qty) || 0) + Number(qty) };
        } else {
          cart.push({ id: item.id, t: item.t || "", pr: item.pr || 0, qty: Number(qty) || 1, img: item.img || "" });
        }
        await updateDoc(ref, { cart, updatedAt: serverTimestamp() });
        safeSetProfilePatch(setProfile, { cart });
      } catch (err) {
        console.error("addToCart (firestore) failed:", err);
        throw err;
      }
    } else {
      const cur = readDemoCart();
      const idx = cur.findIndex((it) => it.id === item.id);
      if (idx >= 0) cur[idx].qty = (Number(cur[idx].qty) || 0) + Number(qty);
      else cur.push({ id: item.id, t: item.t || "", pr: item.pr || 0, qty: Number(qty) || 1, img: item.img || "" });
      saveDemoCart(cur);
      safeSetProfilePatch(setProfile, { cart: cur });
    }
  };

  const setCartQty = async (itemId, qty) => {
    if (!itemId) return;
    if (user && profile) {
      const ref = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : { cart: [] };
        let cart = Array.isArray(data.cart) ? [...data.cart] : [];
        if (qty <= 0) {
          cart = cart.filter((it) => it.id !== itemId);
        } else {
          cart = cart.map((it) => (it.id === itemId ? { ...it, qty: Number(qty) } : it));
        }
        await updateDoc(ref, { cart, updatedAt: serverTimestamp() });
        safeSetProfilePatch(setProfile, { cart });
      } catch (err) {
        console.error("setCartQty failed:", err);
        throw err;
      }
    } else {
      const cur = readDemoCart()
        .map((it) => (it.id === itemId ? { ...it, qty: Number(qty) } : it))
        .filter((it) => it.qty > 0);
      saveDemoCart(cur);
      safeSetProfilePatch(setProfile, { cart: cur });
    }
  };

  const removeFromCart = async (itemId) => {
    return setCartQty(itemId, 0);
  };

  const checkoutCart = async () => {
    if (user && profile) {
      const ref = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : { cart: [], purchases: [] };
        const cart = Array.isArray(data.cart) ? data.cart : [];
        const purchases = Array.isArray(data.purchases) ? [...data.purchases] : [];
        if (cart.length === 0) return { success: false, message: "Cart empty" };

        const bought = cart.map((it) => ({ ...it, boughtAt: new Date().toISOString(), productId: it.id }));
        const newPurchases = purchases.concat(bought);

        await updateDoc(ref, { cart: [], purchases: newPurchases, updatedAt: serverTimestamp() });
        safeSetProfilePatch(setProfile, { cart: [], purchases: newPurchases });

        return { success: true, purchases: bought };
      } catch (err) {
        console.error("checkoutCart (firestore) failed:", err);
        throw err;
      }
    } else {
      const cart = readDemoCart();
      if (!cart || cart.length === 0) return { success: false, message: "Cart empty" };
      const bought = cart.map((it) => ({ ...it, boughtAt: new Date().toISOString(), productId: it.id }));
      const curP = readDemoPurchases();
      const newP = curP.concat(bought);
      saveDemoPurchases(newP);
      saveDemoCart([]);
      safeSetProfilePatch(setProfile, { cart: [], purchases: newP });
      return { success: true, purchases: bought };
    }
  };

  const getPurchases = () => {
    if (user && profile) return Array.isArray(profile.purchases) ? profile.purchases : [];
    return readDemoPurchases();
  };

  const getCart = () => {
    if (user && profile) return Array.isArray(profile.cart) ? profile.cart : [];
    return readDemoCart();
  };

  const value = {
    user,
    profile,
    loading,
    signup,
    login,
    logout,
    updateUsername,

    // cart / purchases API
    addToCart,
    setCartQty,
    removeFromCart,
    checkoutCart,
    getCart,
    getPurchases,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div style={{ padding: 16 }}>Loading...</div> : children}
    </AuthContext.Provider>
  );
}
