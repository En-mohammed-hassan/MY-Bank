import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(255),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
