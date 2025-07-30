import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ShiftFormPage from "./pages/ShiftFormPage";
import AdminPage from "./pages/AdminPage";
import AdminShiftManagementPage from "./pages/AdminShiftManagementPage";
import AdminStaffManagementPage from "./pages/AdminStaffManagementPage";
import AdminRoomManagementPage from "./pages/AdminRoomManagementPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { AuthProvider } from "./context/AuthContextProvider";
import { useAuth } from "./context/useAuth";
import HomePage from "./pages/HomePage";
import MainLayout from "./components/MainLayout";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
              <PrivateRoute>
                <MainLayout>
                  <ShiftFormPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <MainLayout>
                  <AdminPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/shift-management"
            element={
              <PrivateRoute>
                <MainLayout>
                  <AdminShiftManagementPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/staff-management"
            element={
              <PrivateRoute>
                <MainLayout>
                  <AdminStaffManagementPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/room-management"
            element={
              <PrivateRoute>
                <MainLayout>
                  <AdminRoomManagementPage />
                </MainLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
