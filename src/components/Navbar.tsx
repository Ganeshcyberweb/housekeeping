import { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useAuth } from "../context/useAuth";
import { useStaffStore } from "../store/staffStore";
import { useShiftsStore } from "../store/shiftsStore";
import { ROLE_LABELS } from "../types/user";
import Button from "./ui/Button";
import FilterInput from "./ui/FilterInput";
import FilterSelect from "./ui/FilterSelect";
import {
  Calendar,
  Clock,
  Users,
  User,
  Home,
  Plus,
  Upload,
  UserPlus,
  ChevronDown,
  ChevronUp,
  LogOut,
  Settings,
  Crown,
  Shield,
  Zap,
} from "lucide-react";

interface NavbarProps {
  onFilterChange?: (filters: {
    dateFilter?: string;
    shiftFilter?: string;
    staffFilter?: string;
    searchFilter?: string;
  }) => void;
  currentFilters?: {
    dateFilter?: string;
    shiftFilter?: string;
    staffFilter?: string;
    searchFilter?: string;
  };
  // Page-specific action callbacks
  onAddRoom?: () => void;
  onBulkUpload?: () => void;
  onAddStaff?: () => void;
}

const Navbar = ({
  onFilterChange,
  currentFilters,
  onAddRoom,
  onBulkUpload,
  onAddStaff,
}: NavbarProps) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const signOut = authContext?.signOut;
  const { userProfile, hasPermission } = useAuth();
  const { updateAvailability, getStaffByUid, fetchStaff } = useStaffStore();
  const { isAutoAssigning, autoAssignShifts } = useShiftsStore();
  const location = useLocation();
  const [showShiftsDropdown, setShowShiftsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileNavDropdown, setShowMobileNavDropdown] = useState(false);
  const [showAvailabilityDropdown, setShowAvailabilityDropdown] =
    useState(false);
  const [showAutoAssignConfirm, setShowAutoAssignConfirm] = useState(false);
  const [autoAssignConfig, setAutoAssignConfig] = useState({
    date: new Date().toISOString().split("T")[0], // Today's date
    shift: (() => {
      // Determine default shift based on current time
      const currentHour = new Date().getHours();
      if (currentHour >= 14 && currentHour < 22) return "Afternoon";
      else if (currentHour >= 22 || currentHour < 6) return "Evening";
      return "Morning";
    })(),
    maxRooms: 5,
  });
  const [currentAvailability, setCurrentAvailability] = useState<
    "Available" | "On Break" | "Busy" | "Off Duty"
  >("Available");
  const dropdownRef = useRef<HTMLLIElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileNavDropdownRef = useRef<HTMLDivElement>(null);
  const availabilityDropdownRef = useRef<HTMLDivElement>(null);

  // Load current availability from Firestore
  useEffect(() => {
    const loadAvailability = async () => {
      if (user && userProfile?.role === "staff") {
        try {
          // Ensure staff data is loaded
          await fetchStaff();

          const staffMember = getStaffByUid(user.uid);
          if (staffMember && staffMember.availability) {
            setCurrentAvailability(staffMember.availability);
          }
        } catch (error) {
          console.error("Failed to fetch staff data for availability:", error);
          // Continue with default availability if fetch fails
        }
      }
    };

    // Only load if we have both user and userProfile (authentication is complete)
    if (user && userProfile) {
      loadAvailability();
    }
  }, [user, userProfile, getStaffByUid, fetchStaff]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowShiftsDropdown(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
      if (
        mobileNavDropdownRef.current &&
        !mobileNavDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMobileNavDropdown(false);
      }
      if (
        availabilityDropdownRef.current &&
        !availabilityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAvailabilityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut?.();
      setShowUserDropdown(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const confirmAutoAssign = () => {
    setShowAutoAssignConfirm(true);
  };

  const handleAutoAssign = async () => {
    setShowAutoAssignConfirm(false);

    try {
      await autoAssignShifts({
        date: autoAssignConfig.date,
        shiftType: autoAssignConfig.shift,
        maxAssignmentsPerStaff: autoAssignConfig.maxRooms,
      });
    } catch (error) {
      console.error("Auto assignment failed:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getRoleIcon = () => {
    if (!userProfile) return <User className="w-3 h-3" />;
    switch (userProfile.role) {
      case "admin":
        return <Crown className="w-3 h-3 text-red-400" />;
      case "manager":
        return <Shield className="w-3 h-3 text-blue-400" />;
      case "staff":
        return <User className="w-3 h-3 text-gray-400" />;
    }
  };

  const getPageInfo = () => {
    switch (location.pathname) {
      case "/":
        return { title: "Dashboard", showGreeting: true };
      case "/admin":
        return {
          title: "Admin Dashboard",
          showGreeting: false,
          showFilters: false,
        };
      case "/admin/shift-management":
        return {
          title: "Shift Management",
          showGreeting: false,
          showFilters: true,
          filterType: "shift",
        };
      case "/admin/staff-management":
        return {
          title: "Staff Management",
          showGreeting: false,
          showFilters: true,
          filterType: "staff",
        };
      case "/admin/room-management":
        return {
          title: "Room Management",
          showGreeting: false,
          showFilters: true,
          filterType: "room",
        };
      case "/shift-form":
        return {
          title: "Create Shift",
          showGreeting: false,
          showFilters: false,
        };
      case "/settings":
        return {
          title: "Settings",
          showGreeting: false,
          showFilters: false,
        };
      default:
        return { title: "Dashboard", showGreeting: true };
    }
  };

  const pageInfo = getPageInfo();

  // Don't render the navbar if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="bg-[#0B0F19] m-2 sm:m-4 text-white rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 lg:gap-8 min-h-[120px] sm:min-h-[140px]">
      {/* Top Navbar */}
      <div className="flex items-center justify-between">
        {/* Left - Logo & Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Navigation Dropdown - Logo clickable on mobile */}
          <div className="relative lg:hidden" ref={mobileNavDropdownRef}>
            <button
              onClick={() => setShowMobileNavDropdown(!showMobileNavDropdown)}
              className="flex items-center gap-2 hover:bg-[#1C2333] rounded-lg p-1 transition-colors"
            >
              <div className="bg-purple-500 p-1.5 sm:p-2 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path d="M12 2l9 4.9v9.8L12 22l-9-5.3V6.9L12 2z" />
                </svg>
              </div>
              <span className="font-semibold text-sm sm:text-lg">
                Shift Planner
              </span>
              <ChevronDown
                className={`w-3 h-3 text-gray-400 transition-transform ${
                  showMobileNavDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showMobileNavDropdown && userProfile?.role !== "staff" && (
              <div className="absolute top-full left-0 mt-2 bg-[#1C2333] rounded-lg shadow-lg py-2 min-w-[200px] z-50 border border-gray-700">
                <Link
                  to="/"
                  className={`block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors ${
                    location.pathname === "/" ? "text-white bg-[#2A3441]" : ""
                  }`}
                  onClick={() => setShowMobileNavDropdown(false)}
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Home
                  </div>
                </Link>

                <Link
                  to="/admin/shift-management"
                  className={`block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors ${
                    location.pathname === "/admin/shift-management"
                      ? "text-white bg-[#2A3441]"
                      : ""
                  }`}
                  onClick={() => setShowMobileNavDropdown(false)}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Shift Management
                  </div>
                </Link>

                <Link
                  to="/shift-form"
                  className={`block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors ${
                    location.pathname === "/shift-form"
                      ? "text-white bg-[#2A3441]"
                      : ""
                  }`}
                  onClick={() => setShowMobileNavDropdown(false)}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Shift
                  </div>
                </Link>

                <Link
                  to="/admin/staff-management"
                  className={`block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors ${
                    location.pathname === "/admin/staff-management"
                      ? "text-white bg-[#2A3441]"
                      : ""
                  }`}
                  onClick={() => setShowMobileNavDropdown(false)}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Staff Management
                  </div>
                </Link>

                <Link
                  to="/admin/room-management"
                  className={`block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors ${
                    location.pathname === "/admin/room-management"
                      ? "text-white bg-[#2A3441]"
                      : ""
                  }`}
                  onClick={() => setShowMobileNavDropdown(false)}
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Room Management
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Logo - Non-clickable */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-3">
            <div className="bg-purple-500 p-1.5 sm:p-2 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path d="M12 2l9 4.9v9.8L12 22l-9-5.3V6.9L12 2z" />
              </svg>
            </div>
            <span className="font-semibold text-sm sm:text-lg">
              Shift Planner
            </span>
          </div>

          {/* Nav Links - Hidden on mobile, shown on larger screens */}
          {/* Only show navigation links for admin and manager users */}
          {userProfile?.role !== "staff" && (
            <ul className="hidden lg:flex items-center ml-6 space-x-4 text-gray-400">
              <li
                className={`px-3 py-1 rounded-lg ${
                  location.pathname === "/"
                    ? "text-white bg-[#1C2333]"
                    : "hover:text-white cursor-pointer"
                }`}
              >
                <Link to={"/"}>Home</Link>
              </li>

              {/* Shifts Dropdown */}
              <li className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowShiftsDropdown(!showShiftsDropdown)}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
                    location.pathname === "/admin/shift-management" ||
                    location.pathname === "/shift-form"
                      ? "text-white bg-[#1C2333]"
                      : "hover:text-white cursor-pointer"
                  }`}
                >
                  Shifts
                  {showShiftsDropdown ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {showShiftsDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-[#1C2333] rounded-lg shadow-lg py-2 min-w-[160px] z-50">
                    <Link
                      to="/admin/shift-management"
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors"
                      onClick={() => setShowShiftsDropdown(false)}
                    >
                      Shift Management
                    </Link>
                    <Link
                      to="/shift-form"
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors"
                      onClick={() => setShowShiftsDropdown(false)}
                    >
                      Create Shift
                    </Link>
                  </div>
                )}
              </li>

              {/* Staffs */}
              <li
                className={`px-3 py-1 rounded-lg ${
                  location.pathname === "/admin/staff-management"
                    ? "text-white bg-[#1C2333]"
                    : "hover:text-white cursor-pointer"
                }`}
              >
                <Link to={"/admin/staff-management"}>Staffs</Link>
              </li>

              {/* Rooms */}
              <li
                className={`px-3 py-1 rounded-lg ${
                  location.pathname === "/admin/room-management"
                    ? "text-white bg-[#1C2333]"
                    : "hover:text-white cursor-pointer"
                }`}
              >
                <Link to={"/admin/room-management"}>Rooms</Link>
              </li>
            </ul>
          )}
        </div>

        {/* Right - User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 sm:gap-3 hover:bg-[#1C2333] rounded-lg p-1.5 sm:p-2 transition-colors"
          >
            <div className="text-right hidden md:block">
              <div className="flex items-center justify-end gap-2">
                <p className="text-xs sm:text-sm font-medium text-white">
                  {user?.displayName || "User"}
                </p>
                {userProfile && (
                  <div className="flex items-center gap-1">
                    {getRoleIcon()}
                    <span className="text-xs text-gray-300">
                      {ROLE_LABELS[userProfile.role]}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {user?.email || "user@example.com"}
              </p>
            </div>
            <img
              src={user?.photoURL || "https://i.pravatar.cc/40"}
              alt="user"
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-gray-500"
            />
            <ChevronDown
              className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${
                showUserDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showUserDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-[#1C2333] rounded-lg shadow-lg py-2 min-w-[200px] sm:min-w-[220px] z-50 border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-xs sm:text-sm font-medium text-white">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {user?.email || "user@example.com"}
                </p>
                {userProfile && (
                  <div className="flex items-center gap-2">
                    {getRoleIcon()}
                    <span className="text-xs font-medium text-gray-300">
                      {ROLE_LABELS[userProfile.role]}
                    </span>
                  </div>
                )}
              </div>

              <Link
                to="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Content - Dynamic based on page */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-1 sm:px-2 pb-2 gap-4 lg:gap-0">
        {pageInfo.showGreeting ? (
          // Home page - Show greeting
          <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl">
              {getGreeting()}, {user?.displayName || "User"}!
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              {userProfile?.role === "staff" ? (
                // Staff users see availability dropdown
                <div className="relative" ref={availabilityDropdownRef}>
                  <button
                    onClick={() =>
                      setShowAvailabilityDropdown(!showAvailabilityDropdown)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{currentAvailability}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        showAvailabilityDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showAvailabilityDropdown && (
                    <div className="absolute top-full right-0 sm:right-0 left-0 sm:left-auto mt-2 bg-[#1C2333] rounded-lg shadow-lg py-2 min-w-[160px] z-50 border border-gray-700">
                      {["Available", "On Break", "Busy", "Off Duty"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={async () => {
                              if (user && userProfile?.role === "staff") {
                                try {
                                  await updateAvailability(
                                    user.uid,
                                    status as typeof currentAvailability
                                  );
                                  setCurrentAvailability(
                                    status as typeof currentAvailability
                                  );
                                  setShowAvailabilityDropdown(false);
                                } catch (error) {
                                  console.error(
                                    "Failed to update availability:",
                                    error
                                  );
                                  // Still update the UI even if Firestore update fails
                                  setCurrentAvailability(
                                    status as typeof currentAvailability
                                  );
                                  setShowAvailabilityDropdown(false);
                                }
                              }
                            }}
                            className={`w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors ${
                              currentAvailability === status
                                ? "bg-[#2A3441] text-white"
                                : ""
                            }`}
                          >
                            {status}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Admin and manager users see New shift button
                <Link to={"/shift-form"}>
                  <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                    <span className="hidden sm:inline">New shift</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </Link>
              )}
            </div>
          </>
        ) : (
          // Other pages - Show page title, filters below, and actions on the right
          <div className="w-full">
            {/* Top row - Page title and action buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4 sm:gap-0">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
                  {pageInfo.title}
                </h1>
                {pageInfo.showFilters && (
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    {pageInfo.filterType === "shift" &&
                      "Manage and filter shift assignments"}
                    {pageInfo.filterType === "staff" &&
                      "Manage staff members and their details"}
                    {pageInfo.filterType === "room" &&
                      "Manage rooms and their status"}
                  </p>
                )}
              </div>

              {/* Page-specific Action Buttons - Moved to top on mobile */}
              {/* Only show action buttons for admin and manager users */}
              {userProfile?.role !== "staff" && (
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                  {/* Home Page - Create Shift Button */}
                  {location.pathname === "/" && (
                    <Link to={"/shift-form"}>
                      <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                      >
                        <span className="hidden sm:inline">New shift</span>
                        <span className="sm:hidden">New</span>
                      </Button>
                    </Link>
                  )}

                  {/* Room Management Page - Bulk Upload & Add Room */}
                  {location.pathname === "/admin/room-management" && (
                    <>
                      <Button
                        onClick={onBulkUpload}
                        variant="secondary"
                        icon={<Upload className="w-4 h-4" />}
                      >
                        <span className="hidden sm:inline">Bulk Upload</span>
                        <span className="sm:hidden">Upload</span>
                      </Button>
                      <Button
                        onClick={onAddRoom}
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                      >
                        <span className="hidden sm:inline">Add Room</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </>
                  )}

                  {/* Staff Management Page - Add Staff Member */}
                  {location.pathname === "/admin/staff-management" && (
                    <Button
                      onClick={onAddStaff}
                      variant="primary"
                      icon={<UserPlus className="w-4 h-4" />}
                    >
                      <span className="hidden sm:inline">Add Staff Member</span>
                      <span className="sm:hidden">Add Staff</span>
                    </Button>
                  )}

                  {/* Shift Management Page - Auto Assign & Create New Shift */}
                  {location.pathname === "/admin/shift-management" && (
                    <>
                      {hasPermission("canAssignShifts") && (
                        <Button
                          onClick={confirmAutoAssign}
                          disabled={isAutoAssigning}
                          loading={isAutoAssigning}
                          variant="primary"
                          icon={<Zap className="w-4 h-4" />}
                        >
                          <span className="hidden sm:inline">
                            {isAutoAssigning ? "Assigning..." : "Auto Assign"}
                          </span>
                          <span className="sm:hidden">Auto</span>
                        </Button>
                      )}
                      <Link to={"/shift-form"}>
                        <Button
                          variant="primary"
                          icon={<Plus className="w-4 h-4" />}
                        >
                          <span className="hidden sm:inline">New Shift</span>
                          <span className="sm:hidden">New</span>
                        </Button>
                      </Link>
                    </>
                  )}

                  {/* Create Shift Page - No additional buttons needed */}
                  {location.pathname === "/shift-form" && null}

                  {/* Admin Dashboard - Overview Page */}
                  {location.pathname === "/admin" && (
                    <Link to={"/shift-form"}>
                      <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                      >
                        <span className="hidden sm:inline">New shift</span>
                        <span className="sm:hidden">New</span>
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Bottom row - Page-specific filters */}
            {pageInfo.showFilters && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 overflow-x-auto">
                {/* Shift Management Filters */}
                {pageInfo.filterType === "shift" && (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    {/* Date Filter */}
                    <div className="w-full sm:w-auto">
                      <FilterInput
                        type="date"
                        variant="dark"
                        icon={<Calendar className="w-4 h-4" />}
                        value={currentFilters?.dateFilter || ""}
                        onChange={(e) =>
                          onFilterChange?.({
                            ...currentFilters,
                            dateFilter: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Shift Type Filter */}
                    <div className="w-full sm:w-auto">
                      <FilterSelect
                        variant="dark"
                        icon={<Clock className="w-4 h-4" />}
                        value={currentFilters?.shiftFilter || ""}
                        onChange={(e) =>
                          onFilterChange?.({
                            ...currentFilters,
                            shiftFilter: e.target.value,
                          })
                        }
                      >
                        <option value="">All shifts</option>
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                      </FilterSelect>
                    </div>

                    {/* Staff Filter */}
                    <div className="w-full sm:w-32">
                      <FilterInput
                        type="text"
                        variant="dark"
                        icon={<Users className="w-4 h-4" />}
                        value={currentFilters?.staffFilter || ""}
                        onChange={(e) =>
                          onFilterChange?.({
                            ...currentFilters,
                            staffFilter: e.target.value,
                          })
                        }
                        placeholder="Search staff..."
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Staff Management Filters */}
                {pageInfo.filterType === "staff" && (
                  <div className="w-full sm:w-48">
                    <FilterInput
                      type="text"
                      variant="dark"
                      icon={<User className="w-4 h-4" />}
                      value={currentFilters?.searchFilter || ""}
                      onChange={(e) =>
                        onFilterChange?.({
                          ...currentFilters,
                          searchFilter: e.target.value,
                        })
                      }
                      placeholder="Search staff by name or role..."
                      className="w-full"
                    />
                  </div>
                )}

                {/* Room Management Filters */}
                {pageInfo.filterType === "room" && (
                  <div className="w-full sm:w-56">
                    <FilterInput
                      type="text"
                      variant="dark"
                      icon={<Home className="w-4 h-4" />}
                      value={currentFilters?.searchFilter || ""}
                      onChange={(e) =>
                        onFilterChange?.({
                          ...currentFilters,
                          searchFilter: e.target.value,
                        })
                      }
                      placeholder="Search rooms by number, type, or status..."
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto Assignment Configuration Modal */}
      {showAutoAssignConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Configure Auto Assignment
              </h2>

              <div className="mb-6 space-y-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Configure the assignment settings and automatically assign
                  available staff to rooms.
                </p>

                {/* Date Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={autoAssignConfig.date}
                    onChange={(e) =>
                      setAutoAssignConfig({
                        ...autoAssignConfig,
                        date: e.target.value,
                      })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    required
                  />
                </div>

                {/* Shift Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Shift *
                  </label>
                  <select
                    value={autoAssignConfig.shift}
                    onChange={(e) =>
                      setAutoAssignConfig({
                        ...autoAssignConfig,
                        shift: e.target.value,
                      })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    required
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>

                {/* Max Rooms per Staff */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Max Rooms per Staff *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={autoAssignConfig.maxRooms}
                    onChange={(e) =>
                      setAutoAssignConfig({
                        ...autoAssignConfig,
                        maxRooms: parseInt(e.target.value) || 1,
                      })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    placeholder="5"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Maximum number of rooms to assign to each staff member
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowAutoAssignConfirm(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAutoAssign}
                  variant="primary"
                  icon={<Zap className="w-4 h-4" />}
                  className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                  disabled={
                    !autoAssignConfig.date ||
                    !autoAssignConfig.shift ||
                    autoAssignConfig.maxRooms < 1
                  }
                >
                  Start Assignment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
