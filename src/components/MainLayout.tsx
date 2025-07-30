import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import NavbarBlack from './NavbarBlack';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  
  // Room Management states
  const [roomSearchFilter, setRoomSearchFilter] = useState('');
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvData, setCsvData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staff Management states
  const [staffSearchFilter, setStaffSearchFilter] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Shift Management states
  const [dateFilter, setDateFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');

  const handleFilterChange = (filters: {
    dateFilter?: string;
    shiftFilter?: string;
    staffFilter?: string;
    searchFilter?: string;
  }) => {
    if (filters.dateFilter !== undefined) {
      setDateFilter(filters.dateFilter);
    }
    if (filters.shiftFilter !== undefined) {
      setShiftFilter(filters.shiftFilter);
    }
    if (filters.staffFilter !== undefined) {
      setStaffFilter(filters.staffFilter);
    }
    if (filters.searchFilter !== undefined) {
      // Set search filter based on current route
      if (location.pathname === '/admin/room-management') {
        setRoomSearchFilter(filters.searchFilter);
      } else if (location.pathname === '/admin/staff-management') {
        setStaffSearchFilter(filters.searchFilter);
      }
    }
  };

  const handleBulkUpload = () => {
    fileInputRef.current?.click();
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

  const handleAddRoom = () => {
    setShowAddRoomModal(true);
  };

  const handleAddStaff = () => {
    setShowAddStaffModal(true);
  };

  const getCurrentFilters = () => {
    switch (location.pathname) {
      case '/admin/room-management':
        return { searchFilter: roomSearchFilter };
      case '/admin/staff-management':
        return { searchFilter: staffSearchFilter };
      case '/admin/shift-management':
        return { dateFilter, shiftFilter, staffFilter };
      default:
        return {};
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="hidden"
      />
      <NavbarBlack
        onFilterChange={handleFilterChange}
        currentFilters={getCurrentFilters()}
        onAddRoom={handleAddRoom}
        onBulkUpload={handleBulkUpload}
        onAddStaff={handleAddStaff}
      />
      {React.cloneElement(children as React.ReactElement, {
        // Pass props to page components based on route
        ...(location.pathname === '/admin/room-management' && {
          searchFilter: roomSearchFilter,
          showAddRoomModal,
          setShowAddRoomModal,
          showBulkUpload,
          setShowBulkUpload,
          csvData,
          setCsvData,
          fileInputRef,
          onFilterChange: handleFilterChange,
          onBulkUpload: handleBulkUpload,
          onAddRoom: handleAddRoom,
        }),
        ...(location.pathname === '/admin/staff-management' && {
          searchFilter: staffSearchFilter,
          showAddStaffModal,
          setShowAddStaffModal,
          onFilterChange: handleFilterChange,
          onAddStaff: handleAddStaff,
        }),
        ...(location.pathname === '/admin/shift-management' && {
          dateFilter,
          shiftFilter,
          staffFilter,
          onFilterChange: handleFilterChange,
        }),
      })}
    </>
  );
};

export default MainLayout;