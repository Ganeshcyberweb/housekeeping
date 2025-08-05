import { Routes, Route } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import LoadingScreen from "./LoadingScreen";
import ShiftFormPage from "../pages/ShiftFormPage";
import AdminPage from "../pages/AdminPage";
import AdminShiftManagementPage from "../pages/AdminShiftManagementPage";
import AdminStaffManagementPage from "../pages/AdminStaffManagementPage";
import AdminRoomManagementPage from "../pages/AdminRoomManagementPage";
import SettingsPage from "../pages/SettingsPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import PendingApprovalPage from "../pages/PendingApprovalPage";
import UserNotFoundPage from "../pages/UserNotFoundPage";
import HomePage from "../pages/HomePage";
import MainLayout from "./MainLayout";
import RoleBasedRoute from "./RoleBasedRoute";

export default function AppContent() {
  const { loading, error } = useAuth();

  if (loading) {
    return <LoadingScreen message="Initializing application..." />;
  }

  // Check for archived user error at the app level
  if (error === 'Account no longer exists') {
    return <UserNotFoundPage />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/user-not-found" element={<UserNotFoundPage />} />
      <Route
        path="/"
        element={
          <RoleBasedRoute allowedRoles={['admin', 'manager', 'staff']}>
            <MainLayout>
              <HomePage />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/shift-form"
        element={
          <RoleBasedRoute allowedRoles={['admin', 'manager']}>
            <MainLayout>
              <ShiftFormPage />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminPage />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/shift-management"
        element={
          <RoleBasedRoute allowedRoles={['admin', 'manager']}>
            <MainLayout>
              <AdminShiftManagementPage />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/staff-management"
        element={
          <RoleBasedRoute allowedRoles={['admin', 'manager']}>
            <MainLayout>
              <AdminStaffManagementPage />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/room-management"
        element={
          <RoleBasedRoute allowedRoles={['admin', 'manager']}>
            <MainLayout>
              <AdminRoomManagementPage />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <RoleBasedRoute allowedRoles={['admin', 'manager', 'staff']}>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
    </Routes>
  );
}