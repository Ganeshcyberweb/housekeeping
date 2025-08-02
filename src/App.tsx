import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShiftFormPage from "./pages/ShiftFormPage";
import AdminPage from "./pages/AdminPage";
import AdminShiftManagementPage from "./pages/AdminShiftManagementPage";
import AdminStaffManagementPage from "./pages/AdminStaffManagementPage";
import AdminRoomManagementPage from "./pages/AdminRoomManagementPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { AuthProvider } from "./context/AuthContextProvider";
import HomePage from "./pages/HomePage";
import MainLayout from "./components/MainLayout";
import RoleBasedRoute from "./components/RoleBasedRoute";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
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
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
