import StaffManagement from "../components/StaffManagement";

interface AdminStaffManagementPageProps {
  searchFilter?: string;
  showAddStaffModal?: boolean;
  setShowAddStaffModal?: (show: boolean) => void;
  onFilterChange?: (filters: { searchFilter?: string }) => void;
  onAddStaff?: () => void;
}

const AdminStaffManagementPage = (props: AdminStaffManagementPageProps) => {
  return (
    <div className="p-6">
      <StaffManagement {...props} />
    </div>
  );
};

export default AdminStaffManagementPage;
