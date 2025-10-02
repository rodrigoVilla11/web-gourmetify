// src/redux/services/authApi.ts
import { baseApi } from "./baseApi";
import {
  clearAuthAll,
  getAuthToken,
  getBranchId,
  getTenantId,
  getUserRole,
  setAuthToken,
  setAuthUser,
  setBranchId,
  setTenantId,
} from "@/redux/services/baseApi";
import { clearSession, setSession, type AuthSession } from "@/redux/slices/authSlices";
import type { AuthUser, UserRole } from "@/types/auth";

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
interface RawMeResponse {
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

const normalizeAuthUser = (data: RawMeResponse): AuthUser => {
  const nested = data.user ?? undefined;
  const id = (data.id ?? nested?.id) as string;
  const email = (data.email ?? nested?.email) as string;
  const name = data.name ?? nested?.name;
  const tenantId = data.tenantId ?? nested?.tenantId ?? null;
  const branchId = data.branchId ?? nested?.branchId ?? null;
  const role = (data.role ?? nested?.role) as UserRole | undefined;

  return {
    id,
    email,
    name,
    role,
    tenantId,
    branchId,
  };
};

const normalizeAuthSession = (payload: AuthResponse): AuthSession => {
  const roleFromResponse = (payload.role as UserRole | undefined) ?? undefined;
  const user: AuthUser | null = payload.user
    ? {
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        tenantId: payload.user.tenantId ?? payload.tenantId ?? null,
        branchId: payload.user.branchId ?? null,
        role:
          roleFromResponse ??
          (payload.user.role as UserRole | undefined) ??
          undefined,
      }
    : null;

  const role: UserRole | null = user?.role ?? roleFromResponse ?? null;

  return {
    token: payload.access_token ?? null,
    tenantId: payload.tenantId ?? user?.tenantId ?? null,
    branchId: user?.branchId ?? null,
    role,
    user,
    flags: {},
  };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthSession, LoginDto>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: AuthResponse): AuthSession =>
        normalizeAuthSession(response),
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
      // Endpoint protegido que devuelve el usuario actual ya normalizado
      query: () => ({ url: "/auth/me" }),
      // Opcional: transformar la respuesta del backend a nuestro AuthUser
     transformResponse: (data: RawMeResponse): AuthUser => normalizeAuthUser(data),
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
          clearAuthAll();
          dispatch(clearSession());
          throw error;
        }
      },
    }),

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
