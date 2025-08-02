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
import { getAuth } from "firebase/auth";
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
    staffData: Partial<Omit<Staff, "id" | "createdAt" | "updatedAt">> & { name: string }
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
      console.log("=== STAFF CREATION DEBUG ===");
      console.log("1. Input staff data:", JSON.stringify(staffData, null, 2));
      
      // Check authentication status
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log("2. Current user:", currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      } : "No user logged in");

      const now = Timestamp.now();
      const staffCollection = collection(db, "staff");
      console.log("3. Collection reference created:", staffCollection.path);

      // Prepare staff data with proper defaults and required fields
      const preparedStaffData: any = {
        name: staffData.name,
        systemRole: staffData.systemRole || 'staff',
        availability: staffData.availability || 'Available',
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

      console.log("4. Prepared staff data:", JSON.stringify(preparedStaffData, null, 2));
      console.log("5. Attempting to create document in Firestore...");

      const docRef = await addDoc(staffCollection, preparedStaffData);

      console.log("6. SUCCESS: Staff document created with ID:", docRef.id);

      const newStaff: Staff = {
        id: docRef.id,
        ...preparedStaffData,
      };

      set((state) => ({
        staff: [...state.staff, newStaff],
      }));
      
      console.log("7. SUCCESS: Staff added to local state");
      console.log("=== END STAFF CREATION DEBUG ===");
    } catch (error: any) {
      console.log("=== STAFF CREATION ERROR ===");
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        fullError: error
      });
      console.log("=== END STAFF CREATION ERROR ===");
      
      set({ error: "Failed to add staff member" });
      throw error;
    }
  },

  updateStaff: async (id, updates) => {
    set({ error: null });
    try {
      console.log("=== STAFF UPDATE DEBUG ===");
      console.log("1. Staff ID:", id);
      console.log("2. Updates:", JSON.stringify(updates, null, 2));
      
      // Check authentication status
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log("3. Current user:", currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      } : "No user logged in");

      const now = Timestamp.now();
      const staffDoc = doc(db, "staff", id);
      console.log("4. Document reference:", staffDoc.path);

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

      console.log("5. Final update data:", JSON.stringify(updateData, null, 2));
      console.log("6. Attempting to update document in Firestore...");

      await updateDoc(staffDoc, updateData);
      console.log("7. Document updated successfully!");

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
      console.log("=== STAFF UPDATE ERROR ===");
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        stack: (error as any)?.stack,
        fullError: error,
        staffId: id,
        updates
      });
      console.log("=== END STAFF UPDATE ERROR ===");
      
      set({ error: "Failed to update staff member" });
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
      console.log("=== STAFF DELETE DEBUG ===");
      console.log("1. Staff ID to delete:", id);
      
      // Check authentication status
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log("2. Current user:", currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      } : "No user logged in");

      const staffDoc = doc(db, "staff", id);
      console.log("3. Document reference:", staffDoc.path);
      console.log("4. Attempting to delete document from Firestore...");
      
      await deleteDoc(staffDoc);
      console.log("5. Document deleted successfully!");

      set((state) => ({
        staff: state.staff.filter((staff) => staff.id !== id),
      }));
    } catch (error) {
      console.log("=== STAFF DELETE ERROR ===");
      console.error("Error details:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        stack: (error as any)?.stack,
        fullError: error,
        staffId: id
      });
      console.log("=== END STAFF DELETE ERROR ===");
      
      set({ error: "Failed to delete staff member" });
      throw error;
    }
  },

  getStaffByUid: (uid: string): Staff | null => {
    const state = useStaffStore.getState();
    return state.staff.find((staff: Staff) => staff.uid === uid) || null;
  },

  clearError: () => set({ error: null }),
}));
