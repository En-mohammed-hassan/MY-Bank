export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

export const coreKeys = {
  all: ["core"] as const,
  customer: (cif: string) => [...coreKeys.all, "customer", cif] as const,
  accounts: (cif: string) => [...coreKeys.all, "accounts", cif] as const,
};
