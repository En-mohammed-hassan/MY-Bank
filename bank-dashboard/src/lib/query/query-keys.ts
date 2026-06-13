export const staffKeys = {
  all: ["staff"] as const,
  list: (status = "active") => [...staffKeys.all, "list", status] as const,
};

export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  accounts: (cif: string) => [...customerKeys.all, "accounts", cif] as const,
};

export const coreKeys = {
  all: ["core"] as const,
  customer: (cif: string) => [...coreKeys.all, "customer", cif] as const,
  accounts: (cif: string) => [...coreKeys.all, "accounts", cif] as const,
  account: (accountNumber: string) => [...coreKeys.all, "account", accountNumber] as const,
};
