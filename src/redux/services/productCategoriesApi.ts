import { baseApi } from "./baseApi";

/** Modelo que devuelve tu backend */
export interface ProductCategory {
  id: string;
  branchId: string;
  name: string;
  position?: number | null;
  isActive?: boolean | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** DTOs (el service hace { ...dto }) */
export interface CreateProductCategoryDto {
  name: string;
  position?: number | null;
  isActive?: boolean | null;
}

export type UpdateProductCategoryDto = Partial<CreateProductCategoryDto>;

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

export const productCategoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /product-categories
    listProductCategories: build.query<ProductCategory[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/product-categories", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "ProductCategories" as const, id: c.id })),
              { type: "ProductCategories", id: "LIST" },
            ]
          : [{ type: "ProductCategories", id: "LIST" }],
    }),

    // POST /product-categories
    createProductCategory: build.mutation<
      ProductCategory,
      { data: CreateProductCategoryDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/product-categories", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "ProductCategories", id: "LIST" }],
    }),

    // PATCH /product-categories/:id
    updateProductCategory: build.mutation<
      ProductCategory,
      { id: string; data: UpdateProductCategoryDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/product-categories/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "ProductCategories", id },
        { type: "ProductCategories", id: "LIST" },
      ],
    }),

    // DELETE /product-categories/:id
    deleteProductCategory: build.mutation<
      { id: string },
      { id: string } & BranchArg
    >({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/product-categories/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "ProductCategories", id },
        { type: "ProductCategories", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProductCategoriesQuery,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  useDeleteProductCategoryMutation,
} = productCategoriesApi;
