import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
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
  approved: boolean; // Whether the user is approved by admin
  approvedBy?: string; // UID of admin who approved
  approvedAt?: Timestamp; // When the user was approved
  archived: boolean; // Whether the staff member has been archived (soft deleted)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface StaffStore {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  addStaff: (
    staffData: Partial<Omit<Staff, "id" | "createdAt" | "updatedAt">> & {
      name: string;
    }
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
  approveStaff: (id: string, approvedByUid: string) => Promise<void>;
  disapproveStaff: (id: string) => Promise<void>;
  getStaffByUid: (uid: string) => Staff | null;
  getPendingApprovalStaff: () => Staff[];
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
      const allStaffList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Staff[];

      // Filter out archived staff
      const staffList = allStaffList.filter((staff) => !staff.archived);

      set({ staff: staffList, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch staff members", loading: false });
      console.error("Error fetching staff:", error);
      // Don't throw the error, just log it and set error state
    }
  },

  addStaff: async (staffData) => {
    set({ error: null });
    try {
      const now = Timestamp.now();
      const staffCollection = collection(db, "staff");

      // Prepare staff data with proper defaults and required fields
      const preparedStaffData: any = {
        name: staffData.name,
        systemRole: staffData.systemRole || "staff",
        availability: staffData.availability || "Available",
        approved: staffData.approved !== undefined ? staffData.approved : false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };

      // Add optional fields only if they exist and are not empty
      if (staffData.uid) {
        preparedStaffData.uid = staffData.uid;
      }

      if (staffData.email && staffData.email.trim()) {
        preparedStaffData.email = staffData.email.trim();
      }

      if (staffData.jobRole && staffData.jobRole.trim()) {
        preparedStaffData.jobRole = staffData.jobRole.trim();
      }

      if (staffData.phone && staffData.phone.trim()) {
        preparedStaffData.phone = staffData.phone.trim();
      }

      const docRef = await addDoc(staffCollection, preparedStaffData);

      const newStaff: Staff = {
        id: docRef.id,
        ...preparedStaffData,
      };

      set((state) => ({
        staff: [...state.staff, newStaff],
      }));
    } catch (error: any) {
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        fullError: error,
      });

      set({ error: "Failed to add staff member" });
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
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        stack: (error as any)?.stack,
        fullError: error,
        staffId: id,
        updates,
      });

      set({ error: "Failed to update staff member" });
      throw error;
    }
  },

  updateAvailability: async (uid, availability) => {
    set({ error: null });
    try {
      // First, try to find the staff member in local state
      let staffMember = useStaffStore
        .getState()
        .staff.find((s: Staff) => s.uid === uid);

      // If not found in local state, fetch staff data first
      if (!staffMember) {
        await useStaffStore.getState().fetchStaff();
        staffMember = useStaffStore
          .getState()
          .staff.find((s: Staff) => s.uid === uid);
      }

      // If still not found, try to find by querying Firestore directly
      if (!staffMember) {
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
      }

      const now = Timestamp.now();
      const staffDoc = doc(db, "staff", staffMember.id);

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
      const now = Timestamp.now();

      await updateDoc(staffDoc, {
        archived: true,
        updatedAt: now,
      });

      set((state) => ({
        staff: state.staff.filter((staff) => staff.id !== id),
      }));
    } catch (error) {
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        stack: (error as any)?.stack,
        fullError: error,
        staffId: id,
      });

      set({ error: "Failed to delete staff member" });
      throw error;
    }
  },

  approveStaff: async (id, approvedByUid) => {
    set({ error: null });
    try {
      const staffDoc = doc(db, "staff", id);
      const now = Timestamp.now();

      await updateDoc(staffDoc, {
        approved: true,
        approvedBy: approvedByUid,
        approvedAt: now,
        updatedAt: now,
      });

      set((state) => ({
        staff: state.staff.map((staff) =>
          staff.id === id
            ? {
                ...staff,
                approved: true,
                approvedBy: approvedByUid,
                approvedAt: now,
                updatedAt: now,
              }
            : staff
        ),
      }));
    } catch (error) {
      set({ error: "Failed to approve staff member" });
      console.error("Error approving staff:", error);
      throw error;
    }
  },

  disapproveStaff: async (id) => {
    set({ error: null });
    try {
      const staffDoc = doc(db, "staff", id);
      const now = Timestamp.now();

      await updateDoc(staffDoc, {
        archived: true,
        updatedAt: now,
      });

      set((state) => ({
        staff: state.staff.filter((staff) => staff.id !== id),
      }));
    } catch (error) {
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        stack: (error as any)?.stack,
        fullError: error,
        staffId: id,
      });

      set({ error: "Failed to disapprove staff member" });
      throw error;
    }
  },

  getStaffByUid: (uid: string): Staff | null => {
    const state = useStaffStore.getState();
    return state.staff.find((staff: Staff) => staff.uid === uid) || null;
  },

  getPendingApprovalStaff: (): Staff[] => {
    const state = useStaffStore.getState();
    return state.staff.filter(
      (staff: Staff) => !staff.approved && !staff.archived
    );
  },

  clearError: () => set({ error: null }),
}));
