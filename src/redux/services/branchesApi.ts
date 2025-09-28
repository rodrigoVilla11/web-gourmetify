import { baseApi } from "./baseApi";

export type Branch = {
  id: string;
  tenantId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBranchDto = {
  name: string;
  address?: string;
  phone?: string;
};

export type UpdateBranchDto = Partial<CreateBranchDto>;

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /branches
    getBranches: build.query<Branch[], void>({
      query: () => "/branches",
      providesTags: (result) =>
        result
          ? [
              ...result.map((b) => ({ type: "Branches" as const, id: b.id })),
              { type: "Branches", id: "LIST" },
            ]
          : [{ type: "Branches", id: "LIST" }],
    }),

    // GET /branches/:id
    getBranchById: build.query<Branch, string>({
      query: (id) => `/branches/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Branches", id }],
    }),

    // POST /branches
    createBranch: build.mutation<Branch, CreateBranchDto>({
      query: (body) => ({
        url: "/branches",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Branches", id: "LIST" }],
    }),

    // PATCH /branches/:id
    updateBranch: build.mutation<Branch, { id: string; data: UpdateBranchDto }>({
      query: ({ id, data }) => ({
        url: `/branches/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Branches", id },
        { type: "Branches", id: "LIST" },
      ],
    }),

    // DELETE /branches/:id
    deleteBranch: build.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/branches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Branches", id },
        { type: "Branches", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
  // Agregá el tag "Branches" en baseApi.tagTypes si aún no está
});

export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchesApi;
