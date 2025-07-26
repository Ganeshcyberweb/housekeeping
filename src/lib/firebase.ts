import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQKSLxWaTQpaeTc7R_lPpFONM4XPaOcaw",
  authDomain: "housekeeping-shift-planner.firebaseapp.com",
  projectId: "housekeeping-shift-planner",
  storageBucket: "housekeeping-shift-planner.firebasestorage.app",
  messagingSenderId: "445147658425",
  appId: "1:445147658425:web:2df53680d15c2a62100368",
  measurementId: "G-KMH91TG8Q8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({
  prompt: "select_account",
});
