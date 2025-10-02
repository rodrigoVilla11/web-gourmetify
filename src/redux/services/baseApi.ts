import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { AuthUser } from "@/types/auth";

const isBrowser = typeof window !== "undefined";

// ==== Claves locales (UNIFICADAS) ====
const NS = "gourmetify";
const TENANT_KEY = `${NS}.ctx.tenant`;
const BRANCH_KEY = `${NS}.ctx.branch`;
const TOKEN_KEY = `${NS}.auth.token`;
const USER_KEY  = `${NS}.auth.user`;

// Evento custom para notificar cambios locales en la misma pestaña
export const AUTH_EVENT = "auth:changed";

const broadcastAuthChange = () => {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(AUTH_EVENT));
  channel?.postMessage({ type: "AUTH_CHANGED", ts: Date.now() });
};

// Lectura SSR-safe
const getLocal = (k: string) =>
  isBrowser ? window.localStorage.getItem(k) : null;

// Defaults opcionales por env
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_TENANT_ID || null;
const DEFAULT_BRANCH = process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID || null;

// arriba del archivo
const channel = isBrowser ? new BroadcastChannel("auth") : null;

if (isBrowser) {
  channel?.addEventListener("message", (e) => {
    if (e.data?.type === "AUTH_CHANGED") {
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
  });
}
const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getLocal(TOKEN_KEY);
    if (token) headers.set("authorization", `Bearer ${token}`);
    const tenantId = getLocal(TENANT_KEY) || DEFAULT_TENANT || undefined;
    if (tenantId) headers.set("x-tenant-id", tenantId);
    const branchId = getLocal(BRANCH_KEY) || DEFAULT_BRANCH || undefined;
    if (branchId) headers.set("x-branch-id", branchId);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    // intentar refresh
    const refresh = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );
    if (refresh.data && (refresh.data as any).token) {
      setAuthToken((refresh.data as any).token);
      result = await rawBaseQuery(args, api, extraOptions); // reintento
    } else {
      clearAuthAll(); // limpiar todo
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Customers",
    "Branches",
    "Accounts",
    "CashClosures",
    "Categories",
    "CustomerAddresses",
    "CustomerNotes",
    "CustomerTags",
    "DailyReports",
    "Employees",
    "EmployeeShifts",
    "Ingredients",
    "IngredientRecipes",
    "Inventory",
    "Movements",
    "Orders",
    "OrderPayments",
    "ProductCategories",
    "Products",
    "ProductionBatches",
    "PurchaseOrders",
    "Recipes",
    "Suppliers",
    "Tenants",
    "Transfers",
    "Users",
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

export function getAuthToken(): string | null {
  return getLocal(TOKEN_KEY);
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
  try {
    const u = JSON.parse(raw) as Partial<AuthUser>;
    if (!u || typeof u !== "object" || !u.id) return null;
    return {
      id: String(u.id),
      name: String(u.name ?? ""),
      email: String(u.email ?? "").toLowerCase(),
      role: (u.role as AuthUser["role"]) ?? "WAITER",
      branchId: u.branchId ?? null,
      tenantId: u.tenantId ?? null,
    } as AuthUser;
  } catch {
    return null;
  }
}

export function getUserRole(): AuthUser["role"] | null {
  const user = getAuthUser();
  return user?.role ?? null;
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
