// src/redux/services/authApi.ts
import { baseApi, getBranchId, getTenantId, getUserRole } from "./baseApi";
import {
  clearAuthAll,
  getAuthToken,
  setAuthToken,
  setAuthUser,
  setBranchId,
  setTenantId,
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


export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthSession, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: unknown): AuthSession => {
        // cualquier shape → normalizador robusto
        return normalizeAuthSession(response);
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setAuthToken(data.token);
          setTenantId(data.tenantId ?? null);
          setBranchId(data.branchId ?? null);
          setAuthUser(data.user);
          dispatch(setSession(data));
        } catch (error) {
          clearAuthAll();
          dispatch(clearSession());
          throw error;
        }
      },
    }),

    me: build.query<AuthUser, void>({
      query: () => ({ url: "/auth/me" }),
      transformResponse: (raw: unknown): AuthUser => {
        // ⚠️ si backend responde null/204/shape raro, esto throws y RTKQ tratará como error
        return normalizeAuthUser(raw);
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          const tenantId = data.tenantId ?? getTenantId() ?? null;
          const branchId = data.branchId ?? getBranchId() ?? null;
          const role = data.role ?? getUserRole() ?? null;

          setAuthUser(data);
          setTenantId(tenantId);
          setBranchId(branchId);

          dispatch(setSession({
            token: getAuthToken(),
            tenantId,
            branchId,
            role,
            user: data,
          }));
        } catch (error) {
          // si normalize tiró error, consideramos sesión inválida
          clearAuthAll();
          dispatch(clearSession());
          throw error;
        }
      },
    }),

    changePassword: build.mutation<{ ok: true }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "PATCH", body }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useMeQuery, useChangePasswordMutation } =
  authApi;
