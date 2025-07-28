import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Room {
  id: string;
  number: string;
  type?: string;
  status?: string;
  createdAt: Timestamp;
}

interface RoomStore {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  addRoom: (roomData: Omit<Room, "id" | "createdAt">) => Promise<void>;
  updateRoom: (id: string, roomData: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addBulkRooms: (rooms: Omit<Room, "id" | "createdAt">[]) => Promise<void>;
  clearError: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  loading: false,
  error: null,

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, "rooms"));
      const rooms: Room[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];
      
      // Sort by room number
      rooms.sort((a, b) => a.number.localeCompare(b.number));
      
      set({ rooms, loading: false });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      set({ error: "Failed to fetch rooms", loading: false });
    }
  },

  addRoom: async (roomData) => {
    set({ loading: true, error: null });
    try {
      // Filter out undefined values
      const cleanRoomData = Object.fromEntries(
        Object.entries(roomData).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(collection(db, "rooms"), {
        ...cleanRoomData,
        createdAt: Timestamp.now(),
      });

      const newRoom: Room = {
        id: docRef.id,
        ...cleanRoomData,
        createdAt: Timestamp.now(),
      } as Room;

      set((state) => ({
        rooms: [...state.rooms, newRoom].sort((a, b) => a.number.localeCompare(b.number)),
        loading: false,
      }));
    } catch (error) {
      console.error("Error adding room:", error);
      set({ error: "Failed to add room", loading: false });
    }
  },

  updateRoom: async (id, roomData) => {
    set({ loading: true, error: null });
    try {
      const roomRef = doc(db, "rooms", id);
      
      // Handle empty strings as field deletions
      const updateData: any = {};
      Object.entries(roomData).forEach(([key, value]) => {
        if (value === "" && key !== "number") {
          updateData[key] = deleteField();
        } else if (value !== undefined) {
          updateData[key] = value;
        }
      });

      await updateDoc(roomRef, updateData);

      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.id === id
            ? {
                ...room,
                ...Object.fromEntries(
                  Object.entries(roomData).filter(([_, value]) => value !== undefined)
                ),
              }
            : room
        ).sort((a, b) => a.number.localeCompare(b.number)),
        loading: false,
      }));
    } catch (error) {
      console.error("Error updating room:", error);
      set({ error: "Failed to update room", loading: false });
    }
  },

  deleteRoom: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, "rooms", id));
      set((state) => ({
        rooms: state.rooms.filter((room) => room.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error("Error deleting room:", error);
      set({ error: "Failed to delete room", loading: false });
    }
  },

  addBulkRooms: async (roomsData) => {
    set({ loading: true, error: null });
    try {
      const promises = roomsData.map(async (roomData) => {
        // Filter out undefined values
        const cleanRoomData = Object.fromEntries(
          Object.entries(roomData).filter(([_, value]) => value !== undefined)
        );

        const docRef = await addDoc(collection(db, "rooms"), {
          ...cleanRoomData,
          createdAt: Timestamp.now(),
        });

        return {
          id: docRef.id,
          ...cleanRoomData,
          createdAt: Timestamp.now(),
        } as Room;
      });

      const newRooms = await Promise.all(promises);

      set((state) => ({
        rooms: [...state.rooms, ...newRooms].sort((a, b) => a.number.localeCompare(b.number)),
        loading: false,
      }));
    } catch (error) {
      console.error("Error adding bulk rooms:", error);
      set({ error: "Failed to add rooms", loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));