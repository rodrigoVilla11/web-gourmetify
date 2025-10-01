// src/redux/services/authApi.ts
import { baseApi, setAuthToken, setTenantId } from "./baseApi";

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  role: string;
  tenantId: string;
  user: {
    id: string;
    name: string;
    email: string;
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
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // guardamos token + tenant en localStorage
          setAuthToken(data.access_token);
          setTenantId(data.tenantId);
        } catch (err) {
          console.error("Login error:", err);
        }
      },
    }),

    me: build.query<AuthResponse, void>({
      query: () => ({ url: "/auth/me" }), // endpoint protegido que devuelve user actual
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
