import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import Table from "./Table";
import EditModal from "./EditModal";
import { useShiftsStore, type Shift } from "../store/shiftsStore";
import {
  RefreshCw,
  Search,
  X,
  Calendar,
  Clock,
  Users,
  Edit,
  Trash2,
  AlertCircle,
  FileText,
} from "lucide-react";

const ShiftManagement = () => {
  const { shifts, error, fetchShifts, updateShift, deleteShift, clearError } =
    useShiftsStore();

  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);

  // Filter states
  const [dateFilter, setDateFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");

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

  const clearFilters = () => {
    setDateFilter("");
    setShiftFilter("");
    setStaffFilter("");
  };

  const uniqueShiftTypes = [...new Set(shifts.map((shift) => shift.shift))];

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing: {filteredShifts.length} / {shifts.length}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-1">
            <Calendar className="w-4 h-4" />
            Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
        </div>
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-1">
            <Clock className="w-4 h-4" />
            Shift
          </label>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="">All shifts</option>
            {uniqueShiftTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-1">
            <Users className="w-4 h-4" />
            Staff
          </label>
          <input
            type="text"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            placeholder="Search by name..."
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 w-full"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              clearError();
              fetchShifts();
            }}
            className="ml-4 underline hover:no-underline text-gray-900 dark:text-white"
          >
            Retry
          </button>
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
          <a
            href="/shift-form"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm"
          >
            Create First Shift
          </a>
        </div>
      )}

      {/* No Results State */}
      {!error && shifts.length > 0 && filteredShifts.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No shifts match your filters
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Try adjusting your search criteria.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      )}

      {/* Shifts Table */}
      {!error && filteredShifts.length > 0 && (
        <Table
          columns={[
            {
              key: "date",
              header: "Date",
              render: (value) => formatDate(value),
            },
            {
              key: "shift",
              header: "Shift",
              render: (value) => (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                  {value}
                </span>
              ),
            },
            {
              key: "staffName",
              header: "Staff",
              render: (value) => (
                <div className="font-medium text-gray-900 dark:text-white">
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
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600"
                    >
                      {room}
                    </span>
                  ))}
                  {value.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600">
                      +{value.length - 3}
                    </span>
                  )}
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
                  <span className="text-gray-500 dark:text-gray-400">—</span>
                ),
            },
            {
              key: "createdAt",
              header: "Created",
              render: (value) => (
                <span className="text-gray-500 dark:text-gray-400">
                  {formatCreatedAt(value)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditShift(row)}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={() => setDeletingShift(row.id)}
                    className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredShifts}
        />
      )}

      {/* Footer */}
      {!error && shifts.length > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              {filteredShifts.length} of {shifts.length} shift
              {shifts.length !== 1 ? "s" : ""}
            </div>
            <button
              onClick={fetchShifts}
              className="inline-flex items-center gap-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-xs py-1 px-3"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
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
                <button
                  onClick={() => setDeletingShift(null)}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteShift(deletingShift)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
