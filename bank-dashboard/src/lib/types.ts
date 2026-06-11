export type StaffUser = {
  id: string;
  keycloak_user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "supervisor" | "retail";
  status: "active" | "disabled";
  department: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffListResponse = {
  items: StaffUser[];
  total: number;
};

export type Account = {
  account_number: string;
  cif: string;
  product_category: string;
  currency: string;
  ledger_balance: string;
  available_balance: string;
  hold_amount: string;
  status: string;
};

export type Customer = {
  cif: string;
  full_name: string;
  customer_type: string;
  status: string;
};

export type CustomerProfile = {
  id: string;
  keycloak_user_id: string;
  username: string;
  email: string;
  full_name: string;
  cif: string | null;
  role: "editor" | "viewer";
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
};

export type CustomerListResponse = {
  items: CustomerProfile[];
  total: number;
};

export type AccountListResponse = {
  cif: string;
  accounts: Account[];
  total: number;
};
