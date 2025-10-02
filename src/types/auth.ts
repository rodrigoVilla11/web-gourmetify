// src/types/auth.ts
export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "CASHIER"
  | "WAITER"

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  tenantId?: string | null;
  branchId?: string | null;
};