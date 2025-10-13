// src/redux/services/authApi.ts
import {
  baseApi,
  clearAuthAll,
  getAuthToken,
  setAuthToken,
  setAuthUser,
  setBranchId,
  setTenantId,
  getBranchId,
  getTenantId,
  getUserRole,
} from "@/redux/services/baseApi";

import {
  clearSession,
  setSession,
  type AuthSession,
} from "@/redux/slices/authSlices";

import type { AuthUser } from "@/types/auth";
import { normalizeAuthSession, normalizeAuthUser } from "@/utils/authNormalize";

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  role: string;
  tenantId: string | null;
  user: {
    id: string;
    name?: string;
    email: string;
    tenantId?: string | null;
    branchId?: string | null;
    role?: string;
  } | null;
}

export interface RawMeResponse {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string | null;
  branchId?: string | null;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    tenantId?: string | null;
    branchId?: string | null;
  } | null;
}

// Util: para no-admins, ignorar "ALL" y quedarnos sólo con uuid
const pickConcreteBranch = (maybe: string | "ALL" | null | undefined) =>
  maybe && maybe !== "ALL" ? maybe : null;

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ========= LOGIN =========
    login: build.mutation<AuthSession, LoginDto>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: unknown): AuthSession => {
        // Normaliza cualquier shape que devuelva el backend
        return normalizeAuthSession(response);
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          const role = data.role;
          const isAdminLike = role === "SUPER_ADMIN" || role === "ADMIN";

          // Storage actual (puede traer "ALL" o uuid)
          const storedBranch = getBranchId(); // "ALL" | uuid | null

          // Persistencia base
          setAuthToken(data.token);
          setTenantId(data.tenantId ?? null);

          // Branch rules:
          // - Admin-like: respetar storage si existe; si no, backend; si nada → "ALL"
          // - No-admin: preferir backend; si no hay, storage SOLO si es uuid; nunca "ALL"
          const branchId = isAdminLike
            ? (storedBranch ?? (data as any).branchId ?? "ALL")
            : (pickConcreteBranch((data as any).branchId) ??
               pickConcreteBranch(storedBranch) ??
               null);

          setBranchId(branchId as any);
          setAuthUser(data.user);

          dispatch(setSession({ ...data, branchId }));
        } catch (error) {
          clearAuthAll();
          dispatch(clearSession());
          throw error;
        }
      },
    }),

    // ========= ME =========
    me: build.query<AuthUser, void>({
      query: () => ({ url: "/auth/me" }),
      transformResponse: (raw: unknown): AuthUser => {
        // Normaliza user; si viene null/shape raro, lanza error para RTKQ
        return normalizeAuthUser(raw);
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Rol efectivo
          const role = data.role ?? getUserRole() ?? null;
          const isAdminLike = role === "SUPER_ADMIN" || role === "ADMIN";

          // Storage actual
          const storedTenant = getTenantId(); // puede ser null
          const storedBranch = getBranchId(); // "ALL" | uuid | null

          // Tenant: backend manda → gana; si no, respetar storage
          const tenantId =
            data.tenantId !== undefined ? data.tenantId : storedTenant ?? null;

          // Branch:
          // - Admin-like: si hay algo en storage, respetar (uuid o "ALL").
          //               si no hay storage y backend trae branch → usarla.
          //               si no hay nada → "ALL".
          // - No-admin: preferir backend; si no hay, usar storage solo si es uuid; si no, null.
          let branchId: string | null | "ALL";
          if (isAdminLike) {
            if (storedBranch !== null && storedBranch !== undefined) {
              branchId = storedBranch;
            } else if (data.branchId !== undefined && data.branchId !== null) {
              branchId = data.branchId as string;
            } else {
              branchId = "ALL";
            }
          } else {
            branchId =
              pickConcreteBranch(data.branchId) ??
              pickConcreteBranch(storedBranch) ??
              null;
          }

          // Persistencia final
          setAuthUser(data);
          setTenantId(tenantId);
          setBranchId(branchId as any);

          dispatch(
            setSession({
              token: getAuthToken(),
              tenantId,
              branchId,
              role,
              user: data,
            })
          );
        } catch (error) {
          clearAuthAll();
          dispatch(clearSession());
          throw error;
        }
      },
    }),

    // ========= CHANGE PASSWORD =========
    changePassword: build.mutation<
      { ok: true },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "PATCH",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useMeQuery, useChangePasswordMutation } =
  authApi;
