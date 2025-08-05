import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Staff } from "../store/staffStore";
import type { Room } from "../store/roomStore";
import type { Shift } from "../store/shiftsStore";

export interface AutoAssignmentConfig {
  date: string;
  shiftType: string;
  maxAssignmentsPerStaff?: number;
}

export interface ShiftAssignment {
  staffId: string;
  staffName: string;
  roomIds: string[];
  rooms: string[];
}

export interface AutoAssignmentResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  assignments: ShiftAssignment[];
  errors: string[];
}

// Room statuses that require assignment
const ASSIGNABLE_ROOM_STATUSES = [
  "maintenance",
  "available",
  "cleaning",
  "", // empty status also counts as assignable
];

export class AutoAssignmentService {
  /**
   * Fetches all available staff members
   */
  static async getAvailableStaff(): Promise<Staff[]> {
    try {
      const staffCollection = collection(db, "staff");
      const snapshot = await getDocs(staffCollection);
      const allStaff = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Staff[];

      // Filter staff that are available and have 'staff' system role (not admin/manager)
      return allStaff.filter(
        (staff) =>
          staff.availability === "Available" && staff.systemRole === "staff"
      );
    } catch (error) {
      console.error("Error fetching available staff:", error);
      throw new Error("Failed to fetch available staff");
    }
  }

