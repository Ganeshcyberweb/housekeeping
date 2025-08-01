export type ShiftFormData = {
  date: string;
  shift: string;
  staffId: string;
  staffName: string;
  roomIds: string[];
  rooms: string[];
  notes: string;
};

export const SHIFT_TYPES = ["Morning", "Afternoon", "Evening"];

export const SHIFT_TIME_LABELS: Record<string, string> = {
  "Morning": "Morning",
  "Afternoon": "Afternoon", 
  "Evening": "Evening"
};

export const STAFF_LIST = [
  "John Doe",
  "Jane Smith",
  "Mike Johnson",
  "Sarah Williams",
  "David Brown",
  "Lisa Davis",
];

export const ROOM_LIST = [
  "Room 101",
  "Room 102",
  "Room 103",
  "Room 104",
  "Room 105",
  "Room 201",
  "Room 202",
  "Room 203",
  "Room 204",
  "Room 205",
  "Room 301",
  "Room 302",
  "Room 303",
  "Room 304",
  "Room 305",
];
