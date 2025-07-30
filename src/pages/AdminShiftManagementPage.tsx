import ShiftManagement from "../components/ShiftManagement";

interface AdminShiftManagementPageProps {
  dateFilter?: string;
  shiftFilter?: string;
  staffFilter?: string;
  onFilterChange?: (filters: {
    dateFilter?: string;
    shiftFilter?: string;
    staffFilter?: string;
  }) => void;
}

const AdminShiftManagementPage = (props: AdminShiftManagementPageProps) => {
  return (
    <div className="p-6">
      <ShiftManagement {...props} />
    </div>
  );
};

export default AdminShiftManagementPage;