  /**
   * Fetches existing shifts for a specific date and shift type
   */
  static async getExistingShifts(
    date: string,
    shiftType: string
  ): Promise<Shift[]> {
    try {
      const shiftsCollection = collection(db, "shifts");
      const q = query(
        shiftsCollection,
        where("date", "==", date),
        where("shift", "==", shiftType)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Shift[];
    } catch (error) {
      console.error("Error fetching existing shifts:", error);
      throw new Error("Failed to fetch existing shifts");
    }
  }

  /**
   * Fetches all rooms that need assignment
   */
  static async getAssignableRooms(): Promise<Room[]> {
    try {
      const roomsCollection = collection(db, "rooms");
      const snapshot = await getDocs(roomsCollection);
      const allRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Room[];

      // Filter rooms that need assignment based on status
      return allRooms.filter(
        (room) =>
          !room.status ||
          ASSIGNABLE_ROOM_STATUSES.includes(room.status.toLowerCase())
      );
    } catch (error) {
      console.error("Error fetching assignable rooms:", error);
      throw new Error("Failed to fetch assignable rooms");
    }
  }

  /**
   * Calculates current workload for each staff member based on existing shifts
   */
  static calculateStaffWorkload(
    availableStaff: Staff[],
    existingShifts: Shift[]
  ): Map<string, number> {
    const workloadMap = new Map<string, number>();

    // Initialize all staff with 0 assignments
    availableStaff.forEach((staff) => {
      workloadMap.set(staff.id, 0);
    });

    // Count existing assignments per staff member
    existingShifts.forEach((shift) => {
      if (shift.staffId && workloadMap.has(shift.staffId)) {
        const currentCount = workloadMap.get(shift.staffId) || 0;
        // Count the number of rooms in this shift
        const roomCount = shift.rooms ? shift.rooms.length : 1;
        workloadMap.set(shift.staffId, currentCount + roomCount);
      }
    });

    return workloadMap;
  }

  /**
   * Creates shift assignments using workload-aware algorithm
   */
  static createWorkloadAwareAssignments(
    availableStaff: Staff[],
    assignableRooms: Room[],
    existingShifts: Shift[],
    maxAssignmentsPerStaff?: number
  ): ShiftAssignment[] {
    if (availableStaff.length === 0) {
      throw new Error("No available staff members found");
    }

    if (assignableRooms.length === 0) {
      throw new Error("No rooms requiring assignment found");
    }

    const assignments: ShiftAssignment[] = [];
    const staffWorkload = this.calculateStaffWorkload(
      availableStaff,
      existingShifts
    );
    const maxAssignments =
      maxAssignmentsPerStaff ||
      Math.ceil(
        (assignableRooms.length +
          existingShifts.reduce(
            (sum, shift) => sum + (shift.rooms?.length || 1),
            0
          )) /
          availableStaff.length
      );

    // Find the minimum workload level
    const workloadLevels = Array.from(staffWorkload.values()).sort(
      (a, b) => a - b
    );
    let currentWorkloadLevel = 0;
    let staffRotationIndex = new Map<number, number>(); // Track rotation index for each workload level

    for (const room of assignableRooms) {
      let assigned = false;
      let attempts = 0;

      // Try to assign room starting from lowest workload level
      while (!assigned && attempts < workloadLevels.length + 1) {
        // Get staff members at current workload level who have capacity
        const candidateStaff = availableStaff.filter((staff) => {
          const currentLoad = staffWorkload.get(staff.id) || 0;
          return (
            currentLoad === currentWorkloadLevel && currentLoad < maxAssignments
          );
        });

        if (candidateStaff.length > 0) {
          // Use round-robin within this workload level
          const rotationIndex =
            staffRotationIndex.get(currentWorkloadLevel) || 0;
          const selectedStaff =
            candidateStaff[rotationIndex % candidateStaff.length];

          // Update rotation index for this workload level
          staffRotationIndex.set(currentWorkloadLevel, rotationIndex + 1);

          // Find existing assignment for this staff or create new one
          let existingAssignment = assignments.find(
            (a) => a.staffId === selectedStaff.id
          );

          if (!existingAssignment) {
            existingAssignment = {
              staffId: selectedStaff.id,
              staffName: selectedStaff.name,
              roomIds: [],
              rooms: [],
            };
            assignments.push(existingAssignment);
          }

          // Add room to assignment
          existingAssignment.roomIds.push(room.id);
          existingAssignment.rooms.push(room.number);

          // Update workload count
          const newWorkload = (staffWorkload.get(selectedStaff.id) || 0) + 1;
          staffWorkload.set(selectedStaff.id, newWorkload);

          assigned = true;
        } else {
          // No staff available at current workload level, try next level
          currentWorkloadLevel++;
          attempts++;
        }
      }

      if (!assigned) {
        throw new Error(
          `Unable to assign room ${room.number} - all staff at maximum capacity (${maxAssignments})`
        );
      }

      // Reset to minimum workload level for next room
      const minWorkload = Math.min(...Array.from(staffWorkload.values()));
      currentWorkloadLevel = minWorkload;
    }

    return assignments;
  }

  /**
   * Creates shift assignments using round-robin algorithm (legacy method)
   */
  static createAssignments(
    availableStaff: Staff[],
    assignableRooms: Room[],
    maxAssignmentsPerStaff?: number
  ): ShiftAssignment[] {
    if (availableStaff.length === 0) {
      throw new Error("No available staff members found");
    }

    if (assignableRooms.length === 0) {
      throw new Error("No rooms requiring assignment found");
    }

    const assignments: ShiftAssignment[] = [];
    const staffAssignmentCount = new Map<string, number>();

    // Initialize assignment counts
    availableStaff.forEach((staff) => {
      staffAssignmentCount.set(staff.id, 0);
    });

    let staffIndex = 0;
    const maxAssignments =
      maxAssignmentsPerStaff ||
      Math.ceil(assignableRooms.length / availableStaff.length);

    // Round-robin assignment
    for (const room of assignableRooms) {
      // Find next available staff member
      let assigned = false;
      let attempts = 0;

      while (!assigned && attempts < availableStaff.length) {
        const currentStaff = availableStaff[staffIndex];
        const currentCount = staffAssignmentCount.get(currentStaff.id) || 0;

        if (currentCount < maxAssignments) {
          // Find existing assignment for this staff or create new one
          let existingAssignment = assignments.find(
            (a) => a.staffId === currentStaff.id
          );

          if (!existingAssignment) {
            existingAssignment = {
              staffId: currentStaff.id,
              staffName: currentStaff.name,
              roomIds: [],
              rooms: [],
            };
            assignments.push(existingAssignment);
          }

          // Add room to assignment
          existingAssignment.roomIds.push(room.id);
          existingAssignment.rooms.push(room.number);

          // Update count
          staffAssignmentCount.set(currentStaff.id, currentCount + 1);
          assigned = true;
        }

        staffIndex = (staffIndex + 1) % availableStaff.length;
        attempts++;
      }

      if (!assigned) {
        throw new Error(
          `Unable to assign room ${room.number} - all staff at maximum capacity`
        );
      }
    }

    return assignments;
  }

  /**
   * Saves assignments to database
   */
  static async saveAssignments(
    assignments: ShiftAssignment[],
    config: AutoAssignmentConfig
  ): Promise<AutoAssignmentResult> {
    const result: AutoAssignmentResult = {
      success: true,
      successCount: 0,
      failureCount: 0,
      assignments: [],
      errors: [],
    };

    const shiftsCollection = collection(db, "shifts");
    const now = Timestamp.now();

    for (const assignment of assignments) {
      try {
        const shiftData = {
          date: config.date,
          shift: config.shiftType,
          staffId: assignment.staffId,
          staffName: assignment.staffName,
          roomIds: assignment.roomIds,
          rooms: assignment.rooms,
          notes: `Auto-assigned ${assignment.rooms.length} room(s)`,
          createdAt: now,
        };

        await addDoc(shiftsCollection, shiftData);
        result.successCount++;
        result.assignments.push(assignment);
      } catch (error) {
        console.error(
          `Error saving assignment for ${assignment.staffName}:`,
          error
        );
        result.failureCount++;
        result.errors.push(
          `Failed to assign ${assignment.staffName}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    result.success = result.failureCount === 0;
    return result;
  }

  /**
   * Main auto assignment function
   */
  static async autoAssignShifts(
    config: AutoAssignmentConfig
  ): Promise<AutoAssignmentResult> {
    try {
      // Step 1: Fetch available staff, assignable rooms, and existing shifts
      const [availableStaff, assignableRooms, existingShifts] =
        await Promise.all([
          this.getAvailableStaff(),
          this.getAssignableRooms(),
          this.getExistingShifts(config.date, config.shiftType),
        ]);

      // Step 2: Create workload-aware assignments
      const assignments = this.createWorkloadAwareAssignments(
        availableStaff,
        assignableRooms,
        existingShifts,
        config.maxAssignmentsPerStaff
      );

      // Step 3: Save assignments to database
      const result = await this.saveAssignments(assignments, config);

      return result;
    } catch (error) {
      console.error("Auto assignment failed:", error);
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        assignments: [],
        errors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
      };
    }
  }
}
