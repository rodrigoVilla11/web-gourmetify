import { baseApi } from "./baseApi";

/** ====== Relacionadas ====== */
export interface ProductCategoryRef {
  id: string;
  branchId: string;
  name: string;
  position?: number | null;
  isActive?: boolean | null;
}

export interface ProductRecipeItem {
  id: string;
  ingredientRecipeId: string | null;
  ingredientId: string;
  qtyPerUnit: number;     // Decimal -> number
  unit: string;          // enum en backend, string acá
}

export interface ProductRecipe {
  id: string;
  productId: string;
  items: ProductRecipeItem[];
}

/** ====== Producto ====== */
export interface Product {
  id: string;
  branchId: string;
  categoryId: string;
  name: string;
  sku: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  status: "ACTIVE" | "INACTIVE" | string;
  price: number;                // Prisma.Decimal -> number
  createdAt: string;
  updatedAt: string;
  category?: ProductCategoryRef;
  recipe?: ProductRecipe | null;
}

/** ====== DTOs controller/service ====== */
export interface CreateProductDto {
  categoryId: string;
  name: string;
  price: number;                // > 0 (Decimal en DB)
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export type UpdateProductDto = Partial<CreateProductDto> & {
  // el service soporta cambiar categoryId, price, flags, etc.
};

/** Header override puntual */
export type BranchArg = { branchId?: string };

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /products (include: category, recipe.items)
    listProducts: build.query<Product[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/products", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Products" as const, id: p.id })),
              { type: "Products", id: "LIST" },
            ]
          : [{ type: "Products", id: "LIST" }],
    }),

    // POST /products
    createProduct: build.mutation<Product, { data: CreateProductDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/products", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    // PATCH /products/:id
    updateProduct: build.mutation<
      Product,
      { id: string; data: UpdateProductDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/products/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Products", id },
        { type: "Products", id: "LIST" },
      ],
    }),

    // DELETE /products/:id
    deleteProduct: build.mutation<{ id: string }, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/products/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Products", id },
        { type: "Products", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
