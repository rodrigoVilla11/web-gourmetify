import { baseApi } from "./baseApi";

/** Modelo que devuelve tu backend */
export interface CustomerNote {
  id: string;
  customerId: string;
  userId: string;
  note: string;
  createdAt: string; // ISO
}

/** DTO de creación */
export interface CreateCustomerNoteDto {
  customerId: string;
  userId: string;
  note: string;
}

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

/** Params del GET /customer-notes?customerId=... */
export interface ListCustomerNotesQuery extends BranchArg {
  customerId: string;
}

export const customerNotesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /customer-notes?customerId=...
    listCustomerNotes: build.query<CustomerNote[], ListCustomerNotesQuery>({
      query: ({ customerId, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const qs = new URLSearchParams({ customerId }).toString();
        return { url: `/customer-notes?${qs}`, headers };
      },
      providesTags: (result, _err, { customerId }) =>
        result
          ? [
              ...result.map((n) => ({ type: "CustomerNotes" as const, id: n.id })),
              { type: "CustomerNotes", id: `LIST-${customerId}` },
            ]
          : [{ type: "CustomerNotes", id: `LIST-${customerId}` }],
    }),

    // POST /customer-notes
    createCustomerNote: build.mutation<
      CustomerNote,
      { data: CreateCustomerNoteDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return {
          url: "/customer-notes",
          method: "POST",
          body: data,
          headers,
        };
      },
      invalidatesTags: (_res, _err, { data }) => [
        { type: "CustomerNotes", id: `LIST-${data.customerId}` },
      ],
    }),

    // DELETE /customer-notes/:id
    deleteCustomerNote: build.mutation<
      { id: string },
      { id: string; customerId: string } & BranchArg
    >({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/customer-notes/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id, customerId }) => [
        { type: "CustomerNotes", id },
        { type: "CustomerNotes", id: `LIST-${customerId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomerNotesQuery,
  useCreateCustomerNoteMutation,
  useDeleteCustomerNoteMutation,
} = customerNotesApi;
