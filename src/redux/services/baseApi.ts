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
const USER_KEY = `${NS}.auth.user`;

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
// ...arriba ya están TOKEN_KEY, TENANT_KEY, BRANCH_KEY, USER_KEY

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getLocal(TOKEN_KEY);
    if (token) headers.set("authorization", `Bearer ${token}`);

    const tenantId =
      getLocal(TENANT_KEY) ?? process.env.NEXT_PUBLIC_TENANT_ID ?? undefined;
    if (tenantId) headers.set("x-tenant-id", tenantId);

    // role desde user
    const role = (() => {
      const raw = getLocal(USER_KEY);
      if (!raw) return null;
      try {
        return (JSON.parse(raw)?.role as string) ?? null;
      } catch {
        return null;
      }
    })();

    const stored = getLocal(BRANCH_KEY); // "ALL" | uuid | null

    // 🚩 Nunca enviar "ALL" como header
    const effectiveStored = stored === "ALL" ? null : stored;

    // 👇 ADMIN y SUPER_ADMIN pueden ir sin branch (modo "Todas")
    const isAdminLike = role === "SUPER_ADMIN" || role === "ADMIN";

    if (isAdminLike) {
      if (effectiveStored) headers.set("x-branch-id", effectiveStored);
      else headers.delete("x-branch-id"); // "Todas" → sin header
    } else {
      // No-admin: siempre branch concreta (BranchSelector la fuerza)
      if (effectiveStored) headers.set("x-branch-id", effectiveStored);
      else headers.delete("x-branch-id"); // fallback seguro (evita mandar "ALL")
    }

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

export function setBranchId(branchId: string | null | "ALL") {
  if (!isBrowser) return;
  if (branchId === "ALL") localStorage.setItem(BRANCH_KEY, "ALL");
  else if (branchId) localStorage.setItem(BRANCH_KEY, branchId);
  else localStorage.removeItem(BRANCH_KEY);
  broadcastAuthChange();
}

export function getTenantId(): string | null {
  return getLocal(TENANT_KEY) || DEFAULT_TENANT;
}

// src/redux/services/baseApi.ts
export function getBranchId(): string | "ALL" | null {
  const raw = getLocal(BRANCH_KEY);
  if (raw === "ALL") return "ALL";
  return raw || null;
}

/* ======================
   Usuario (role dentro de user)
   ====================== */

export function setAuthUser(user: AuthUser | null) {
  if (!isBrowser) return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.role === "SUPER_ADMIN") {
      // prevenir leaks al cambiar de cuentas
      setBranchId(null);
    }
  } else {
    localStorage.removeItem(USER_KEY);
  }
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
