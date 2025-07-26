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
import Button from "./Button";
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
  Loader2,
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
        staff: shift.staff,
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
      setFormData((prev) => ({ ...prev, staff: "" }));
    } else {
      setShowCustomStaff(false);
      setCustomStaff("");
      setFormData((prev) => ({ ...prev, staff: staffValue }));
    }
  };

  const handleCustomStaffSubmit = () => {
    if (customStaff.trim()) {
      setFormData((prev) => ({ ...prev, staff: customStaff.trim() }));
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
      !formData.staff ||
      !formData.rooms?.length
    ) {
      return;
    }

    // Auto-add custom staff if they entered a name but didn't click "Add"
    const actualStaff =
      showCustomStaff && customStaff.trim()
        ? customStaff.trim()
        : formData.staff;

    // Auto-add custom room if they entered a name but didn't click "Add"
    const actualRooms =
      showCustomRoom &&
      customRoom.trim() &&
      !formData.rooms.includes(customRoom.trim())
        ? [...formData.rooms, customRoom.trim()]
        : formData.rooms;

    setLoading(true);
    try {
      await onSave({
        date: formData.date,
        shift: formData.shift,
        staff: actualStaff,
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
    <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Shift
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selector */}
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Calendar className="w-4 h-4" />
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
              <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Clock className="w-4 h-4" />
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
              <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Users className="w-4 h-4" />
                Staff Member
              </label>
              <Select
                id="edit-staff-member"
                label=""
                value={showCustomStaff ? "custom" : formData.staff || ""}
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
                <div className="mt-3 flex gap-2">
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCustomStaffSubmit}
                  >
                    <div className="inline-flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Add
                    </div>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowCustomStaff(false);
                      setCustomStaff("");
                    }}
                  >
                    <div className="inline-flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Cancel
                    </div>
                  </Button>
                </div>
              )}

              {formData.staff && !showCustomStaff && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Selected: {formData.staff}
                </p>
              )}
            </div>

            {/* Room Selection */}
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Building className="w-4 h-4" />
                Rooms
              </label>
              <DropdownCheckBox
                id="edit-rooms"
                label=""
                options={roomList.map((room) => ({ value: room, label: room }))}
                selectedValues={formData.rooms || []}
                onChange={(selectedRooms) =>
                  setFormData((prev) => ({ ...prev, rooms: selectedRooms }))
                }
                placeholder="Select rooms"
              />

              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCustomRoom(true)}
                >
                  <div className="inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Custom Room
                  </div>
                </Button>
              </div>

              {showCustomRoom && (
                <div className="mt-3 flex gap-2">
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddCustomRoom}
                  >
                    <div className="inline-flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Add
                    </div>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowCustomRoom(false);
                      setCustomRoom("");
                    }}
                  >
                    <div className="inline-flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Cancel
                    </div>
                  </Button>
                </div>
              )}

              {formData.rooms && formData.rooms.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
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
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                <div className="inline-flex items-center gap-2">Cancel</div>
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
