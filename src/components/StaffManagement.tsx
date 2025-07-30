import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import TableNew from "./TableNew";
import Tag from "./ui/Tag";
import Button from "./ui/Button";
import AnalyticsCard from "./AnalyticsCard";
import { useStaffStore, type Staff } from "../store/staffStore";
import { useShiftsStore } from "../store/shiftsStore";
import {
  Users,
  AlertCircle,
  Phone,
  Calendar,
  Award,
  TrendingUp,
} from "lucide-react";

interface StaffManagementProps {
  searchFilter?: string;
  showAddStaffModal?: boolean;
  setShowAddStaffModal?: (show: boolean) => void;
  onFilterChange?: (filters: { searchFilter?: string }) => void;
  onAddStaff?: () => void;
}

const StaffManagement = ({
  searchFilter: externalSearchFilter,
  showAddStaffModal: externalShowAddStaffModal,
  setShowAddStaffModal: externalSetShowAddStaffModal,
}: StaffManagementProps = {}) => {
  const {
    staff,
    error: staffError,
    fetchStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    clearError: clearStaffError,
  } = useStaffStore();

  const { checkStaffHasShifts, getShiftsByStaffId, deleteShift } =
    useShiftsStore();

  // Staff management states
  const [internalShowAddStaffModal, setInternalShowAddStaffModal] =
    useState(false);

  // Use external props if provided, otherwise use internal state
  const showAddStaffModal =
    externalShowAddStaffModal !== undefined
      ? externalShowAddStaffModal
      : internalShowAddStaffModal;
  const setShowAddStaffModal =
    externalSetShowAddStaffModal || setInternalShowAddStaffModal;
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [assignedShiftsCount, setAssignedShiftsCount] = useState(0);
  const [newStaff, setNewStaff] = useState({ name: "", role: "", phone: "" });
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);

  // Use external search filter if provided, otherwise use empty string
  const searchFilter = externalSearchFilter || "";

  useEffect(() => {
    if (staff.length === 0) {
      fetchStaff();
    }
  }, [fetchStaff, staff.length]);

  // Filter staff whenever search changes
  useEffect(() => {
    let filtered = [...staff];

    if (searchFilter) {
      filtered = filtered.filter(
        (staffMember) =>
          staffMember.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          staffMember.role?.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    setFilteredStaff(filtered);
  }, [staff, searchFilter]);



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
      setNewStaff({ name: "", role: "", phone: "" });
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
        role: updates.role?.trim() || "", // Pass empty string to delete field
        phone: updates.phone?.trim() || "", // Pass empty string to delete field
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

  // Calculate staff analytics
  const staffWithRoles = staff.filter(member => member.role && member.role.trim() !== '');
  const staffWithPhone = staff.filter(member => member.phone && member.phone.trim() !== '');
  
  // Get role distribution
  const roles = staff.reduce((acc, member) => {
    const role = member.role || 'Unassigned';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonRole = Object.entries(roles).sort(([,a], [,b]) => b - a)[0];
  
  return (
    <div>
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard
          title="Total Staff"
          subtitle="Team members"
          value={staff.length}
          icon={<Users className="w-5 h-5" />}
          change={{
            value: staff.length > 10 ? 'Well staffed' : 'Growing team',
            type: staff.length > 10 ? 'increase' : 'neutral'
          }}
          className="w-full"
        />
        
        <AnalyticsCard
          title="With Roles"
          subtitle="Assigned positions"
          value={staffWithRoles.length}
          icon={<Award className="w-5 h-5" />}
          change={{
            value: `${Math.round((staffWithRoles.length / (staff.length || 1)) * 100)}% assigned`,
            type: (staffWithRoles.length / (staff.length || 1)) > 0.8 ? 'increase' : 'neutral'
          }}
          className="w-full"
        />
        
        <AnalyticsCard
          title="Contact Info"
          subtitle="Staff with phone numbers"
          value={staffWithPhone.length}
          icon={<Phone className="w-5 h-5" />}
          change={{
            value: `${Math.round((staffWithPhone.length / (staff.length || 1)) * 100)}% complete`,
            type: (staffWithPhone.length / (staff.length || 1)) > 0.7 ? 'increase' : 'decrease'
          }}
          className="w-full"
        />
        
        <AnalyticsCard
          title="Most Common Role"
          subtitle="Primary position"
          value={mostCommonRole ? mostCommonRole[1] : 0}
          icon={<TrendingUp className="w-5 h-5" />}
          change={{
            value: mostCommonRole ? mostCommonRole[0] : 'None',
            type: 'neutral'
          }}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing: {filteredStaff.length} / {staff.length} staff
        </div>
      </div>

      {/* Staff Error State */}
      {staffError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{staffError}</span>
          </div>
          <Button
            onClick={() => {
              clearStaffError();
              fetchStaff();
            }}
            variant="ghost"
            className="ml-4 underline hover:no-underline"
            size="sm"
          >
            Retry
          </Button>
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
        </div>
      )}

      {/* Staff Table */}
      {!staffError && filteredStaff.length > 0 && (
        <TableNew
          title="Staff Management"
          subtitle="Overview of all staff members"
          columns={[
            {
              key: "name",
              header: "Name",
              render: (value) => (
                <div className="font-medium text-gray-900">{value}</div>
              ),
            },
            {
              key: "role",
              header: "Role",
              render: (value) =>
                value ? (
                  <Tag>{value}</Tag>
                ) : (
                  <span className="text-gray-500">—</span>
                ),
            },
            {
              key: "phone",
              header: "Phone",
              render: (value) =>
                value ? (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Phone className="w-3 h-3" />
                    {value}
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                ),
            },
            {
              key: "createdAt",
              header: "Added",
              render: (value) => (
                <span className="text-gray-500">{formatCreatedAt(value)}</span>
              ),
            },
          ]}
          data={filteredStaff}
          onEditAction={(row) => handleEditStaff(row)}
          onDeleteAction={(row) => handleDeleteStaffClick(row)}
        />
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
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, role: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, phone: e.target.value })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setNewStaff({ name: "", role: "", phone: "" });
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStaff}
                  disabled={!newStaff.name.trim()}
                  variant="primary"
                >
                  Add Staff
                </Button>
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
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, name: e.target.value })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={editingStaff.role || ""}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, role: e.target.value })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingStaff.phone || ""}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        phone: e.target.value,
                      })
                    }
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setEditingStaff(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleSaveStaffEdit({
                      name: editingStaff.name,
                      role: editingStaff.role,
                      phone: editingStaff.phone,
                    })
                  }
                  disabled={!editingStaff.name.trim()}
                  variant="primary"
                >
                  Save Changes
                </Button>
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
                  <strong>{staffToDelete.name}</strong> has{" "}
                  <strong>{assignedShiftsCount}</strong> shift
                  {assignedShiftsCount !== 1 ? "s" : ""} assigned.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      Deleting this staff member will also remove all their
                      assigned shifts. This action cannot be undone.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteWarning(false);
                    setStaffToDelete(null);
                    setAssignedShiftsCount(0);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  variant="danger"
                >
                  Delete Staff & Shifts
                </Button>
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
                Are you sure you want to delete this staff member? This action
                cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setDeletingStaff(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteStaff(deletingStaff)}
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

export default StaffManagement;
