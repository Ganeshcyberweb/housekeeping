import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
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
        await handleUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUserProfile = async (user: User) => {
    try {
      // Look for existing staff record with this UID
      const staffCollection = collection(db, 'staff');
      const staffSnapshot = await getDocs(staffCollection);
      const staffList = staffSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
      
      let staffMember = staffList.find((staff) => staff.uid === user.uid);
      
      if (staffMember) {
        // Convert staff record to UserProfile format for compatibility
        const userProfile: UserProfile = {
          uid: staffMember.uid,
          email: staffMember.email || user.email || '',
          displayName: staffMember.name || user.displayName || '',
          role: staffMember.systemRole || 'staff',
          createdAt: staffMember.createdAt,
          updatedAt: staffMember.updatedAt,
        };
        setUserProfile(userProfile);
      } else {
        // New user - create staff record only
        const now = Timestamp.now();
        const staffData = {
          uid: user.uid,
          name: user.displayName || user.email || '',
          email: user.email || '',
          systemRole: 'staff' as const,
          jobRole: '',
          availability: 'Available' as const,
          phone: '',
          createdAt: now,
          updatedAt: now,
        };
        
        console.log('Creating staff record for new user:', staffData);
        const staffDocRef = await addDoc(staffCollection, staffData);
        console.log('Staff record created with ID:', staffDocRef.id);

        // Create UserProfile from new staff data
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'staff',
          createdAt: now,
          updatedAt: now,
        };
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error handling user profile:', error);
      setError('Failed to load user profile');
    }
  };

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

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await handleUserProfile(user);
    }
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]) => {
    return userProfile ? roles.includes(userProfile.role) : false;
  }, [userProfile]);

  const hasPermission = useCallback((permission: keyof RolePermissions) => {
    if (!userProfile) return false;
    const permissions = getRolePermissions(userProfile.role);
    return permissions[permission];
  }, [userProfile]);

  const isAdmin = useCallback(() => {
    return userProfile?.role === 'admin';
  }, [userProfile]);

  const isManager = useCallback(() => {
    return userProfile?.role === 'manager';
  }, [userProfile]);

  const isStaff = useCallback(() => {
    return userProfile?.role === 'staff';
  }, [userProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        signIn,
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
