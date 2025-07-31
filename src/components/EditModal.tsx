import { useState, useEffect } from "react";
import { type Shift } from "../store/shiftsStore";
import {
  type ShiftFormData,
  SHIFT_TYPES,
  STAFF_LIST,
  ROOM_LIST,
} from "../constants/shiftConstants";
import Select from "./Select";
import Input from "./Input";
import Button from "./ui/Button";
import DropdownCheckBox from "./DropdownCheckbox";
import TextArea from "./TextArea";
import {
  Calendar,
  Clock,
  Users,
  Building,
  FileText,
  Save,
  Plus,
  X,
} from "lucide-react";

interface EditModalProps {
  shift: Shift | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Shift>) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({
  shift,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<ShiftFormData>>({});
  const [loading, setLoading] = useState(false);
  const [customStaff, setCustomStaff] = useState("");
  const [showCustomStaff, setShowCustomStaff] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [showCustomRoom, setShowCustomRoom] = useState(false);
  const [roomList, setRoomList] = useState([...ROOM_LIST]);

  useEffect(() => {
    if (shift) {
      setFormData({
        date: shift.date,
        shift: shift.shift,
        staffId: shift.staffId,
        staffName: shift.staffName,
        roomIds: shift.roomIds,
        rooms: shift.rooms,
        notes: shift.notes,
      });
    }
  }, [shift]);

  const handleInputChange = (
    field: keyof ShiftFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStaffSelection = (staffValue: string) => {
    if (staffValue === "custom") {
      setShowCustomStaff(true);
      setFormData((prev) => ({ ...prev, staffId: "", staffName: "" }));
    } else {
      setShowCustomStaff(false);
      setCustomStaff("");
      setFormData((prev) => ({ ...prev, staffId: staffValue, staffName: staffValue }));
    }
  };

  const handleCustomStaffSubmit = () => {
    if (customStaff.trim()) {
      setFormData((prev) => ({ ...prev, staffId: customStaff.trim(), staffName: customStaff.trim() }));
      setShowCustomStaff(false);
    }
  };

  const handleAddCustomRoom = () => {
    if (customRoom.trim() && !formData.rooms?.includes(customRoom.trim())) {
      // Add to room list if not exists
      if (!roomList.includes(customRoom.trim())) {
        setRoomList((prev) => [...prev, customRoom.trim()]);
      }
      // Add to selected rooms
      setFormData((prev) => ({
        ...prev,
        rooms: [...(prev.rooms || []), customRoom.trim()],
        roomIds: [...(prev.roomIds || []), customRoom.trim()],
      }));
      setCustomRoom("");
      setShowCustomRoom(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.date ||
      !formData.shift ||
      !formData.staffId ||
      !formData.rooms?.length
    ) {
      return;
    }

    // Auto-add custom staff if they entered a name but didn't click "Add"
    const actualStaffId =
      showCustomStaff && customStaff.trim()
        ? customStaff.trim()
        : formData.staffId;
    const actualStaffName =
      showCustomStaff && customStaff.trim()
        ? customStaff.trim()
        : formData.staffName;

    // Auto-add custom room if they entered a name but didn't click "Add"
    const actualRooms =
      showCustomRoom &&
      customRoom.trim() &&
      !formData.rooms?.includes(customRoom.trim())
        ? [...(formData.rooms || []), customRoom.trim()]
        : formData.rooms || [];
    const actualRoomIds =
      showCustomRoom &&
      customRoom.trim() &&
      !formData.roomIds?.includes(customRoom.trim())
        ? [...(formData.roomIds || []), customRoom.trim()]
        : formData.roomIds || [];

    setLoading(true);
    try {
      await onSave({
        date: formData.date,
        shift: formData.shift,
        staffId: actualStaffId,
        staffName: actualStaffName,
        roomIds: actualRoomIds,
        rooms: actualRooms,
        notes: formData.notes || "",
      });
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Edit Shift
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Date Selector */}
            <div>
              <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                Date
              </label>
              <Input
                id="edit-date"
                type="date"
                label=""
                value={formData.date || ""}
                onChange={(value) => handleInputChange("date", value)}
                required
              />
            </div>

            {/* Shift Type */}
            <div>
              <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Shift Type
              </label>
              <Select
                id="edit-shift-type"
                label=""
                value={formData.shift || ""}
                onChange={(value) => handleInputChange("shift", value)}
                options={SHIFT_TYPES.map((shift) => ({
                  value: shift,
                  label: shift,
                }))}
                placeholder="Select shift type"
                required
              />
            </div>

            {/* Staff Selection */}
            <div>
              <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Staff Member
              </label>
              <Select
                id="edit-staff-member"
                label=""
                value={showCustomStaff ? "custom" : formData.staffId || ""}
                onChange={handleStaffSelection}
                options={[
                  ...STAFF_LIST.map((staff) => ({
                    value: staff,
                    label: staff,
                  })),
                  { value: "custom", label: "+ Add Custom Staff Member" },
                ]}
                placeholder="Select staff member"
                required
              />

              {showCustomStaff && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      id="edit-custom-staff"
                      label=""
                      value={customStaff}
                      onChange={setCustomStaff}
                      placeholder="Enter staff name"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCustomStaffSubmit()
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCustomStaffSubmit}
                      icon={<Plus className="w-3 h-3" />}
                    >
                      Add
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowCustomStaff(false);
                        setCustomStaff("");
                      }}
                      icon={<X className="w-3 h-3" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {formData.staffName && !showCustomStaff && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {formData.staffName}
                </p>
              )}
            </div>

            {/* Room Selection */}
            <div>
              <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                Rooms
              </label>
              <DropdownCheckBox
                id="edit-rooms"
                label=""
                options={roomList.map((room) => ({ value: room, label: room }))}
                selectedValues={formData.rooms || []}
                onChange={(selectedRooms) =>
                  setFormData((prev) => ({ ...prev, rooms: selectedRooms, roomIds: selectedRooms }))
                }
                placeholder="Select rooms"
              />

              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCustomRoom(true)}
                  icon={<Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
                >
                  <span className="hidden sm:inline">Add Custom Room</span>
                  <span className="sm:hidden">Add Room</span>
                </Button>
              </div>

              {showCustomRoom && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      id="edit-custom-room"
                      label=""
                      value={customRoom}
                      onChange={setCustomRoom}
                      placeholder="Enter room name"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddCustomRoom()
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddCustomRoom}
                      icon={<Plus className="w-3 h-3" />}
                    >
                      Add
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowCustomRoom(false);
                        setCustomRoom("");
                      }}
                      icon={<X className="w-3 h-3" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {formData.rooms && formData.rooms.length > 0 && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {formData.rooms.join(", ")}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <TextArea
                id="edit-notes"
                label="Notes (Optional)"
                value={formData.notes || ""}
                onChange={(value) => handleInputChange("notes", value)}
                rows={3}
                placeholder="Any additional remarks or special instructions..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={onClose} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                loading={loading}
                icon={loading ? undefined : <Save className="w-3 h-3 sm:w-4 sm:h-4" />}
                className="w-full sm:w-auto"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
