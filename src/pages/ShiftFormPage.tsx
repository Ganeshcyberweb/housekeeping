import { useState, useEffect } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import Input from "../components/Input";
import Button from "../components/Button";
import DropdownCheckBox from "../components/DropdownCheckbox";
import { useShiftsStore } from "../store/shiftsStore";
import { useStaffStore } from "../store/staffStore";
import { useRoomStore } from "../store/roomStore";
import {
  type ShiftFormData,
  SHIFT_TYPES,
  ROOM_LIST,
} from "../constants/shiftConstants";
import { Save, Plus, X, Loader2 } from "lucide-react";

const ShiftFormPage = () => {
  const { fetchShifts } = useShiftsStore();
  const { staff, fetchStaff, addStaff } = useStaffStore();
  const { rooms, fetchRooms } = useRoomStore();
  const [formData, setFormData] = useState<ShiftFormData>({
    date: "",
    shift: "",
    staffId: "",
    staffName: "",
    roomIds: [],
    rooms: [],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customStaff, setCustomStaff] = useState("");
  const [showCustomStaff, setShowCustomStaff] = useState(false);
  // We'll use rooms directly from database, no need for custom room functionality
  // since users can add rooms in the Room Management section

  // Fetch staff and rooms data on component mount
  useEffect(() => {
    if (staff.length === 0) {
      fetchStaff();
    }
    if (rooms.length === 0) {
      fetchRooms();
    }
  }, [staff.length, fetchStaff, rooms.length, fetchRooms]);

  const handleInputChange = (field: keyof ShiftFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleStaffSelection = (staffValue: string) => {
    if (staffValue === "custom") {
      setShowCustomStaff(true);
      setFormData((prev) => ({ ...prev, staffId: "", staffName: "" }));
    } else {
      setShowCustomStaff(false);
      setCustomStaff("");
      const selectedStaff = staff.find(s => s.id === staffValue);
      if (selectedStaff) {
        setFormData((prev) => ({ 
          ...prev, 
          staffId: selectedStaff.id, 
          staffName: selectedStaff.name 
        }));
      }
    }
    setError(null);
    setSuccess(false);
  };

  const handleCustomStaffSubmit = async () => {
    if (customStaff.trim()) {
      try {
        // Add the new staff member to the database
        await addStaff({
          name: customStaff.trim(),
        });
        
        // Refresh staff list to get the new staff member with ID
        await fetchStaff();
        
        // Find the newly added staff member
        const newStaffMember = staff.find(s => s.name === customStaff.trim());
        if (newStaffMember) {
          setFormData((prev) => ({ 
            ...prev, 
            staffId: newStaffMember.id, 
            staffName: newStaffMember.name 
          }));
        }
        
        setShowCustomStaff(false);
        setCustomStaff("");
      } catch (err) {
        setError("Failed to add new staff member");
      }
    }
  };

  const handleRoomSelection = (selectedRoomIds: string[]) => {
    const selectedRooms = selectedRoomIds.map(roomId => {
      const room = rooms.find(r => r.id === roomId);
      return room ? room.number : '';
    }).filter(Boolean);
    
    setFormData((prev) => ({
      ...prev,
      roomIds: selectedRoomIds,
      rooms: selectedRooms,
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Handle custom staff if not yet added
    if (showCustomStaff && customStaff.trim()) {
      await handleCustomStaffSubmit();
      return; // The form will be resubmitted after staff is added
    }

    // Validate with the form data
    if (!formData.date) {
      setError("Date is required");
      return;
    }
    if (!formData.shift) {
      setError("Shift type is required");
      return;
    }
    if (!formData.staffId || !formData.staffName) {
      setError("Staff selection is required");
      return;
    }
    if (formData.roomIds.length === 0) {
      setError("At least one room must be selected");
      return;
    }

    // No need for custom room handling

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "shifts"), {
        date: formData.date,
        shift: formData.shift,
        staffId: formData.staffId,
        staffName: formData.staffName,
        roomIds: formData.roomIds,
        rooms: formData.rooms,
        notes: formData.notes,
        createdAt: Timestamp.now(),
      });

      setSuccess(true);
      setFormData({
        date: "",
        shift: "",
        staffId: "",
        staffName: "",
        roomIds: [],
        rooms: [],
        notes: "",
      });
      setCustomStaff("");
      setShowCustomStaff(false);

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
            value={showCustomStaff ? "custom" : formData.staffId}
            onChange={handleStaffSelection}
            options={[
              ...staff.map((staffMember) => ({ 
                value: staffMember.id, 
                label: `${staffMember.name}${staffMember.role ? ` (${staffMember.role})` : ''}` 
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

          {formData.staffName && !showCustomStaff && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Selected: {formData.staffName}
            </p>
          )}
        </div>

        {/* Room Selection */}
        <div>
          <DropdownCheckBox
            id="rooms"
            label="Rooms"
            options={rooms.map((room) => ({ 
              value: room.id, 
              label: `${room.number}${room.type ? ` (${room.type})` : ''}${room.status ? ` - ${room.status}` : ''}` 
            }))}
            selectedValues={formData.roomIds}
            onChange={handleRoomSelection}
            placeholder="Select rooms"
          />

          {formData.rooms.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Selected: {formData.rooms.join(", ")}
            </p>
          )}
          
          {rooms.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              No rooms available. Add rooms in the Admin Dashboard → Room Management section.
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
