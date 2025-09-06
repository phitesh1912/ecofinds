// src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace with your Firebase config (I fixed storageBucket to the usual pattern)
const firebaseConfig = {
  apiKey: "AIzaSyC4ydlmyiU5TcwUFRPSuiZrDYs-uRtW0KM",
  authDomain: "ecofinds-c0a56.firebaseapp.com",
  projectId: "ecofinds-c0a56",
  // NOTE: storageBucket typically ends with "appspot.com"
  storageBucket: "ecofinds-c0a56.appspot.com",
  messagingSenderId: "959677752322",
  appId: "1:959677752322:web:1a094eea7049fde063331b",
  measurementId: "G-BQ3NSWGGZ0",
};

// initialize app only once (safe for HMR / multiple imports)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
