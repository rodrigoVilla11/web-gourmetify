import { baseApi } from "./baseApi";

/** Modelo que devuelve tu backend */
export interface CustomerTag {
  id: string;
  branchId: string;
  name: string;
  color?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** DTOs según tu service */
export interface CreateCustomerTagDto {
  name: string;
  color?: string | null;
}
export type UpdateCustomerTagDto = Partial<CreateCustomerTagDto>;

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

export const customerTagsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /customer-tags
    listCustomerTags: build.query<CustomerTag[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/customer-tags", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "CustomerTags" as const, id: t.id })),
              { type: "CustomerTags", id: "LIST" },
            ]
          : [{ type: "CustomerTags", id: "LIST" }],
    }),

    // POST /customer-tags
    createCustomerTag: build.mutation<CustomerTag, { data: CreateCustomerTagDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/customer-tags", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "CustomerTags", id: "LIST" }],
    }),

    // PATCH /customer-tags/:id
    updateCustomerTag: build.mutation<
      CustomerTag,
      { id: string; data: UpdateCustomerTagDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/customer-tags/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "CustomerTags", id },
        { type: "CustomerTags", id: "LIST" },
      ],
    }),

    // DELETE /customer-tags/:id
    deleteCustomerTag: build.mutation<{ id: string }, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/customer-tags/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "CustomerTags", id },
        { type: "CustomerTags", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomerTagsQuery,
  useCreateCustomerTagMutation,
  useUpdateCustomerTagMutation,
  useDeleteCustomerTagMutation,
} = customerTagsApi;
