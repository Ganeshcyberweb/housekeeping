import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import Table from "./Table";
import { useStaffStore, type Staff } from "../store/staffStore";
import { useShiftsStore } from "../store/shiftsStore";
import {
  RefreshCw,
  Users,
  Edit,
  Trash2,
  AlertCircle,
  UserPlus,
  Phone,
  Calendar,
} from "lucide-react";

const StaffManagement = () => {
  const {
    staff,
    error: staffError,
    fetchStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    clearError: clearStaffError,
  } = useStaffStore();
  
  const {
    checkStaffHasShifts,
    getShiftsByStaffId,
    deleteShift,
  } = useShiftsStore();

  // Staff management states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [assignedShiftsCount, setAssignedShiftsCount] = useState(0);
  const [newStaff, setNewStaff] = useState({ name: '', role: '', phone: '' });

  useEffect(() => {
    if (staff.length === 0) {
      fetchStaff();
    }
  }, [fetchStaff, staff.length]);

  // Staff management functions
  const handleAddStaff = async () => {
    if (!newStaff.name.trim()) return;
    
    try {
      const staffData: any = {
        name: newStaff.name.trim(),
      };
      
      // Only add role and phone if they have values
      if (newStaff.role.trim()) {
        staffData.role = newStaff.role.trim();
      }
      
      if (newStaff.phone.trim()) {
        staffData.phone = newStaff.phone.trim();
      }
      
      await addStaff(staffData);
      setNewStaff({ name: '', role: '', phone: '' });
      setShowAddStaffModal(false);
    } catch (err) {
      // Error is handled in the store
    }
  };

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
  };

  const handleSaveStaffEdit = async (updates: Partial<Staff>) => {
    if (!editingStaff) return;
    
    try {
      const cleanUpdates: any = {
        name: updates.name?.trim(),
        role: updates.role?.trim() || '',  // Pass empty string to delete field
        phone: updates.phone?.trim() || '', // Pass empty string to delete field
      };
      
      await updateStaff(editingStaff.id, cleanUpdates);
      setEditingStaff(null);
    } catch (err) {
      // Error is handled in the store
    }
  };

  const handleDeleteStaffClick = (staffMember: Staff) => {
    const hasShifts = checkStaffHasShifts(staffMember.id);
    if (hasShifts) {
      const shifts = getShiftsByStaffId(staffMember.id);
      setStaffToDelete(staffMember);
      setAssignedShiftsCount(shifts.length);
      setShowDeleteWarning(true);
    } else {
      setDeletingStaff(staffMember.id);
    }
  };

  const handleConfirmDelete = async () => {
    if (staffToDelete) {
      try {
        // First get all shifts assigned to this staff member
        const assignedShifts = getShiftsByStaffId(staffToDelete.id);
        
        // Delete all associated shifts first
        for (const shift of assignedShifts) {
          await deleteShift(shift.id);
        }
        
        // Then delete the staff member
        await deleteStaff(staffToDelete.id);
        
        setStaffToDelete(null);
        setShowDeleteWarning(false);
        setAssignedShiftsCount(0);
      } catch (err) {
        // Error is handled in the store
      }
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await deleteStaff(staffId);
      setDeletingStaff(null);
    } catch (err) {
      // Error is handled in the store
    }
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
          Total staff: {staff.length}
        </div>
        <button
          onClick={() => setShowAddStaffModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Error State */}
      {staffError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{staffError}</span>
          </div>
          <button
            onClick={() => {
              clearStaffError();
              fetchStaff();
            }}
            className="ml-4 underline hover:no-underline text-gray-900 dark:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Staff Empty State */}
      {!staffError && staff.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No staff members found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Add your first staff member to get started.
          </p>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add Staff Member
          </button>
        </div>
      )}

      {/* Staff Table */}
      {!staffError && staff.length > 0 && (
        <Table
          columns={[
            {
              key: "name",
              header: "Name",
              render: (value) => (
                <div className="font-medium text-gray-900 dark:text-white">
                  {value}
                </div>
              ),
            },
            {
              key: "role",
              header: "Role",
              render: (value) => (
                value ? (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                    {value}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">—</span>
                )
              ),
            },
            {
              key: "phone",
              header: "Phone",
              render: (value) => (
                value ? (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Phone className="w-3 h-3" />
                    {value}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">—</span>
                )
              ),
            },
            {
              key: "createdAt",
              header: "Added",
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
                    onClick={() => handleEditStaff(row)}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={() => handleDeleteStaffClick(row)}
                    className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={staff}
        />
      )}

      {/* Staff Footer */}
      {!staffError && staff.length > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              {staff.length} staff member{staff.length !== 1 ? "s" : ""}
            </div>
            <button
              onClick={fetchStaff}
              className="inline-flex items-center gap-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-xs py-1 px-3"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add Staff Member
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Enter staff name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="e.g., Cleaner, Supervisor"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setNewStaff({ name: '', role: '', phone: '' });
                  }}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  disabled={!newStaff.name.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Edit Staff Member
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={editingStaff.role || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingStaff(null)}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveStaffEdit({
                    name: editingStaff.name,
                    role: editingStaff.role,
                    phone: editingStaff.phone,
                  })}
                  disabled={!editingStaff.name.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Deletion Warning Modal */}
      {showDeleteWarning && staffToDelete && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Staff Has Assigned Shifts
              </h2>
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  <strong>{staffToDelete.name}</strong> has <strong>{assignedShiftsCount}</strong> shift{assignedShiftsCount !== 1 ? 's' : ''} assigned.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      Deleting this staff member will also remove all their assigned shifts. This action cannot be undone.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteWarning(false);
                    setStaffToDelete(null);
                    setAssignedShiftsCount(0);
                  }}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
                >
                  Delete Staff & Shifts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Delete Staff Member
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this staff member? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingStaff(null)}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteStaff(deletingStaff)}
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

export default StaffManagement;