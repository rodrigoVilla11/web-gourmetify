// src/redux/services/authApi.ts
import { baseApi } from "./baseApi";
import type { AuthUser } from "@/types/auth";

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  role: string;        // lo incluimos pero en el cliente guardamos dentro de user
  tenantId: string | null;
  user: {
    id: string;
    name?: string;
    email: string;
    tenantId?: string | null;
    branchId?: string | null;
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginDto>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    me: build.query<AuthUser, void>({
      // Endpoint protegido que devuelve el usuario actual ya normalizado
      query: () => ({ url: "/auth/me" }),
      // Opcional: transformar la respuesta del backend a nuestro AuthUser
      transformResponse: (data: any): AuthUser => ({
        id: data?.id ?? data?.user?.id,
        email: data?.email ?? data?.user?.email,
        name: data?.name ?? data?.user?.name,
        role: data?.role ?? data?.user?.role,
        tenantId: data?.tenantId ?? data?.user?.tenantId ?? null,
        branchId: data?.branchId ?? data?.user?.branchId ?? null,
      }),
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

export const { useLoginMutation, useMeQuery, useChangePasswordMutation } = authApi;
