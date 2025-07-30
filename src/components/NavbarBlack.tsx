import { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
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
  const location = useLocation();
  const [showShiftsDropdown, setShowShiftsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShiftsDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut?.();
      setShowUserDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
    <div className="bg-[#0B0F19] m-4 text-white rounded-2xl p-6 flex flex-col gap-32 -md min-h-[140px]">
      {/* Top Navbar */}
      <div className="flex items-center justify-between">
        {/* Left - Logo & Links */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="bg-purple-500 p-2 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M12 2l9 4.9v9.8L12 22l-9-5.3V6.9L12 2z" />
            </svg>
          </div>
          <span className="font-semibold text-lg">Shift Planner</span>

          {/* Nav Links */}
          <ul className="flex items-center ml-6 space-x-4 text-gray-400">
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
                  location.pathname === "/admin/shift-management" || location.pathname === "/shift-form"
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
        </div>

        {/* Right - User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-3 hover:bg-[#1C2333] rounded-lg p-2 transition-colors"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-white">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-400">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <img
              src={user?.photoURL || "https://i.pravatar.cc/40"}
              alt="user"
              className="w-9 h-9 rounded-full border border-gray-500"
            />
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showUserDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-[#1C2333] rounded-lg shadow-lg py-2 min-w-[200px] z-50 border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-medium text-white">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              
              <button
                onClick={() => setShowUserDropdown(false)}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2A3441] transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              
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
      <div className="flex justify-between items-center px-2 pb-2">
        {pageInfo.showGreeting ? (
          // Home page - Show greeting
          <>
            <h1 className="text-4xl">
              {getGreeting()}, {user?.displayName || "User"}!
            </h1>
            <div className="flex items-center gap-4">
              <Link to={"/shift-form"}>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                  New shift
                </Button>
              </Link>
            </div>
          </>
        ) : (
          // Other pages - Show page title, filters below, and actions on the right
          <div className="w-full">
            {/* Top row - Page title and action buttons */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-semibold">{pageInfo.title}</h1>
                {pageInfo.showFilters && (
                  <p className="text-gray-400 mt-1">
                    {pageInfo.filterType === "shift" &&
                      "Manage and filter shift assignments"}
                    {pageInfo.filterType === "staff" &&
                      "Manage staff members and their details"}
                    {pageInfo.filterType === "room" &&
                      "Manage rooms and their status"}
                  </p>
                )}
              </div>

              {/* Right side - Date and Action Buttons */}
              <div className="flex items-center gap-4"></div>
            </div>
            <div className="flex justify-between items-center">
              {/* Bottom row - Page-specific filters */}
              {pageInfo.showFilters && (
                <div className="flex items-center gap-4">
                  {/* Shift Management Filters */}
                  {pageInfo.filterType === "shift" && (
                    <div className="flex items-center gap-4">
                      {/* Date Filter */}
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

                      {/* Shift Type Filter */}
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
                        <option value="Morning (6 AM - 2 PM)">Morning</option>
                        <option value="Afternoon (2 PM - 10 PM)">
                          Afternoon
                        </option>
                        <option value="Night (10 PM - 6 AM)">Night</option>
                      </FilterSelect>

                      {/* Staff Filter */}
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
                        className="w-32"
                      />
                    </div>
                  )}

                  {/* Staff Management Filters */}
                  {pageInfo.filterType === "staff" && (
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
                      className="w-48"
                    />
                  )}

                  {/* Room Management Filters */}
                  {pageInfo.filterType === "room" && (
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
                      className="w-56"
                    />
                  )}
                </div>
              )}
              {/* Page-specific Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Home Page - Create Shift Button */}
                {location.pathname === "/" && (
                  <Link to={"/shift-form"}>
                    <Button
                      variant="primary"
                      icon={<Plus className="w-4 h-4" />}
                    >
                      New shift
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
                      Bulk Upload
                    </Button>
                    <Button
                      onClick={onAddRoom}
                      variant="primary"
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Add Room
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
                    Add Staff Member
                  </Button>
                )}

                {/* Shift Management Page - Create New Shift */}
                {location.pathname === "/admin/shift-management" && (
                  <Link to={"/shift-form"}>
                    <Button
                      variant="primary"
                      icon={<Plus className="w-4 h-4" />}
                    >
                      New Shift
                    </Button>
                  </Link>
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
                      New shift
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
