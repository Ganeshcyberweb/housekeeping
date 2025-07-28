import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Staff {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface StaffStore {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  addStaff: (staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useStaffStore = create<StaffStore>((set) => ({
  staff: [],
  loading: false,
  error: null,

  fetchStaff: async () => {
    set({ loading: true, error: null });
    try {
      const staffCollection = collection(db, "staff");
      const snapshot = await getDocs(staffCollection);
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Staff[];

      set({ staff: staffList, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch staff members", loading: false });
      console.error("Error fetching staff:", error);
    }
  },

  addStaff: async (staffData) => {
    set({ error: null });
    try {
      const now = Timestamp.now();
      const staffCollection = collection(db, "staff");
      
      // Filter out undefined values to avoid Firestore errors
      const cleanStaffData = Object.fromEntries(
        Object.entries(staffData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(staffCollection, {
        ...cleanStaffData,
        createdAt: now,
        updatedAt: now,
      });

      const newStaff: Staff = {
        id: docRef.id,
        ...staffData,
        createdAt: now,
        updatedAt: now,
      };

      set(state => ({
        staff: [...state.staff, newStaff],
      }));
    } catch (error) {
      set({ error: "Failed to add staff member" });
      console.error("Error adding staff:", error);
      throw error;
    }
  },

  updateStaff: async (id, updates) => {
    set({ error: null });
    try {
      const staffDoc = doc(db, "staff", id);
      
      // Build update data, handling field deletion properly
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };
      
      // Handle each field appropriately
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          // Delete the field if it's null or empty string
          updateData[key] = deleteField();
        } else if (value !== undefined) {
          // Update the field if it has a value
          updateData[key] = value;
        }
        // Skip if undefined (don't update the field)
      });
      
      await updateDoc(staffDoc, updateData);

      // For local state update, we need to handle deleted fields
      const localUpdates: any = { updatedAt: updateData.updatedAt };
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          // Remove the field from local state
          localUpdates[key] = undefined;
        } else if (value !== undefined) {
          localUpdates[key] = value;
        }
      });

      set(state => ({
        staff: state.staff.map(staff =>
          staff.id === id
            ? { ...staff, ...localUpdates }
            : staff
        ),
      }));
    } catch (error) {
      set({ error: "Failed to update staff member" });
      console.error("Error updating staff:", error);
      throw error;
    }
  },

  deleteStaff: async (id) => {
    set({ error: null });
    try {
      const staffDoc = doc(db, "staff", id);
      await deleteDoc(staffDoc);

      set(state => ({
        staff: state.staff.filter(staff => staff.id !== id),
      }));
    } catch (error) {
      set({ error: "Failed to delete staff member" });
      console.error("Error deleting staff:", error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));