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

export type CoreCustomer = {
  cif: string;
  full_name: string;
  customer_type: string;
  status: string;
};

export type CreateCustomerInput = {
  username: string;
  email: string;
  full_name: string;
  role: "editor" | "viewer";
  cif?: string | null;
  temporary_password: string;
};
