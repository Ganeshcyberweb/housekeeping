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

export interface Shift {
  id: string;
  date: string;
  shift: string;
  staff: string;
  rooms: string[];
  notes: string;
  createdAt: Timestamp;
}

interface ShiftsState {
  shifts: Shift[];
  loading: boolean;
  error: string | null;
  fetchShifts: () => Promise<void>;
  updateShift: (id: string, updatedShift: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useShiftsStore = create<ShiftsState>((set, get) => ({
  shifts: [],
  loading: false,
  error: null,

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
      await updateDoc(shiftRef, {
        date: updatedShift.date,
        shift: updatedShift.shift,
        staff: updatedShift.staff,
        rooms: updatedShift.rooms,
        notes: updatedShift.notes || "",
      });

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

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
