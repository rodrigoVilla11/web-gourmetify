import { baseApi } from "./baseApi";

/** === Tipos compartidos === */
export type UnitType =
  | "UNIT"
  | "GRAM"
  | "KILOGRAM"
  | "LITER"
  | "MILLILITER"
  | "PACK"
  | string;

/** === Entidades === */
export interface RecipeItem {
  id: string;
  recipeId: string;
  ingredientId: string;
  qtyPerUnit: number;   // Decimal -> number
  unit: UnitType;
}

export interface Recipe {
  id: string;
  productId: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items: RecipeItem[];
}

/** === DTOs controller/service === */
export interface UpsertRecipeItemDto {
  ingredientId: string;
  unit: UnitType | string;     // backend valida/matchea unidad
  qtyPerUnit: number;          // > 0
}

export interface UpsertRecipeDto {
  productId: string;           // debe pertenecer al branch
  items: UpsertRecipeItemDto[]; // reemplaza el set completo
}

/** Header override por request */
export type BranchArg = { branchId?: string };

export const recipesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /recipes?productId=... */
    getRecipeByProduct: build.query<Recipe | null, { productId: string } & BranchArg>({
      query: ({ productId, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const qs = new URLSearchParams({ productId }).toString();
        return { url: `/recipes?${qs}`, headers };
      },
      providesTags: (_res, _err, { productId }) => [
        { type: "Recipes" as const, id: `PROD-${productId}` },
      ],
    }),

    /** POST /recipes/upsert */
    upsertRecipe: build.mutation<Recipe, { data: UpsertRecipeDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/recipes/upsert", method: "POST", body: data, headers };
      },
      invalidatesTags: (_res, _err, { data }) => [
        { type: "Recipes", id: `PROD-${data.productId}` },
        // Si mostrás recipe dentro de listProducts, descomenta para refrescar UI:
        // { type: "Products", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRecipeByProductQuery,
  useUpsertRecipeMutation,
} = recipesApi;
