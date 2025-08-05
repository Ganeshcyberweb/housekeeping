import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import type { UserRole } from "../types/user";
import LoadingScreen from "./LoadingScreen";

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export default function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = "/" 
}: RoleBasedRouteProps) {
  const { user, userProfile, loading, error } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verifying access..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check for archived user error first, before checking userProfile
  if (error === 'Account no longer exists') {
    return <Navigate to="/user-not-found" replace />;
  }

  if (!userProfile) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!userProfile.approved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (!allowedRoles.includes(userProfile.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}