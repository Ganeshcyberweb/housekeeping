export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  updatedAt: any;
}

export interface RolePermissions {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAllShifts: boolean;
  canAssignShifts: boolean;
  canEditShifts: boolean;
  canDeleteShifts: boolean;
  canViewReports: boolean;
  canViewAllStaff: boolean;
  canManageStaff: boolean;
  canManageRooms: boolean;
  canViewOwnShiftsOnly: boolean;
}

export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'admin':
      return {
        canManageUsers: true,
        canManageRoles: true,
        canViewAllShifts: true,
        canAssignShifts: true,
        canEditShifts: true,
        canDeleteShifts: true,
        canViewReports: true,
        canViewAllStaff: true,
        canManageStaff: true,
        canManageRooms: true,
        canViewOwnShiftsOnly: false,
      };
    case 'manager':
      return {
        canManageUsers: false,
        canManageRoles: false,
        canViewAllShifts: true,
        canAssignShifts: true,
        canEditShifts: true,
        canDeleteShifts: false,
        canViewReports: true,
        canViewAllStaff: true,
        canManageStaff: true,
        canManageRooms: true,
        canViewOwnShiftsOnly: false,
      };
    case 'staff':
      return {
        canManageUsers: false,
        canManageRoles: false,
        canViewAllShifts: false,
        canAssignShifts: false,
        canEditShifts: false,
        canDeleteShifts: false,
        canViewReports: false,
        canViewAllStaff: false,
        canManageStaff: false,
        canManageRooms: false,
        canViewOwnShiftsOnly: true,
      };
    default:
      return {
        canManageUsers: false,
        canManageRoles: false,
        canViewAllShifts: false,
        canAssignShifts: false,
        canEditShifts: false,
        canDeleteShifts: false,
        canViewReports: false,
        canViewAllStaff: false,
        canManageStaff: false,
        canManageRooms: false,
        canViewOwnShiftsOnly: true,
      };
  }
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  staff: 'Staff Member',
};