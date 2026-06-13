import { z } from "zod";

export const createStaffSchema = z.object({
  username: z.string().min(3).max(64),
  email: z.string().email(),
  full_name: z.string().min(1).max(255),
  role: z.enum(["admin", "supervisor", "retail"]),
  department: z.string().max(128).optional(),
  temporary_password: z.string().min(8).max(128),
});

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>;

export const createCustomerSchema = z.object({
  username: z.string().min(3).max(64),
  email: z.string().email(),
  full_name: z.string().min(1).max(255),
  role: z.enum(["editor", "viewer"]),
  cif: z.string().max(64).optional(),
  temporary_password: z.string().min(8).max(128),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

export const transferSchema = z.object({
  from_account: z.string().min(1),
  to_account: z.string().min(1),
  amount: z.string().min(1),
  reference: z.string().optional(),
});

export type TransferFormValues = z.infer<typeof transferSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
