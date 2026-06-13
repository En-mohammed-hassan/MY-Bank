export type StaffRole = "admin" | "supervisor" | "retail";

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export type SessionUser = {
  username: string;
  roles: StaffRole[];
};
