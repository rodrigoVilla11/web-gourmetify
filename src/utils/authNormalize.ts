// src/utils/authNormalize.ts
import type { AuthUser, UserRole } from "@/types/auth";

const ALLOWED_ROLES = new Set<UserRole>([
  "SUPER_ADMIN","ADMIN","MANAGER","CASHIER","WAITER",
]);

const safeRole = (r?: unknown): UserRole | undefined => {
  if (typeof r !== "string") return undefined;
  const rr = r.toUpperCase().trim() as UserRole;
  return ALLOWED_ROLES.has(rr) ? rr : undefined;
};

const isRec = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object";

/** Normaliza /auth/me (puede venir plano o anidado en { user }) */
export const normalizeAuthUser = (raw: unknown): AuthUser => {
  const d = isRec(raw) ? raw : {};
  const nested = isRec(d.user) ? (d.user as Record<string, unknown>) : undefined;

  const id =
    (typeof d.id === "string" && d.id) ||
    (typeof nested?.id === "string" && nested.id) ||
    undefined;

  const emailRaw =
    (typeof d.email === "string" && d.email) ||
    (typeof nested?.email === "string" && nested.email) ||
    undefined;

  const email = emailRaw ? emailRaw.toLowerCase() : undefined;

  const name =
    (typeof d.name === "string" && d.name) ||
    (typeof nested?.name === "string" && nested.name) ||
    undefined;

  const tenantId =
    (d.tenantId as string | null | undefined) ??
    (nested?.tenantId as string | null | undefined) ??
    null;

  const branchId =
    (d.branchId as string | null | undefined) ??
    (nested?.branchId as string | null | undefined) ??
    null;

  const role =
    safeRole(d.role) ?? safeRole(nested?.role) ?? undefined;

  // Si faltan id/email, consideramos respuesta inválida → forzamos 401 lógico arriba
  if (!id || !email) {
    throw new Error("Invalid /auth/me payload: missing id or email");
  }

  return { id, email, name, role, tenantId, branchId };
};

/** Normaliza /auth/login (AuthResponse) */
export const normalizeAuthSession = (raw: unknown) => {
  const d = isRec(raw) ? raw : {};
  const userObj = isRec(d.user) ? d.user : undefined;

  const user: AuthUser | null = userObj
    ? {
        id: typeof userObj.id === "string" ? userObj.id : "",
        email:
          typeof userObj.email === "string"
            ? userObj.email.toLowerCase()
            : "",
        name: typeof userObj.name === "string" ? userObj.name : undefined,
        tenantId:
          (userObj.tenantId as string | null | undefined) ??
          (d.tenantId as string | null | undefined) ??
          null,
        branchId: (userObj.branchId as string | null | undefined) ?? null,
        role:
          safeRole(d.role) ?? safeRole(userObj.role) ?? undefined,
      }
    : null;

  const token = typeof d.access_token === "string" ? d.access_token : null;
  const tenantId =
    (d.tenantId as string | null | undefined) ?? user?.tenantId ?? null;
  const branchId = user?.branchId ?? null;
  const role = (user?.role ?? safeRole(d.role)) ?? null;

  return {
    token,
    tenantId,
    branchId,
    role,
    user,
    flags: {},
  };
};
