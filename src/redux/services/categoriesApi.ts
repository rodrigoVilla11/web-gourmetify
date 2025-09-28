import { baseApi } from "./baseApi";

/** Ajustá si tu backend usa un enum estricto */
export type CategoryType = "INCOME" | "EXPENSE" | "PRODUCT" | string;

export interface Category {
  id: string;
  branchId: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  parentId?: string | null;
  isActive?: boolean;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

/** Para forzar sucursal puntual en una request */
export type BranchArg = { branchId?: string };

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /categories
    listCategories: build.query<Category[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/categories", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Categories" as const, id: c.id })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),

    // GET /categories/:id
    getCategoryById: build.query<Category, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/categories/${id}`, headers };
      },
      providesTags: (_res, _err, { id }) => [{ type: "Categories", id }],
    }),

    // POST /categories
    createCategory: build.mutation<Category, { data: CreateCategoryDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/categories", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),

    // PATCH /categories/:id
    updateCategory: build.mutation<
      Category,
      { id: string; data: UpdateCategoryDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/categories/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),

    // DELETE /categories/:id
    deleteCategory: build.mutation<{ id: string }, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/categories/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export function buildCategoryTree(rows: Category[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));

  const roots: CategoryNode[] = [];
  rows.forEach((r) => {
    const node = byId.get(r.id)!;
    if (r.parentId && byId.has(r.parentId)) {
      byId.get(r.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
