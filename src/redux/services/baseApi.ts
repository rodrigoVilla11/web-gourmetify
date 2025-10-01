import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const isBrowser = typeof window !== "undefined";

// Keys locales para sincronizar en cliente
const TENANT_KEY = "x-tenant-id";
const BRANCH_KEY = "x-branch-id";
const TOKEN_KEY  = "token";
const ROLE_KEY   = "role";       // 👈 nuevo
const USER_KEY   = "auth_user";  // 👈 nuevo

// Lectores SSR-safe
const getLocal = (k: string) =>
  isBrowser ? window.localStorage.getItem(k) : null;

// Defaults públicos (opcionales)
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_TENANT_ID || null;
const DEFAULT_BRANCH = process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID || null;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    credentials: "include", // por si usás cookies HttpOnly más adelante
    prepareHeaders: (headers) => {
      // 1) Auth header
      const token = getLocal(TOKEN_KEY);
      if (token) headers.set("authorization", `Bearer ${token}`);

      // 2) Completar tenant/branch si el endpoint no los setea explícitamente
      if (!headers.has("x-tenant-id")) {
        const tenantId = getLocal(TENANT_KEY) || DEFAULT_TENANT || undefined;
        if (tenantId) headers.set("x-tenant-id", tenantId);
      }

      if (!headers.has("x-branch-id")) {
        const branchId = getLocal(BRANCH_KEY) || DEFAULT_BRANCH || undefined;
        if (branchId) headers.set("x-branch-id", branchId);
      }

      return headers;
    },
  }),
  tagTypes: [
    "Customers","Branches","Accounts","CashClosures","Categories",
    "CustomerAddresses","CustomerNotes","CustomerTags","DailyReports",
    "Employees","EmployeeShifts","Ingredients","IngredientRecipes",
    "Inventory","Movements","Orders","OrderPayments","ProductCategories",
    "Products","ProductionBatches","PurchaseOrders","Recipes","Suppliers",
    "Tenants","Transfers","Users",
  ],
  endpoints: () => ({}),
});

/* ======================
   Helpers de Auth/Contexto
   ====================== */

export function setAuthToken(token: string | null) {
  if (!isBrowser) return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function setTenantId(tenantId: string | null) {
  if (!isBrowser) return;
  if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
  else localStorage.removeItem(TENANT_KEY);
  // sync entre tabs
  window.dispatchEvent(new StorageEvent("storage", { key: TENANT_KEY }));
}

export function setBranchId(branchId: string | null) {
  if (!isBrowser) return;
  if (branchId) localStorage.setItem(BRANCH_KEY, branchId);
  else localStorage.removeItem(BRANCH_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: BRANCH_KEY }));
}

export function getTenantId(): string | null {
  return getLocal(TENANT_KEY) || DEFAULT_TENANT;
}

export function getBranchId(): string | null {
  return getLocal(BRANCH_KEY) || DEFAULT_BRANCH;
}

/* ======================
   NUEVO: rol y usuario
   ====================== */

export function setUserRole(role: string | null) {
  if (!isBrowser) return;
  if (role) localStorage.setItem(ROLE_KEY, role);
  else localStorage.removeItem(ROLE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: ROLE_KEY }));
}

export function getUserRole(): string | null {
  return getLocal(ROLE_KEY);
}

type AuthUser = { id: string; name?: string; email: string; role?: string };

export function setAuthUser(user: AuthUser | null) {
  if (!isBrowser) return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: USER_KEY }));
}

export function getAuthUser(): AuthUser | null {
  const raw = getLocal(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; }
  catch { return null; }
}

/* ======================
   Conveniencia
   ====================== */

export function isSuperAdmin(): boolean {
  return getUserRole() === "SUPERADMIN";
}

export function clearAuthAll() {
  // útil para logout centralizado
  setAuthToken(null);
  setTenantId(null);
  setBranchId(null);
  setUserRole(null);
  setAuthUser(null);
}
