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
  uid?: string; // Firebase Auth UID for linking to authentication
  name: string;
  email?: string;
  systemRole: "admin" | "manager" | "staff"; // For permissions and access control
  jobRole?: string; // For operational duties (cleaner, supervisor, etc.)
  availability?: "Available" | "On Break" | "Busy" | "Off Duty"; // Current availability status
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface StaffStore {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  addStaff: (
    staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateStaff: (
    id: string,
    updates: Partial<Omit<Staff, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  updateAvailability: (
    uid: string,
    availability: Staff["availability"]
  ) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  getStaffByUid: (uid: string) => Staff | null;
  clearError: () => void;
}

export const useStaffStore = create<StaffStore>((set) => ({
  staff: [],
  loading: false,
  error: null,

  fetchStaff: async () => {
    set({ loading: true, error: null });
    try {
      console.log("Fetching staff data...");
      const staffCollection = collection(db, "staff");
      const snapshot = await getDocs(staffCollection);
      const staffList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Staff[];

      console.log("Fetched", staffList.length, "staff members");

      set({ staff: staffList, loading: false });
      console.log("Staff data loaded successfully");
    } catch (error) {
      set({ error: "Failed to fetch staff members", loading: false });
      console.error("Error fetching staff:", error);
      // Don't throw the error, just log it and set error state
    }
  },

  addStaff: async (staffData) => {
    set({ error: null });
    try {
      console.log("Adding staff member:", staffData);
      const now = Timestamp.now();
      const staffCollection = collection(db, "staff");

      // Filter out undefined values to avoid Firestore errors
      const cleanStaffData = Object.fromEntries(
        Object.entries(staffData).filter(([_, value]) => value !== undefined)
      );

      console.log("Clean staff data:", cleanStaffData);

      const docRef = await addDoc(staffCollection, {
        ...cleanStaffData,
        createdAt: now,
        updatedAt: now,
      });

      console.log("Staff document created with ID:", docRef.id);

      const newStaff: Staff = {
        id: docRef.id,
        ...staffData,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({
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
      const now = Timestamp.now();
      const staffDoc = doc(db, "staff", id);

      // Build update data, handling field deletion properly
      const updateData: any = {
        updatedAt: now,
      };

      // Handle each field appropriately
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
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
      const localUpdates: any = { updatedAt: now };
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          // Remove the field from local state
          localUpdates[key] = undefined;
        } else if (value !== undefined) {
          localUpdates[key] = value;
        }
      });

      set((state) => ({
        staff: state.staff.map((staff) =>
          staff.id === id ? { ...staff, ...localUpdates } : staff
        ),
      }));
    } catch (error) {
      set({ error: "Failed to update staff member" });
      console.error("Error updating staff:", error);
      throw error;
    }
  },

  updateAvailability: async (uid, availability) => {
    set({ error: null });
    try {
      console.log("Updating availability for UID:", uid, "to:", availability);

      // First, try to find the staff member in local state
      let staffMember = useStaffStore
        .getState()
        .staff.find((s: Staff) => s.uid === uid);

      // If not found in local state, fetch staff data first
      if (!staffMember) {
        console.log(
          "Staff member not found in local state, fetching staff data..."
        );
        await useStaffStore.getState().fetchStaff();
        staffMember = useStaffStore
          .getState()
          .staff.find((s: Staff) => s.uid === uid);
      }

      // If still not found, try to find by querying Firestore directly
      if (!staffMember) {
        console.log(
          "Staff member still not found, querying Firestore directly..."
        );
        const staffCollection = collection(db, "staff");
        const staffSnapshot = await getDocs(staffCollection);
        const staffList = staffSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Staff[];

        staffMember = staffList.find((s: Staff) => s.uid === uid);

        if (!staffMember) {
          throw new Error(`Staff member with UID ${uid} not found in database`);
        }

        console.log("Found staff member in direct query:", staffMember);
      }

      const now = Timestamp.now();
      const staffDoc = doc(db, "staff", staffMember.id);

      console.log("Updating Firestore document:", staffMember.id);

      // Update availability in Firestore
      await updateDoc(staffDoc, {
        availability: availability,
        updatedAt: now,
      });

      // Update local state
      set((state) => ({
        staff: state.staff.map((staff) =>
          staff.uid === uid ? { ...staff, availability, updatedAt: now } : staff
        ),
      }));

      console.log("Availability updated successfully:", availability);
    } catch (error) {
      set({ error: "Failed to update availability" });
      console.error("Error updating availability:", error);
      throw error;
    }
  },

  deleteStaff: async (id) => {
    set({ error: null });
    try {
      const staffDoc = doc(db, "staff", id);
      await deleteDoc(staffDoc);

      set((state) => ({
        staff: state.staff.filter((staff) => staff.id !== id),
      }));
    } catch (error) {
      set({ error: "Failed to delete staff member" });
      console.error("Error deleting staff:", error);
      throw error;
    }
  },

  getStaffByUid: (uid: string): Staff | null => {
    const state = useStaffStore.getState();
    return state.staff.find((staff: Staff) => staff.uid === uid) || null;
  },

  clearError: () => set({ error: null }),
}));
