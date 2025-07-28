import { useState, useEffect, useRef } from "react";
import { Timestamp } from "firebase/firestore";
import Table from "./Table";
import { useRoomStore, type Room } from "../store/roomStore";
import { useShiftsStore } from "../store/shiftsStore";
import {
  RefreshCw,
  Home,
  Edit,
  Trash2,
  AlertCircle,
  Plus,
  Upload,
  Download,
  Search,
  X,
  FileText,
  Hash,
  Calendar,
} from "lucide-react";

const RoomManagement = () => {
  const {
    rooms,
    error: roomError,
    fetchRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    addBulkRooms,
    clearError: clearRoomError,
  } = useRoomStore();
  
  const {
    checkRoomHasShifts,
    getShiftsByRoomId,
    removeRoomFromShifts,
  } = useShiftsStore();

  // Room management states
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [assignedShiftsCount, setAssignedShiftsCount] = useState(0);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [newRoom, setNewRoom] = useState({ number: '', type: '', status: '' });
  const [csvData, setCsvData] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rooms.length === 0) {
      fetchRooms();
    }
  }, [fetchRooms, rooms.length]);

  // Filter rooms whenever search changes
  useEffect(() => {
    let filtered = [...rooms];

    if (searchFilter) {
      filtered = filtered.filter((room) =>
        room.number.toLowerCase().includes(searchFilter.toLowerCase()) ||
        room.type?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        room.status?.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
  }, [rooms, searchFilter]);

  // Room management functions
  const handleAddRoom = async () => {
    if (!newRoom.number.trim()) return;
    
    try {
      const roomData: any = {
        number: newRoom.number.trim(),
      };
      
      // Only add optional fields if they have values
      if (newRoom.type.trim()) {
        roomData.type = newRoom.type.trim();
      }
      
      if (newRoom.status.trim()) {
        roomData.status = newRoom.status.trim();
      }
      
      await addRoom(roomData);
      setNewRoom({ number: '', type: '', status: '' });
      setShowAddRoomModal(false);
    } catch (err) {
      // Error is handled in the store
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
  };

  const handleSaveRoomEdit = async (updates: Partial<Room>) => {
    if (!editingRoom) return;
    
    try {
      const cleanUpdates: any = {
        number: updates.number?.trim(),
        type: updates.type?.trim() || '',  // Pass empty string to delete field
        status: updates.status?.trim() || '', // Pass empty string to delete field
      };
      
      await updateRoom(editingRoom.id, cleanUpdates);
      setEditingRoom(null);
    } catch (err) {
      // Error is handled in the store
    }
  };

  const handleDeleteRoomClick = (room: Room) => {
    const hasShifts = checkRoomHasShifts(room.id);
    if (hasShifts) {
      const shifts = getShiftsByRoomId(room.id);
      setRoomToDelete(room);
      setAssignedShiftsCount(shifts.length);
      setShowDeleteWarning(true);
    } else {
      setDeletingRoom(room.id);
    }
  };

  const handleConfirmDeleteRoom = async () => {
    if (roomToDelete) {
      try {
        // First remove room from all shifts
        await removeRoomFromShifts(roomToDelete.id);
        
        // Then delete the room
        await deleteRoom(roomToDelete.id);
        
        setRoomToDelete(null);
        setShowDeleteWarning(false);
        setAssignedShiftsCount(0);
      } catch (err) {
        // Error is handled in the store
      }
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      setDeletingRoom(null);
    } catch (err) {
      // Error is handled in the store
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        setShowBulkUpload(true);
      };
      reader.readAsText(file);
    }
  };

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const room: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (value) {
          switch (header) {
            case 'number':
            case 'room number':
            case 'room':
              room.number = value;
              break;
            case 'type':
            case 'room type':
              room.type = value;
              break;
            case 'status':
              room.status = value;
              break;
          }
        }
      });
      
      return room;
    }).filter(room => room.number); // Only include rooms with numbers
  };

  const handleBulkUpload = async () => {
    if (!csvData.trim()) return;
    
    try {
      const parsedRooms = parseCsvData(csvData);
      if (parsedRooms.length === 0) {
        alert('No valid room data found in CSV');
        return;
      }
      
      await addBulkRooms(parsedRooms);
      setCsvData('');
      setShowBulkUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      // Error is handled in the store
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `Number,Type,Status
Room 101,Standard,Available
Room 102,Deluxe,Occupied
Room 201,Suite,Maintenance`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'room_sample.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const clearFilters = () => {
    setSearchFilter('');
  };

  const formatCreatedAt = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing: {filteredRooms.length} / {rooms.length} rooms
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-4 py-2"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowAddRoomModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white mb-1">
            <Search className="w-4 h-4" />
            Search Rooms
          </label>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by number, type, or status..."
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 w-full"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Room Error State */}
      {roomError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{roomError}</span>
          </div>
          <button
            onClick={() => {
              clearRoomError();
              fetchRooms();
            }}
            className="ml-4 underline hover:no-underline text-gray-900 dark:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Room Empty State */}
      {!roomError && rooms.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <Home className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No rooms found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Add your first room to get started.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Add Room
            </button>
            <button
              onClick={downloadSampleCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" />
              Sample CSV
            </button>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!roomError && rooms.length > 0 && filteredRooms.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No rooms match your search
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Try adjusting your search criteria.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      )}

      {/* Rooms Table */}
      {!roomError && filteredRooms.length > 0 && (
        <Table
          columns={[
            {
              key: "number",
              header: "Room Number",
              render: (value) => (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {value}
                  </span>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (value) => (
                value ? (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                    {value}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">—</span>
                )
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (value) => (
                value ? (
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${
                    value.toLowerCase() === 'available' 
                      ? 'border-green-300 dark:border-green-600 bg-green-100 dark:bg-green-700 text-green-900 dark:text-green-100'
                      : value.toLowerCase() === 'occupied'
                      ? 'border-red-300 dark:border-red-600 bg-red-100 dark:bg-red-700 text-red-900 dark:text-red-100'
                      : value.toLowerCase() === 'maintenance'
                      ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-100 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {value}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">—</span>
                )
              ),
            },
            {
              key: "createdAt",
              header: "Added",
              render: (value) => (
                <span className="text-gray-500 dark:text-gray-400">
                  {formatCreatedAt(value)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (_, row) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditRoom(row)}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={() => handleDeleteRoomClick(row)}
                    className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredRooms}
        />
      )}

      {/* Room Footer */}
      {!roomError && rooms.length > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              {filteredRooms.length} of {rooms.length} room{rooms.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadSampleCSV}
                className="inline-flex items-center gap-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-xs py-1 px-3"
              >
                <Download className="w-3 h-3" />
                Sample CSV
              </button>
              <button
                onClick={fetchRooms}
                className="inline-flex items-center gap-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-xs py-1 px-3"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add Room
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={newRoom.number}
                    onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="e.g., Room 101"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Type
                  </label>
                  <input
                    type="text"
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="e.g., Standard, Deluxe, Suite"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Status
                  </label>
                  <select
                    value={newRoom.status}
                    onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="">Select status</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setNewRoom({ number: '', type: '', status: '' });
                  }}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  disabled={!newRoom.number.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Edit Room
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={editingRoom.number}
                    onChange={(e) => setEditingRoom({ ...editingRoom, number: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Type
                  </label>
                  <input
                    type="text"
                    value={editingRoom.type || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Status
                  </label>
                  <select
                    value={editingRoom.status || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value })}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="">Select status</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingRoom(null)}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveRoomEdit({
                    number: editingRoom.number,
                    type: editingRoom.type,
                    status: editingRoom.status,
                  })}
                  disabled={!editingRoom.number.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {deletingRoom && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Delete Room
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this room? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingRoom(null)}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRoom(deletingRoom)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Deletion Warning Modal */}
      {showDeleteWarning && roomToDelete && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Room Has Assigned Shifts
              </h2>
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  <strong>{roomToDelete.number}</strong> is assigned to <strong>{assignedShiftsCount}</strong> shift{assignedShiftsCount !== 1 ? 's' : ''}.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      Deleting this room will remove it from all assigned shifts. This action cannot be undone.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteWarning(false);
                    setRoomToDelete(null);
                    setAssignedShiftsCount(0);
                  }}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteRoom}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
                >
                  Delete Room & Remove from Shifts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Bulk Upload Rooms
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  CSV Data Preview
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  rows={8}
                  placeholder="Paste CSV data here or upload a file..."
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>CSV Format:</strong> Include headers like Number, Type, Status. 
                    Only "Number" is required. Click "Sample CSV" to download an example.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-4 py-2"
                >
                  <Download className="w-4 h-4" />
                  Sample CSV
                </button>
                <button
                  onClick={() => {
                    setShowBulkUpload(false);
                    setCsvData('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!csvData.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Rooms
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;