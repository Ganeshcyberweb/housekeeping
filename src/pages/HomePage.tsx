import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import { useShiftsStore } from "../store/shiftsStore";
import { useStaffStore } from "../store/staffStore";
import { useRoomStore } from "../store/roomStore";
import {
  Calendar,
  Users,
  Home as HomeIcon,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck,
  Bell,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";

export default function Home() {
  const { user, loading, userProfile, isAdmin } = useAuth();
  const { shifts, fetchShifts } = useShiftsStore();
  const { fetchStaff, getPendingApprovalStaff, approveStaff, disapproveStaff } =
    useStaffStore();
  const { fetchRooms } = useRoomStore();

  // State for pending approvals
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [approvingStaff, setApprovingStaff] = useState<string | null>(null);
  const [disapprovingStaff, setDisapprovingStaff] = useState<string | null>(
    null
  );

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (user && userProfile) {
        try {
          await Promise.all([fetchShifts(), fetchStaff(), fetchRooms()]);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [user, userProfile, fetchShifts, fetchStaff, fetchRooms]);

  // Handler functions for staff approval
  const handleApproveStaff = async (staffId: string) => {
    if (!user?.uid) return;

    setApprovingStaff(staffId);
    try {
      await approveStaff(staffId, user.uid);
    } catch (err) {
      console.error("[HomePage] Error approving staff:", err);
    } finally {
      setApprovingStaff(null);
    }
  };

  const handleDisapproveStaff = async (staffId: string) => {
    setDisapprovingStaff(staffId);
    try {
      await disapproveStaff(staffId);
    } catch (err) {
      console.error("[HomePage] Error disapproving staff:", err);
    } finally {
      setDisapprovingStaff(null);
    }
  };

  const formatCreatedAt = (timestamp: any) => {
    return timestamp.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate analytics
  const today = new Date().toISOString().split("T")[0];

  // Filter shifts based on user role
  const getFilteredShifts = (shiftList: typeof shifts) => {
    if (userProfile?.role === "staff") {
      // Staff users only see their assigned shifts
      return shiftList.filter(
        (shift) =>
          shift.staffName === user?.displayName ||
          // shift.staffEmail === user?.email ||
          shift.staffId === user?.uid
      );
    }
    // Admin and manager see all shifts
    return shiftList;
  };

  const filteredShifts = getFilteredShifts(shifts);
  const todaysShifts = filteredShifts.filter((shift) => shift.date === today);

  // Get recent shifts (last 5) - filtered for staff
  const recentShifts = filteredShifts
    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
    .slice(0, 5);

  // Get tomorrow's date for upcoming shifts
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const tomorrowShifts = filteredShifts.filter(
    (shift) => shift.date === tomorrowStr
  );

  // Get upcoming shifts (next 7 days) for staff
  const getUpcomingShifts = () => {
    if (userProfile?.role !== "staff") return [];

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return filteredShifts
      .filter((shift) => {
        const shiftDate = new Date(shift.date);
        const todayDate = new Date(today);
        return shiftDate > todayDate && shiftDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const upcomingShifts = getUpcomingShifts();

  // Staff with most shifts
  const staffShiftCounts = shifts.reduce((acc, shift) => {
    const staffName = shift.staffName || "Unknown";
    acc[staffName] = (acc[staffName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topStaff = Object.entries(staffShiftCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (loading) {
    return (
      <div className=" dark:bg-gray-800 min-h-screen p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400 text-sm">
              Loading...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
          {userProfile?.role === "staff" ? (
            // Staff-specific dashboard
            <div className="space-y-6">
              {/* Today's Assigned Shifts */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  My Shifts Today
                </h2>

                {todaysShifts.length > 0 ? (
                  <div className="space-y-3">
                    {todaysShifts.map((shift, index) => (
                      <div
                        key={shift.id || index}
                        className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border-l-4 border-purple-500"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {shift.shift}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Rooms:{" "}
                              {shift.rooms?.join(", ") || "No rooms assigned"}
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Today
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No shifts assigned for today
                    </p>
                  </div>
                )}
              </div>

              {/* Tomorrow's Assigned Shifts */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  Tomorrow's Shifts
                </h2>

                {tomorrowShifts.length > 0 ? (
                  <div className="space-y-3">
                    {tomorrowShifts.map((shift, index) => (
                      <div
                        key={shift.id || index}
                        className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border-l-4 border-blue-500"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {shift.shift}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Rooms:{" "}
                              {shift.rooms?.join(", ") || "No rooms assigned"}
                            </p>
                          </div>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            Tomorrow
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No shifts assigned for tomorrow
                    </p>
                  </div>
                )}
              </div>

              {/* Upcoming Shifts */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upcoming Shifts
                </h2>

                {upcomingShifts.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingShifts.map((shift, index) => (
                      <div
                        key={shift.id || index}
                        className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl border-l-4 border-gray-400"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {shift.shift}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Date: {new Date(shift.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Rooms:{" "}
                              {shift.rooms?.join(", ") || "No rooms assigned"}
                            </p>
                          </div>
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            Upcoming
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No upcoming shifts assigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Admin/Manager dashboard - original content
            <>
              {/* Pending Approvals Section */}
              {isAdmin() && getPendingApprovalStaff().length > 0 && (
                <div className="mb-8">
                  <div className="bg-stone-50 dark:bg-yellow-900/20 border border-stone-200 dark:border-yellow-800 rounded-lg p-6">
                    <button
                      onClick={() =>
                        setShowPendingApprovals(!showPendingApprovals)
                      }
                      className="flex items-center justify-between w-full mb-4 hover:bg-stone-100 dark:hover:bg-yellow-900/30 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">
                          Pending Approvals ({getPendingApprovalStaff().length})
                        </h3>
                      </div>
                      {showPendingApprovals ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {showPendingApprovals && (
                      <>
                        <p className="text-sm mb-4">
                          The following staff members are waiting for admin
                          approval to access the system:
                        </p>
                        <div className="space-y-3">
                          {getPendingApprovalStaff().map((pendingStaff) => (
                            <div
                              key={pendingStaff.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-stone-100 dark:border-yellow-700 gap-3 sm:gap-0"
                            >
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {pendingStaff.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {pendingStaff.email} •{" "}
                                    {pendingStaff.systemRole}
                                    {pendingStaff.jobRole &&
                                      ` • ${pendingStaff.jobRole}`}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    Registered:{" "}
                                    {formatCreatedAt(pendingStaff.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                                <Button
                                  onClick={() => handleApproveStaff(pendingStaff.id)}
                                  disabled={
                                    approvingStaff === pendingStaff.id ||
                                    disapprovingStaff === pendingStaff.id
                                  }
                                  variant="default"
                                  size="sm"
                                  icon={<Check className="w-4 h-4" />}
                                  title="Approve"
                                >
                                  {approvingStaff === pendingStaff.id
                                    ? "Approving..."
                                    : "Approve"}
                                </Button>
                                <Button
                                  onClick={() => handleDisapproveStaff(pendingStaff.id)}
                                  disabled={
                                    disapprovingStaff === pendingStaff.id ||
                                    approvingStaff === pendingStaff.id
                                  }
                                  variant="default"
                                  size="sm"
                                  icon={<X className="w-4 h-4" />}
                                  title="Disapprove"
                                >
                                  {disapprovingStaff === pendingStaff.id
                                    ? "Disapproving..."
                                    : "Deny"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Main Dashboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      Today's Schedule
                    </h2>
                    <Link
                      to="/admin/shift-management"
                      className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {todaysShifts.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {todaysShifts.slice(0, 4).map((shift, index) => (
                        <div
                          key={shift.id || index}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl gap-3 sm:gap-0"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                {shift.staffName || "Unassigned"}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {shift.shift} •{" "}
                                {shift.rooms?.slice(0, 2).join(", ")}
                                {shift.rooms?.length > 2 &&
                                  ` +${shift.rooms.length - 2} more`}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full self-start sm:self-center">
                            Active
                          </span>
                        </div>
                      ))}
                      {todaysShifts.length > 4 && (
                        <div className="text-center pt-2">
                          <Link
                            to="/admin/shift-management"
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            View {todaysShifts.length - 4} more shifts
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No shifts scheduled for today
                      </p>
                      <Link
                        to="/shift-form"
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-2 inline-block"
                      >
                        Create your first shift
                      </Link>
                    </div>
                  )}
                </div>

                {/* Quick Stats & Actions */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Tomorrow's Preview */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Tomorrow's Shifts
                    </h3>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                        {tomorrowShifts.length}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {tomorrowShifts.length === 0
                          ? "No shifts planned"
                          : tomorrowShifts.length === 1
                          ? "shift scheduled"
                          : "shifts scheduled"}
                      </p>
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Top Performers
                    </h3>
                    {topStaff.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {topStaff.map(([name, count], index) => (
                          <div
                            key={name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : index === 1
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {name}
                              </span>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                              {count} shifts
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                        No shift data yet
                      </p>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Quick Actions
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <Link
                        to="/admin/shift-management"
                        className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          Manage Shifts
                        </span>
                      </Link>
                      <Link
                        to="/admin/staff-management"
                        className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          Manage Staff
                        </span>
                      </Link>
                      <Link
                        to="/admin/room-management"
                        className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <HomeIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          Manage Rooms
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity - only for admin/manager */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    Recent Activity
                  </h2>
                </div>

                {recentShifts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {recentShifts.map((shift, index) => (
                      <div
                        key={shift.id || index}
                        className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              Shift assigned to {shift.staffName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {shift.shift} on{" "}
                              {new Date(shift.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {shift.rooms?.length || 0} room
                              {shift.rooms?.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      No recent activity
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 max-w-lg w-full text-center">
            <div className="mb-6">
              <div className="bg-purple-500 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <HomeIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Housekeeping Shift Planner
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Streamline your housekeeping operations with our comprehensive
                shift management system.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Schedule and manage shifts
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Organize your team
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Track performance
                </span>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Sign In to Get Started
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
