import type { StaffRole } from "./auth";

export type StaffUser = {
  id: string;
  keycloak_user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: StaffRole;
  status: "active" | "disabled";
  department: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffListResponse = {
  items: StaffUser[];
  total: number;
};

export type CreateStaffInput = {
  username: string;
  email: string;
  full_name: string;
  role: StaffRole;
  department?: string | null;
  temporary_password: string;
};
