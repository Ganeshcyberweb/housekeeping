import { useState, useEffect } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/useAuth";
import Select from "../components/Select";
import TextArea from "../components/TextArea";
import Input from "../components/Input";
import Button from "../components/ui/Button";
import DropdownCheckBox from "../components/DropdownCheckbox";
import { useShiftsStore } from "../store/shiftsStore";
import { useStaffStore } from "../store/staffStore";
import { useRoomStore } from "../store/roomStore";
import { type ShiftFormData, SHIFT_TYPES } from "../constants/shiftConstants";
import {
  Save,
  Plus,
  X,
  Calendar,
  Users,
  Home as HomeIcon,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const ShiftFormPage = () => {
  const { user } = useAuth();
  const { fetchShifts } = useShiftsStore();
  const { staff, fetchStaff, addStaff } = useStaffStore();
  const { rooms, fetchRooms, addRoom } = useRoomStore();
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
  const [, setError] = useState<string | null>(null);
  const [, setSuccess] = useState(false);
  const [customStaff, setCustomStaff] = useState("");
  const [showCustomStaff, setShowCustomStaff] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [showCustomRoom, setShowCustomRoom] = useState(false);

  // Fetch staff and rooms data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          if (staff.length === 0) {
            await fetchStaff();
          }
          if (rooms.length === 0) {
            await fetchRooms();
          }
        } catch (error) {
          console.error("Error fetching data in ShiftFormPage:", error);
        }
      }
    };

    fetchData();
  }, [user, staff.length, fetchStaff, rooms.length, fetchRooms]);

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
      const selectedStaff = staff.find((s) => s.id === staffValue && s.systemRole === "staff");
      if (selectedStaff) {
        setFormData((prev) => ({
          ...prev,
          staffId: selectedStaff.id,
          staffName: selectedStaff.name,
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
          systemRole: "staff",
        });

        // Refresh staff list to get the new staff member with ID
        await fetchStaff();

        // Find the newly added staff member (should have 'staff' role)
        const newStaffMember = staff.find((s) => s.name === customStaff.trim() && s.systemRole === "staff");
        if (newStaffMember) {
          setFormData((prev) => ({
            ...prev,
            staffId: newStaffMember.id,
            staffName: newStaffMember.name,
          }));
        }

        setShowCustomStaff(false);
        setCustomStaff("");
      } catch (err) {
        setError("Failed to add new staff member");
      }
    }
  };

  const handleCustomRoomSubmit = async () => {
    if (customRoom.trim()) {
      try {
        // Add the new room to the database
        await addRoom({
          number: customRoom.trim(),
          status: "Available",
        });

        // Refresh rooms list to get the new room with ID
        await fetchRooms();

        // Find the newly added room and add it to selection
        const newRoom = rooms.find((r) => r.number === customRoom.trim());
        if (newRoom) {
          // Add to current selection
          setFormData((prev) => ({
            ...prev,
            roomIds: [...prev.roomIds, newRoom.id],
            rooms: [...prev.rooms, newRoom.number],
          }));
        }

        setShowCustomRoom(false);
        setCustomRoom("");
      } catch (err) {
        setError("Failed to add new room");
      }
    }
  };

  const handleRoomSelection = (selectedRoomIds: string[]) => {
    const selectedRooms = selectedRoomIds
      .map((roomId) => {
        const room = rooms.find((r) => r.id === roomId && r.status !== "Occupied");
        return room ? room.number : "";
      })
      .filter(Boolean);

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

    // Handle custom room if not yet added
    if (showCustomRoom && customRoom.trim()) {
      await handleCustomRoomSubmit();
      return; // The form will be resubmitted after room is added
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
    <div className="">
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  Shift Details
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Set the date and time for this shift
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
              </div>
            </div>

            {/* Staff Assignment Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Staff Assignment
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose who will work this shift
                </p>
              </div>

              <div>
                <Select
                  id="staff-member"
                  label="Staff Member"
                  value={showCustomStaff ? "custom" : formData.staffId}
                  onChange={handleStaffSelection}
                  options={[
                    ...staff
                      .filter((staffMember) => staffMember.systemRole === "staff")
                      .map((staffMember) => ({
                        value: staffMember.id,
                        label: `${staffMember.name}${
                          staffMember.jobRole ? ` (${staffMember.jobRole})` : ""
                        }`,
                      })),
                    { value: "custom", label: "+ Add New Staff Member" },
                  ]}
                  placeholder="Select staff member"
                  required
                />

                {showCustomStaff && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
                      Add New Staff Member
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleCustomStaffSubmit}
                          icon={<Plus className="w-3 h-3" />}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
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
                  </div>
                )}

                {formData.staffName && !showCustomStaff && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <p className="text-xs sm:text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      Selected:{" "}
                      <span className="font-medium">{formData.staffName}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Room Assignment Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  Room Assignment
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Select which rooms need to be cleaned during this shift
                </p>
              </div>

              <div>
                <DropdownCheckBox
                  id="rooms"
                  label="Rooms"
                  options={rooms
                    .filter((room) => room.status !== "Occupied")
                    .map((room) => ({
                      value: room.id,
                      label: `${room.number}${
                        room.type ? ` (${room.type})` : ""
                      }${room.status ? ` - ${room.status}` : ""}`,
                    }))}
                  selectedValues={formData.roomIds}
                  onChange={handleRoomSelection}
                  placeholder="Select rooms to clean"
                />

                <div className="mt-3">
                  <Button
                    type="button"
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
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
                      Add New Room
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <Input
                          id="custom-room"
                          label=""
                          value={customRoom}
                          onChange={setCustomRoom}
                          placeholder="Enter room number (e.g., Room 106)"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleCustomRoomSubmit()
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleCustomRoomSubmit}
                          icon={<Plus className="w-3 h-3" />}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
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
                  </div>
                )}

                {formData.rooms.length > 0 && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <HomeIcon className="w-4 h-4" />
                      Selected rooms:{" "}
                      <span className="font-medium">
                        {formData.rooms.join(", ")}
                      </span>
                    </p>
                  </div>
                )}

                {rooms.filter((room) => room.status !== "Occupied").length === 0 && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {rooms.length === 0 
                        ? "No rooms available. Add rooms in Room Management first."
                        : "No available rooms for assignment. All rooms are currently occupied."
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  Additional Information
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add any special instructions or notes for this shift
                </p>
              </div>

              <div>
                <TextArea
                  id="notes"
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={(value) => handleInputChange("notes", value)}
                  rows={4}
                  placeholder="Any additional remarks, special instructions, or important details for this shift..."
                />
              </div>
            </div>

            {/* Submit Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Review all details before creating the shift
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  loading={loading}
                  icon={
                    loading ? undefined : (
                      <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                    )
                  }
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">
                    {loading ? "Creating Shift..." : "Create Shift Assignment"}
                  </span>
                  <span className="sm:hidden">
                    {loading ? "Creating..." : "Create Shift"}
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShiftFormPage;
