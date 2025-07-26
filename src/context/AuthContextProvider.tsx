import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import type { AuthError, User } from "firebase/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = "An error occurred during sign-in";

      switch (authError.code) {
        case "auth/popup-closed-by-user":
          errorMessage = "Sign-in was cancelled";
          break;
        case "auth/popup-blocked":
          errorMessage = "Popup was blocked by browser";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "Only one popup request is allowed at a time";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          errorMessage = authError.message;
      }

      setError(errorMessage);
      console.error("Sign-in error:", authError);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      const authError = err as AuthError;
      setError("Failed to sign out. Please try again.");
      console.error("Sign-out error:", authError);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut: signOutUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
