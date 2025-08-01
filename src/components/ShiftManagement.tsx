import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../context/useAuth";
import TableNew from "./TableNew";
import Tag from "./ui/Tag";
import EditModal from "./EditModal";
import Button from "./ui/Button";
import AnalyticsCard from "./AnalyticsCard";
import { useShiftsStore, type Shift } from "../store/shiftsStore";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ShiftManagementProps {
  dateFilter?: string;
  shiftFilter?: string;
  staffFilter?: string;
  onFilterChange?: (filters: {
    dateFilter?: string;
    shiftFilter?: string;
    staffFilter?: string;
  }) => void;
}

const ShiftManagement = ({
  dateFilter: externalDateFilter,
  shiftFilter: externalShiftFilter,
  staffFilter: externalStaffFilter,
}: ShiftManagementProps = {}) => {
  const { hasPermission } = useAuth();
  const { shifts, error, fetchShifts, updateShift, deleteShift, clearError } =
    useShiftsStore();

  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);

  // Internal filter states

  // Use external filters if provided, otherwise use empty string
  const dateFilter = externalDateFilter || "";
  const shiftFilter = externalShiftFilter || "";
  const staffFilter = externalStaffFilter || "";

  // Edit modal states
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Delete confirmation
  const [deletingShift, setDeletingShift] = useState<string | null>(null);

  useEffect(() => {
    if (shifts.length === 0) {
      fetchShifts();
    }
  }, [fetchShifts, shifts.length]);

  // Filter shifts whenever filters change
  useEffect(() => {
    let filtered = [...shifts];

    if (dateFilter) {
      filtered = filtered.filter((shift) => shift.date === dateFilter);
    }

    if (shiftFilter) {
      filtered = filtered.filter((shift) => shift.shift === shiftFilter);
    }

    if (staffFilter) {
      filtered = filtered.filter((shift) =>
        shift.staffName?.toLowerCase().includes(staffFilter.toLowerCase())
      );
    }

    setFilteredShifts(filtered);
  }, [shifts, dateFilter, shiftFilter, staffFilter]);

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
  };

  const handleSaveEdit = async (updatedData: Partial<Shift>) => {
    if (!editingShift) return;

    try {
      await updateShift(editingShift.id, updatedData);
      setEditingShift(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteShift(shiftId);
      setDeletingShift(null);
    } catch (err) {
      // Error is handled in the store
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCreatedAt = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate shift analytics
  const today = new Date().toISOString().split("T")[0];
  const todaysShifts = shifts.filter((shift) => shift.date === today);
  const morningShifts = shifts.filter(
    (shift) => shift.shift === "Morning (6 AM - 2 PM)"
  );

  // Get unique staff count
  const uniqueStaff = new Set(shifts.map((shift) => shift.staffName)).size;

  return (
    <div>
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard
          title="Today's Shifts"
          subtitle="Scheduled for today"
          value={todaysShifts.length}
          icon={<Calendar className="w-5 h-5" />}
          change={{
            value: todaysShifts.length > 0 ? "Active" : "None today",
            type: todaysShifts.length > 0 ? "increase" : "neutral",
          }}
          className="w-full"
        />

        <AnalyticsCard
          title="Total Shifts"
          subtitle="All assignments"
          value={shifts.length}
          icon={<Clock className="w-5 h-5" />}
          change={{
            value: shifts.length > 20 ? "Very active" : "Building up",
            type: shifts.length > 20 ? "increase" : "neutral",
          }}
          className="w-full"
        />

        <AnalyticsCard
          title="Active Staff"
          subtitle="Team members assigned"
          value={uniqueStaff}
          icon={<Users className="w-5 h-5" />}
          change={{
            value: uniqueStaff > 5 ? "Well distributed" : "Growing",
            type: uniqueStaff > 5 ? "increase" : "neutral",
          }}
          className="w-full"
        />

        <AnalyticsCard
          title="Morning Shifts"
          subtitle="6 AM - 2 PM shifts"
          value={morningShifts.length}
          icon={<TrendingUp className="w-5 h-5" />}
          change={{
            value: `${Math.round(
              (morningShifts.length / (shifts.length || 1)) * 100
            )}% of total`,
            type: "neutral",
          }}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing: {filteredShifts.length} / {shifts.length}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            onClick={() => {
              clearError();
              fetchShifts();
            }}
            variant="ghost"
            className="ml-4 underline hover:no-underline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!error && shifts.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No shifts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            No shift assignments have been created yet.
          </p>
          <Link to="/shift-form">
            <Button variant="primary">Create First Shift</Button>
          </Link>
        </div>
      )}

      {/* Shifts Table */}
      {!error && filteredShifts.length > 0 && (
        <TableNew
          title="Shift Management"
          subtitle="Overview of all shift assignments"
          columns={[
            {
              key: "date",
              header: "Date",
              render: (value) => formatDate(value),
            },
            {
              key: "shift",
              header: "Shift",
              render: (value) => <Tag>{value}</Tag>,
            },
            {
              key: "staffName",
              header: "Staff",
              render: (value) => (
                <div className="font-medium text-gray-900">
                  {value || "Unknown Staff"}
                </div>
              ),
            },
            {
              key: "rooms",
              header: "Rooms",
              render: (value) => (
                <div className="flex flex-wrap gap-1">
                  {value.slice(0, 3).map((room: string, index: number) => (
                    <Tag key={index}>{room}</Tag>
                  ))}
                  {value.length > 3 && <Tag>+{value.length - 3}</Tag>}
                </div>
              ),
            },
            {
              key: "notes",
              header: "Notes",
              render: (value) =>
                value ? (
                  <div className="truncate max-w-xs" title={value}>
                    {value}
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                ),
            },
            {
              key: "createdAt",
              header: "Created",
              render: (value) => (
                <span className="text-gray-500">{formatCreatedAt(value)}</span>
              ),
            },
          ]}
          data={filteredShifts}
          onEditAction={(row) => handleEditShift(row)}
          onDeleteAction={
            hasPermission("canDeleteShifts")
              ? (row) => setDeletingShift(row.id)
              : undefined
          }
        />
      )}

      <EditModal
        shift={editingShift}
        isOpen={!!editingShift}
        onClose={() => setEditingShift(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      {deletingShift && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Delete Shift
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this shift? This action cannot
                be undone.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setDeletingShift(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteShift(deletingShift)}
                  variant="danger"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
