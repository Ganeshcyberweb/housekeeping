import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { auth, googleProvider, db } from "../lib/firebase";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import type { AuthError, User } from "firebase/auth";
import { AuthContext } from "./AuthContext";
import type { UserProfile, UserRole, RolePermissions } from "../types/user";
import { getRolePermissions } from "../types/user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        setLoading(true); // Keep loading while fetching profile
        try {
          await handleUserProfile(user);
        } finally {
          setLoading(false); // Set loading false after profile fetch completes
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUserProfile = useCallback(async (user: User) => {
    setError(null); // Clear any previous errors
    try {
      // Look for existing staff record with this UID
      const staffCollection = collection(db, "staff");
      const staffSnapshot = await getDocs(staffCollection);
      const staffList = staffSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      let staffMember = staffList.find((staff) => staff.uid === user.uid);

      if (staffMember) {
        // Check if staff member is archived (treat as non-existent)
        if (staffMember.archived) {
          setUserProfile(null);
          setError("Account no longer exists");
          return;
        }

        // Convert staff record to UserProfile format for compatibility
        const userProfile: UserProfile = {
          uid: staffMember.uid,
          email: staffMember.email || user.email || "",
          displayName: staffMember.name || user.displayName || "",
          role: staffMember.systemRole || "staff",
          approved: Boolean(staffMember.approved),
          approvedBy: staffMember.approvedBy,
          approvedAt: staffMember.approvedAt,
          createdAt: staffMember.createdAt,
          updatedAt: staffMember.updatedAt,
        };

        setUserProfile(userProfile);
      } else {
        // New user - create staff record only
        const now = Timestamp.now();
        const staffData = {
          uid: user.uid,
          name: user.displayName || user.email || "",
          email: user.email || "",
          systemRole: "staff" as const,
          jobRole: "",
          availability: "Available" as const,
          phone: "",
          approved: false,
          createdAt: now,
          updatedAt: now,
        };

        await addDoc(staffCollection, staffData);

        // Create UserProfile from new staff data
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          role: "staff",
          approved: false,
          createdAt: now,
          updatedAt: now,
        };
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Error handling user profile:", error);
      setError("Failed to load user profile");
    }
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

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = "An error occurred during sign-in";

      switch (authError.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password. If you signed up with Google, please use the 'Continue with Google' option instead.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address format";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection";
          break;
        case "auth/user-mismatch":
          errorMessage = "The credentials don't match the current user";
          break;
        case "auth/requires-recent-login":
          errorMessage = "Please sign out and sign in again to perform this action";
          break;
        default:
          errorMessage = authError.message;
      }

      setError(errorMessage);
      console.error("Email sign-in error:", authError);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(result.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(result.user);
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = "An error occurred during registration";

      switch (authError.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection";
          break;
        default:
          errorMessage = authError.message;
      }

      setError(errorMessage);
      console.error("Email sign-up error:", authError);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = "An error occurred while sending reset email";

      switch (authError.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection";
          break;
        default:
          errorMessage = authError.message;
      }

      setError(errorMessage);
      console.error("Password reset error:", authError);
      throw err; // Re-throw so the calling component can handle success/failure
    } finally {
      setLoading(false);
    }
  }, []);

  const sendEmailVerificationToUser = useCallback(async () => {
    try {
      setError(null);
      if (!user) {
        throw new Error("No user logged in");
      }
      await sendEmailVerification(user);
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = "An error occurred while sending verification email";

      switch (authError.code) {
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection";
          break;
        default:
          errorMessage = authError.message;
      }

      setError(errorMessage);
      console.error("Email verification error:", authError);
      throw err; // Re-throw so the calling component can handle success/failure
    }
  }, [user]);

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

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        await handleUserProfile(user);
      } catch (error) {
        console.error("Error refreshing user profile:", error);
        setError("Failed to refresh user profile");
      } finally {
        setLoading(false);
      }
    }
  }, [user, handleUserProfile]);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      return userProfile ? roles.includes(userProfile.role) : false;
    },
    [userProfile]
  );

  const hasPermission = useCallback(
    (permission: keyof RolePermissions) => {
      if (!userProfile) return false;
      const permissions = getRolePermissions(userProfile.role);
      return permissions[permission];
    },
    [userProfile]
  );

  const isAdmin = useCallback(() => {
    return userProfile?.role === "admin";
  }, [userProfile]);

  const isManager = useCallback(() => {
    return userProfile?.role === "manager";
  }, [userProfile]);

  const isStaff = useCallback(() => {
    return userProfile?.role === "staff";
  }, [userProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        signIn,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        sendEmailVerification: sendEmailVerificationToUser,
        signOut: signOutUser,
        clearError,
        hasRole,
        hasPermission,
        isAdmin,
        isManager,
        isStaff,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
