import { createContext } from "react";
import type { User } from "firebase/auth";
import type { UserProfile, UserRole, RolePermissions } from "../types/user";

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isStaff: () => boolean;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
