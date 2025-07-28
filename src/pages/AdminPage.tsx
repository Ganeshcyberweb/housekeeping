import { useState } from "react";
import { Loader2 } from "lucide-react";
import ShiftManagement from "../components/ShiftManagement";
import StaffManagement from "../components/StaffManagement";
import RoomManagement from "../components/RoomManagement";
import { useShiftsStore } from "../store/shiftsStore";
import { useStaffStore } from "../store/staffStore";
import {
  Clock,
  Users,
  FileText,
} from "lucide-react";

const AdminPage = () => {
  const { loading } = useShiftsStore();
  const { loading: staffLoading } = useStaffStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<'shifts' | 'staff' | 'rooms'>('shifts');

  if (loading && staffLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 min-h-screen p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400 text-sm">
              Loading data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-800 min-h-screen p-6">
      <div className="bg-white dark:bg-gray-900 p-6">
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
          </div>

          {/* Tabs Navigation */}
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('shifts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shifts'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Shift Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Staff Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rooms'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Room Management
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'shifts' && <ShiftManagement />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'rooms' && <RoomManagement />}
      </div>
    </div>
  );
};

export default AdminPage;