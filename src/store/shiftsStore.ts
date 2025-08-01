import { create } from "zustand";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { AutoAssignmentService, type AutoAssignmentConfig, type AutoAssignmentResult } from "../services/autoAssignmentService";

export interface Shift {
  id: string;
  date: string;
  shift: string;
  staffId: string;
  staffName: string; // Keep this for backward compatibility and display
  roomIds: string[]; // Array of room IDs
  rooms: string[]; // Array of room numbers for display (backward compatibility)
  notes: string;
  createdAt: Timestamp;
}

interface ShiftsState {
  shifts: Shift[];
  loading: boolean;
  error: string | null;
  isAutoAssigning: boolean;
  lastAutoAssignmentResult: AutoAssignmentResult | null;
  fetchShifts: () => Promise<void>;
  updateShift: (id: string, updatedShift: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  autoAssignShifts: (config: AutoAssignmentConfig) => Promise<AutoAssignmentResult>;
  checkStaffHasShifts: (staffId: string) => boolean;
  getShiftsByStaffId: (staffId: string) => Shift[];
  checkRoomHasShifts: (roomId: string) => boolean;
  getShiftsByRoomId: (roomId: string) => Shift[];
  removeRoomFromShifts: (roomId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useShiftsStore = create<ShiftsState>((set, get) => ({
  shifts: [],
  loading: false,
  error: null,
  isAutoAssigning: false,
  lastAutoAssignmentResult: null,

  fetchShifts: async () => {
    try {
      set({ loading: true, error: null });

      const shiftsRef = collection(db, "shifts");
      const q = query(shiftsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const shiftsData: Shift[] = [];
      querySnapshot.forEach((doc) => {
        shiftsData.push({
          id: doc.id,
          ...doc.data(),
        } as Shift);
      });

      set({ shifts: shiftsData, loading: false });
    } catch (err) {
      console.error("Error fetching shifts:", err);
      set({
        error: "Failed to load shifts. Please try again.",
        loading: false,
      });
    }
  },

  updateShift: async (id: string, updatedShift: Partial<Shift>) => {
    try {
      const shiftRef = doc(db, "shifts", id);
      const updateData: any = {};
      
      if (updatedShift.date) updateData.date = updatedShift.date;
      if (updatedShift.shift) updateData.shift = updatedShift.shift;
      if (updatedShift.staffId) updateData.staffId = updatedShift.staffId;
      if (updatedShift.staffName) updateData.staffName = updatedShift.staffName;
      if (updatedShift.rooms) updateData.rooms = updatedShift.rooms;
      if (updatedShift.roomIds) updateData.roomIds = updatedShift.roomIds;
      if (updatedShift.notes !== undefined) updateData.notes = updatedShift.notes || "";
      
      await updateDoc(shiftRef, updateData);

      // Update local state
      const { shifts } = get();
      const updatedShifts = shifts.map((shift) =>
        shift.id === id ? ({ ...shift, ...updatedShift } as Shift) : shift
      );
      set({ shifts: updatedShifts });
    } catch (err) {
      console.error("Error updating shift:", err);
      set({ error: "Failed to update shift. Please try again." });
      throw err;
    }
  },

  deleteShift: async (id: string) => {
    try {
      await deleteDoc(doc(db, "shifts", id));

      // Update local state
      const { shifts } = get();
      const updatedShifts = shifts.filter((shift) => shift.id !== id);
      set({ shifts: updatedShifts });
    } catch (err) {
      console.error("Error deleting shift:", err);
      set({ error: "Failed to delete shift. Please try again." });
      throw err;
    }
  },

  autoAssignShifts: async (config: AutoAssignmentConfig) => {
    try {
      set({ isAutoAssigning: true, error: null, lastAutoAssignmentResult: null });

      // Perform auto assignment
      const result = await AutoAssignmentService.autoAssignShifts(config);
      
      // Store the result
      set({ lastAutoAssignmentResult: result });

      // If successful, refresh the shifts list to show new assignments
      if (result.success && result.successCount > 0) {
        await get().fetchShifts();
      }

      // Set error if there were any failures
      if (!result.success || result.errors.length > 0) {
        const errorMessage = result.errors.length > 0 
          ? result.errors.join('; ') 
          : 'Auto assignment failed';
        set({ error: errorMessage });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Auto assignment failed';
      set({ error: errorMessage });
      
      const failureResult: AutoAssignmentResult = {
        success: false,
        successCount: 0,
        failureCount: 0,
        assignments: [],
        errors: [errorMessage],
      };
      
      set({ lastAutoAssignmentResult: failureResult });
      return failureResult;
    } finally {
      set({ isAutoAssigning: false });
    }
  },

  checkStaffHasShifts: (staffId: string) => {
    const { shifts } = get();
    return shifts.some(shift => shift.staffId === staffId);
  },

  getShiftsByStaffId: (staffId: string) => {
    const { shifts } = get();
    return shifts.filter(shift => shift.staffId === staffId);
  },

  checkRoomHasShifts: (roomId: string) => {
    const { shifts } = get();
    return shifts.some(shift => shift.roomIds?.includes(roomId));
  },

  getShiftsByRoomId: (roomId: string) => {
    const { shifts } = get();
    return shifts.filter(shift => shift.roomIds?.includes(roomId));
  },

  removeRoomFromShifts: async (roomId: string) => {
    try {
      const { shifts } = get();
      const affectedShifts = shifts.filter(shift => shift.roomIds?.includes(roomId));
      
      // Update each affected shift in Firestore
      const updatePromises = affectedShifts.map(async (shift) => {
        const updatedRoomIds = shift.roomIds?.filter(id => id !== roomId) || [];
        const updatedRooms = shift.rooms?.filter((_, index) => shift.roomIds?.[index] !== roomId) || [];
        
        const shiftRef = doc(db, "shifts", shift.id);
        await updateDoc(shiftRef, {
          roomIds: updatedRoomIds,
          rooms: updatedRooms
        });
        
        return {
          ...shift,
          roomIds: updatedRoomIds,
          rooms: updatedRooms
        };
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      const updatedShifts = shifts.map(shift => {
        if (shift.roomIds?.includes(roomId)) {
          const updatedRoomIds = shift.roomIds?.filter(id => id !== roomId) || [];
          const updatedRooms = shift.rooms?.filter((_, index) => shift.roomIds?.[index] !== roomId) || [];
          return {
            ...shift,
            roomIds: updatedRoomIds,
            rooms: updatedRooms
          };
        }
        return shift;
      });
      
      set({ shifts: updatedShifts });
    } catch (err) {
      console.error("Error removing room from shifts:", err);
      set({ error: "Failed to remove room from shifts. Please try again." });
      throw err;
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
