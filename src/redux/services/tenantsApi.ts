import { baseApi } from "./baseApi";

/** ===== Enums según tu DTO ===== */
export type TenantPlan = "FREE" | "BASIC" | "PRO" | "ENTERPRISE" | string;
export type TenantStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | string;

/** ===== Model ===== */
export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** ===== DTOs ===== */
export interface CreateTenantDto {
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
}

export type UpdateTenantDto = Partial<CreateTenantDto>;

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /tenants */
    listTenants: build.query<Tenant[], void>({
      query: () => ({ url: "/tenants" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "Tenants" as const, id: t.id })),
              { type: "Tenants", id: "LIST" },
            ]
          : [{ type: "Tenants", id: "LIST" }],
    }),

    /** GET /tenants/:id */
    getTenantById: build.query<Tenant, { id: string }>({
      query: ({ id }) => ({ url: `/tenants/${id}` }),
      providesTags: (_res, _err, { id }) => [{ type: "Tenants", id }],
    }),

    /** POST /tenants */
    createTenant: build.mutation<Tenant, { data: CreateTenantDto }>({
      query: ({ data }) => ({ url: "/tenants", method: "POST", body: data }),
      invalidatesTags: [{ type: "Tenants", id: "LIST" }],
    }),

    /** PATCH /tenants/:id */
    updateTenant: build.mutation<Tenant, { id: string; data: UpdateTenantDto }>({
      query: ({ id, data }) => ({ url: `/tenants/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Tenants", id },
        { type: "Tenants", id: "LIST" },
      ],
    }),

    /** DELETE /tenants/:id */
    deleteTenant: build.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/tenants/${id}`, method: "DELETE" }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Tenants", id },
        { type: "Tenants", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListTenantsQuery,
  useGetTenantByIdQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} = tenantsApi;
