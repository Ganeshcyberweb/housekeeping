import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import Input from "../components/Input";
import Button from "../components/Button";
import DropdownCheckBox from "../components/DropdownCheckbox";
import { useShiftsStore } from "../store/shiftsStore";
import {
  type ShiftFormData,
  SHIFT_TYPES,
  STAFF_LIST,
  ROOM_LIST,
} from "../constants/shiftConstants";
import { Save, Plus, X, Loader2 } from "lucide-react";

const ShiftFormPage = () => {
  const { fetchShifts } = useShiftsStore();
  const [formData, setFormData] = useState<ShiftFormData>({
    date: "",
    shift: "",
    staff: "",
    rooms: [],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customStaff, setCustomStaff] = useState("");
  const [showCustomStaff, setShowCustomStaff] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [showCustomRoom, setShowCustomRoom] = useState(false);
  const [roomList, setRoomList] = useState([...ROOM_LIST]);

  const handleInputChange = (field: keyof ShiftFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
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
    setError(null);
    setSuccess(false);
  };

  const handleCustomStaffSubmit = () => {
    if (customStaff.trim()) {
      setFormData((prev) => ({ ...prev, staff: customStaff.trim() }));
      setShowCustomStaff(false);
    }
  };

  const handleAddCustomRoom = () => {
    if (customRoom.trim() && !formData.rooms.includes(customRoom.trim())) {
      // Add to room list if not exists
      if (!roomList.includes(customRoom.trim())) {
        setRoomList((prev) => [...prev, customRoom.trim()]);
      }
      // Add to selected rooms
      setFormData((prev) => ({
        ...prev,
        rooms: [...prev.rooms, customRoom.trim()],
      }));
      setCustomRoom("");
      setShowCustomRoom(false);
    }
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine the actual staff value for validation
    const actualStaff =
      showCustomStaff && customStaff.trim()
        ? customStaff.trim()
        : formData.staff;

    // Determine the actual rooms for validation (include custom room if entered)
    const actualRooms =
      showCustomRoom &&
      customRoom.trim() &&
      !formData.rooms.includes(customRoom.trim())
        ? [...formData.rooms, customRoom.trim()]
        : formData.rooms;

    // Validate with the actual values
    if (!formData.date) {
      setError("Date is required");
      return;
    }
    if (!formData.shift) {
      setError("Shift type is required");
      return;
    }
    if (!actualStaff) {
      setError("Staff selection is required");
      return;
    }
    if (actualRooms.length === 0) {
      setError("At least one room must be selected");
      return;
    }

    // Auto-add custom staff if they entered a name but didn't click "Add"
    if (showCustomStaff && customStaff.trim()) {
      setFormData((prev) => ({ ...prev, staff: customStaff.trim() }));
      setShowCustomStaff(false);
    }

    // Auto-add custom room if they entered a name but didn't click "Add"
    if (
      showCustomRoom &&
      customRoom.trim() &&
      !formData.rooms.includes(customRoom.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        rooms: [...prev.rooms, customRoom.trim()],
      }));
      setShowCustomRoom(false);
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "shifts"), {
        date: formData.date,
        shift: formData.shift,
        staff: actualStaff,
        rooms: actualRooms,
        notes: formData.notes,
        createdAt: Timestamp.now(),
      });

      setSuccess(true);
      setFormData({
        date: "",
        shift: "",
        staff: "",
        rooms: [],
        notes: "",
      });
      setCustomStaff("");
      setShowCustomStaff(false);
      setCustomRoom("");
      setShowCustomRoom(false);

      // Refresh the shifts store to update admin dashboard
      fetchShifts();
    } catch (err) {
      setError("Failed to save shift. Please try again.");
      console.error("Error adding document: ", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 dark:bg-gray-800">
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
        Shift Assignment
      </h1>

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-100 rounded-lg text-sm">
          ✓ Shift has been successfully saved!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selector */}
        <div>
          <Input
            id="date"
            type="date"
            label="Date"
            value={formData.date}
            onChange={(value) => handleInputChange("date", value)}
            required
          />
        </div>

        {/* Shift Type */}
        <div>
          <Select
            id="shift-type"
            label="Shift Type"
            value={formData.shift}
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
          <Select
            id="staff-member"
            label="Staff Member"
            value={showCustomStaff ? "custom" : formData.staff}
            onChange={handleStaffSelection}
            options={[
              ...STAFF_LIST.map((staff) => ({ value: staff, label: staff })),
              { value: "custom", label: "+ Add Custom Staff Member" },
            ]}
            placeholder="Select staff member"
            required
          />

          {showCustomStaff && (
            <div className="mt-3 flex gap-2">
              <div className="flex-1">
                <Input
                  id="custom-staff"
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
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCustomStaff(false);
                  setCustomStaff("");
                }}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
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
          <DropdownCheckBox
            id="rooms"
            label="Rooms"
            options={roomList.map((room) => ({ value: room, label: room }))}
            selectedValues={formData.rooms}
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
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Room
            </Button>
          </div>

          {showCustomRoom && (
            <div className="mt-3 flex gap-2">
              <div className="flex-1">
                <Input
                  id="custom-room"
                  label=""
                  value={customRoom}
                  onChange={setCustomRoom}
                  placeholder="Enter room name"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomRoom()}
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleAddCustomRoom}>
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCustomRoom(false);
                  setCustomRoom("");
                }}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          )}

          {formData.rooms.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Selected: {formData.rooms.join(", ")}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <TextArea
            id="notes"
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(value) => handleInputChange("notes", value)}
            rows={3}
            placeholder="Any additional remarks or special instructions..."
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-fit"
        >
          {loading ? (
            <div className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          ) : (
            <div className="inline-flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Shift Assignment
            </div>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ShiftFormPage;
