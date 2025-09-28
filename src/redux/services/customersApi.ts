import { baseApi } from "./baseApi";

/** Ajustá si tu backend usa enums estrictos */
export type CustomerTagType = string;

export interface CustomerAddress {
  id: string;
  customerId: string;
  label?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TagEntity {
  id: string;
  name: string;
  color?: string | null;
  type?: CustomerTagType | null;
  createdAt: string;
  updatedAt: string;
}

/** Relación pivot (customer_tags) con include { tag: true } */
export interface CustomerTagPivot {
  id: string;
  customerId: string;
  tagId: string;
  createdAt: string;
  tag: TagEntity;
}

/** Nota de cliente (solo presente en detail) */
export interface CustomerNote {
  id: string;
  customerId: string;
  text: string;
  createdAt: string; // ISO
  userId?: string | null;
}

/** List item (list) */
export interface CustomerListItem {
  id: string;
  branchId: string;
  name: string;
  email: string | null;
  phone: string | null;
  marketingOptIn: boolean;
  createdAt: string;
  updatedAt: string;
  addresses: CustomerAddress[];
  tags: CustomerTagPivot[]; // cada pivot trae .tag
}

/** Detail (detail) — incluye notes */
export interface CustomerDetail extends CustomerListItem {
  notes: CustomerNote[];
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone?: string | null;
  marketingOptIn?: boolean;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

export const customersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /customers  (include: addresses, tags.tag)
    listCustomers: build.query<CustomerListItem[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/customers", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Customers" as const, id: c.id })),
              { type: "Customers", id: "LIST" },
            ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    // GET /customers/:id  (include: addresses, tags.tag, notes)
    getCustomerById: build.query<CustomerDetail, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/customers/${id}`, headers };
      },
      providesTags: (_res, _err, { id }) => [{ type: "Customers", id }],
    }),

    // POST /customers
    createCustomer: build.mutation<CustomerListItem, { data: CreateCustomerDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/customers", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "Customers", id: "LIST" }],
    }),

    // PATCH /customers/:id
    updateCustomer: build.mutation<
      CustomerDetail,
      { id: string; data: UpdateCustomerDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/customers/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Customers", id },
        { type: "Customers", id: "LIST" },
      ],
    }),

    // DELETE /customers/:id
    deleteCustomer: build.mutation<{ id: string }, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/customers/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Customers", id },
        { type: "Customers", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
