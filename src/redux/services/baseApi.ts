import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AuthUser } from "@/types/auth";

const isBrowser = typeof window !== "undefined";

// ==== Claves locales (UNIFICADAS) ====
const TENANT_KEY = "x-tenant-id";
const BRANCH_KEY = "x-branch-id";
const TOKEN_KEY  = "token";
const USER_KEY   = "authUser"; // 👈 unificado

// Evento custom para notificar cambios locales en la misma pestaña
export const AUTH_EVENT = "auth:changed";
const broadcastAuthChange = () => {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(AUTH_EVENT));
};

// Lectura SSR-safe
const getLocal = (k: string) => (isBrowser ? window.localStorage.getItem(k) : null);

// Defaults opcionales por env
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_TENANT_ID || null;
const DEFAULT_BRANCH = process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID || null;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL!, // asegurate que exista
    credentials: "include",
    prepareHeaders: (headers) => {
      // 1) Auth header
      const token = getLocal(TOKEN_KEY);
      if (token) headers.set("authorization", `Bearer ${token}`);

      // 2) Tenant/Branch por defecto si no vienen
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
  broadcastAuthChange();
}

export function setTenantId(tenantId: string | null) {
  if (!isBrowser) return;
  if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
  else localStorage.removeItem(TENANT_KEY);
  broadcastAuthChange();
}

export function setBranchId(branchId: string | null) {
  if (!isBrowser) return;
  if (branchId) localStorage.setItem(BRANCH_KEY, branchId);
  else localStorage.removeItem(BRANCH_KEY);
  broadcastAuthChange();
}

export function getTenantId(): string | null {
  return getLocal(TENANT_KEY) || DEFAULT_TENANT;
}

export function getBranchId(): string | null {
  return getLocal(BRANCH_KEY) || DEFAULT_BRANCH;
}

/* ======================
   Usuario (role dentro de user)
   ====================== */

export function setAuthUser(user: AuthUser | null) {
  if (!isBrowser) return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  broadcastAuthChange();
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
  const u = getAuthUser();
  return u?.role === "SUPER_ADMIN";
}

export function clearAuthAll() {
  setAuthToken(null);
  setTenantId(null);
  setBranchId(null);
  setAuthUser(null);
}
