import RoomManagement from "../components/RoomManagement";

interface AdminRoomManagementPageProps {
  searchFilter?: string;
  showAddRoomModal?: boolean;
  setShowAddRoomModal?: (show: boolean) => void;
  showBulkUpload?: boolean;
  setShowBulkUpload?: (show: boolean) => void;
  csvData?: string;
  setCsvData?: (data: string) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  onFilterChange?: (filters: { searchFilter?: string }) => void;
  onBulkUpload?: () => void;
  onAddRoom?: () => void;
}

const AdminRoomManagementPage = (props: AdminRoomManagementPageProps) => {
  return (
    <div className="p-6">
      <RoomManagement {...props} />
    </div>
  );
};

export default AdminRoomManagementPage;
