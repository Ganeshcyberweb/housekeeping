import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ROLE_LABELS } from "../types/user";
import {
  Menu,
  Home,
  LayoutDashboard,
  FileText,
  Users,
  Building,
  LogOut,
  LogIn,
  UserPlus,
  Calendar,
  Shield,
  Crown,
  User,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { user, userProfile, signOut, hasPermission } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleIcon = () => {
    if (!userProfile) return <User className="w-4 h-4" />;
    switch (userProfile.role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-red-600" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'staff':
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div>
      <button
        data-drawer-target="default-sidebar"
        data-drawer-toggle="default-sidebar"
        aria-controls="default-sidebar"
        type="button"
        className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="w-6 h-6" />
      </button>

      <aside
        id="default-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
          {/* Logo/Title */}
          <div className="mb-6 px-3 py-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Housekeeping Shift Planner
            </h2>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-6 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-600">
                      {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.displayName || user.email?.split("@")[0]}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  {userProfile && (
                    <div className="flex items-center gap-1 mt-1">
                      {getRoleIcon()}
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {ROLE_LABELS[userProfile.role]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-2 font-medium">
            {/* Home */}
            <li>
              <Link
                to="/"
                className={`flex items-center p-2 rounded-lg group ${
                  isActive("/")
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Home
                  className={`w-5 h-5 transition duration-75 ${
                    isActive("/")
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  }`}
                />
                <span className="ms-3">Home</span>
              </Link>
            </li>

            {user && (
              <>
                {/* Admin Dashboard - Only for Admin */}
                {hasPermission('canManageUsers') && (
                  <li>
                    <Link
                      to="/admin"
                      className={`flex items-center p-2 rounded-lg group ${
                        isActive("/admin")
                          ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <LayoutDashboard
                        className={`shrink-0 w-5 h-5 transition duration-75 ${
                          isActive("/admin")
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        }`}
                      />
                      <span className="flex-1 ms-3 whitespace-nowrap">
                        Admin Dashboard
                      </span>
                    </Link>
                  </li>
                )}

                {/* Shift Form - Admin and Manager only */}
                {hasPermission('canAssignShifts') && (
                  <li>
                    <Link
                      to="/shift-form"
                      className={`flex items-center p-2 rounded-lg group ${
                        isActive("/shift-form")
                          ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <FileText
                        className={`shrink-0 w-5 h-5 transition duration-75 ${
                          isActive("/shift-form")
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        }`}
                      />
                      <span className="flex-1 ms-3 whitespace-nowrap">
                        Create Shift
                      </span>
                    </Link>
                  </li>
                )}

                {/* My Shifts - Staff can see their own shifts */}
                {hasPermission('canViewOwnShiftsOnly') && (
                  <li>
                    <Link
                      to="/my-shifts"
                      className={`flex items-center p-2 rounded-lg group ${
                        isActive("/my-shifts")
                          ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Calendar
                        className={`shrink-0 w-5 h-5 transition duration-75 ${
                          isActive("/my-shifts")
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        }`}
                      />
                      <span className="flex-1 ms-3 whitespace-nowrap">
                        My Shifts
                      </span>
                    </Link>
                  </li>
                )}

                {/* Management Section - Only if user has management permissions */}
                {(hasPermission('canManageUsers') || hasPermission('canViewAllStaff') || hasPermission('canViewReports') || hasPermission('canViewAllShifts')) && (
                  <>
                    <li className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
                      <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Management
                      </p>
                    </li>

                    {/* Shift Management - Admin and Manager */}
                    {hasPermission('canViewAllShifts') && (
                      <li>
                        <Link
                          to="/admin/shift-management"
                          className={`flex items-center p-2 rounded-lg group ${
                            isActive("/admin/shift-management")
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                              : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Calendar
                            className={`shrink-0 w-5 h-5 transition duration-75 ${
                              isActive("/admin/shift-management")
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                            }`}
                          />
                          <span className="flex-1 ms-3 whitespace-nowrap">Shift Management</span>
                        </Link>
                      </li>
                    )}


                    {/* Staff Management - Admin only */}
                    {hasPermission('canManageStaff') && (
                      <li>
                        <Link
                          to="/admin/staff-management"
                          className={`flex items-center p-2 rounded-lg group ${
                            isActive("/admin/staff-management")
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                              : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Users
                            className={`shrink-0 w-5 h-5 transition duration-75 ${
                              isActive("/admin/staff-management")
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                            }`}
                          />
                          <span className="flex-1 ms-3 whitespace-nowrap">Staff Management</span>
                        </Link>
                      </li>
                    )}

                    {/* Room Management - Admin and Manager */}
                    {hasPermission('canManageRooms') && (
                      <li>
                        <Link
                          to="/admin/room-management"
                          className={`flex items-center p-2 rounded-lg group ${
                            isActive("/admin/room-management")
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                              : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Building
                            className={`shrink-0 w-5 h-5 transition duration-75 ${
                              isActive("/admin/room-management")
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                            }`}
                          />
                          <span className="flex-1 ms-3 whitespace-nowrap">Room Management</span>
                        </Link>
                      </li>
                    )}
                  </>
                )}

                {/* Logout */}
                <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                  >
                    <LogOut className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap text-left">
                      Sign Out
                    </span>
                  </button>
                </li>
              </>
            )}

            {!user && (
              <>
                {/* Sign In */}
                <li>
                  <Link
                    to="/login"
                    className={`flex items-center p-2 rounded-lg group ${
                      isActive("/login")
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                        : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <LogIn
                      className={`shrink-0 w-5 h-5 transition duration-75 ${
                        isActive("/login")
                          ? "text-blue-900 dark:text-blue-100"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      }`}
                    />
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      Sign In
                    </span>
                  </Link>
                </li>

                {/* Sign Up */}
                <li>
                  <Link
                    to="/signup"
                    className={`flex items-center p-2 rounded-lg group ${
                      isActive("/signup")
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                        : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <UserPlus
                      className={`shrink-0 w-5 h-5 transition duration-75 ${
                        isActive("/signup")
                          ? "text-blue-900 dark:text-blue-100"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      }`}
                    />
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      Sign Up
                    </span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
