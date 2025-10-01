import { baseApi } from "./baseApi";

/** === Enums que usás en Users === */
export type UserRole = "ADMIN" | "MANAGER" | "CASHIER" | "STAFF" | string;

/** === Modelos devueltos por tu service (coinciden con los select) === */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  branchId: string | null;
  createdAt: string; // ISO
}

export interface UserDetail extends UserSummary {
  updatedAt?: string; // solo en findOne / update
  tenantId?: string; // solo en create (según tu select)
}

/** === DTOs controller/service === */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branchId?: string | null; // debe pertenecer al tenant
  isActive?: boolean;
}

export type UpdateUserDto = Partial<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branchId: string | null;
  isActive: boolean;
}>;

/** Header override por request: x-tenant-id */
export type TenantArg = { tenantId?: string };

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /users */
    listUsers: build.query<UserSummary[], TenantArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const tenantId = (arg as TenantArg | undefined)?.tenantId;
        if (tenantId) headers["x-tenant-id"] = tenantId;
        return { url: "/users", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "Users" as const, id: u.id })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),
    listUsersAdmin: build.query<UserSummary[], TenantArg | void>({
      query: (arg) => {
        const tenantId = (arg as TenantArg | undefined)?.tenantId;
        const qs = tenantId ? `?tenantId=${tenantId}` : "";
        return { url: `/users/admin${qs}` };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "Users" as const, id: u.id })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),
    /** GET /users/:id */
    getUserById: build.query<UserDetail, { id: string } & TenantArg>({
      query: ({ id, tenantId }) => {
        const headers: Record<string, string> = {};
        if (tenantId) headers["x-tenant-id"] = tenantId;
        return { url: `/users/${id}`, headers };
      },
      providesTags: (_res, _err, { id }) => [{ type: "Users", id }],
    }),

    /** POST /users */
    createUser: build.mutation<UserDetail, { data: CreateUserDto } & TenantArg>(
      {
        query: ({ data, tenantId }) => {
          const headers: Record<string, string> = {};
          if (tenantId) headers["x-tenant-id"] = tenantId;
          return { url: "/users", method: "POST", body: data, headers };
        },
        invalidatesTags: [{ type: "Users", id: "LIST" }],
      }
    ),
    createUserAdmin: build.mutation<
      UserDetail,
      { tenantId: string; data: CreateUserDto }
    >({
      query: ({ tenantId, data }) => ({
        url: `/users/admin?tenantId=${tenantId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
    /** PATCH /users/:id */
    updateUser: build.mutation<
      UserDetail,
      { id: string; data: UpdateUserDto } & TenantArg
    >({
      query: ({ id, data, tenantId }) => {
        const headers: Record<string, string> = {};
        if (tenantId) headers["x-tenant-id"] = tenantId;
        return { url: `/users/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    /** DELETE /users/:id */
    deleteUser: build.mutation<{ id: string }, { id: string } & TenantArg>({
      query: ({ id, tenantId }) => {
        const headers: Record<string, string> = {};
        if (tenantId) headers["x-tenant-id"] = tenantId;
        return { url: `/users/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListUsersQuery,
  useListUsersAdminQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useCreateUserAdminMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
