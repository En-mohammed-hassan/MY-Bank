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

export type TransferInput = {
  from_account: string;
  to_account: string;
  amount: string;
  currency: string;
  reference: string;
  idempotency_key: string;
};
