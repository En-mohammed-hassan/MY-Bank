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

export type CoreCustomer = {
  cif: string;
  full_name: string;
  customer_type: string;
  status: string;
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

export type AccountListResponse = {
  cif: string;
  accounts: Account[];
  total: number;
};
