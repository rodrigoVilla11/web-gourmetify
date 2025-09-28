import { baseApi } from "./baseApi";

/** Reutilizá los mismos enums que en ingredientsApi si ya los definiste */
export type UnitType =
  | "UNIT"
  | "GRAM"
  | "KILOGRAM"
  | "LITER"
  | "MILLILITER"
  | "PACK"
  | string;

export type IngredientKind = "RAW" | "PREPARED" | string;

/** ==== Entidades del backend (incluye relations) ==== */
export interface Ingredient {
  id: string;
  branchId: string;
  name: string;
  unit: UnitType;
  kind: IngredientKind;
  wastePct?: number;
}

export interface IngredientRecipeItem {
  id: string;
  ingredientRecipeId: string;
  ingredientId: string;
  qtyPerUnit: number; // Prisma.Decimal -> number
  unit: UnitType;
  ingredient: Ingredient; // include: { ingredient: true }
}

export interface IngredientRecipe {
  id: string;
  preparedIngredientId: string;
  notes: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  preparedIngredient: Ingredient;           // include
  items: IngredientRecipeItem[];            // include
}

/** ==== DTOs según tu controller/service ==== */
export interface UpsertIngredientRecipeItemDto {
  ingredientId: string;
  /** Debe coincidir con la unidad del ingrediente */
  unit: UnitType | string;
  /** Cantidad por unidad del preparado (debe ser > 0) */
  qtyPerUnit: number;
}
export interface UpsertIngredientRecipeDto {
  preparedIngredientId: string;   // debe ser kind PREPARED
  notes?: string | null;
  items: UpsertIngredientRecipeItemDto[]; // reemplaza todo el set
}

/** Para override puntual de sucursal por request */
export type BranchArg = { branchId?: string };

/** ==== API ==== */
export const ingredientRecipesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /ingredient-recipes?preparedIngredientId=... */
    getRecipeByPreparedIngredient: build.query<
      IngredientRecipe | null,
      { preparedIngredientId: string } & BranchArg
    >({
      query: ({ preparedIngredientId, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const qs = new URLSearchParams({ preparedIngredientId }).toString();
        return { url: `/ingredient-recipes?${qs}`, headers };
      },
      providesTags: (res, _err, { preparedIngredientId }) => [
        { type: "IngredientRecipes" as const, id: `PREP-${preparedIngredientId}` },
      ],
    }),

    /** GET /ingredient-recipes/by-branch */
    listRecipesByBranch: build.query<IngredientRecipe[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/ingredient-recipes/by-branch", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({
                type: "IngredientRecipes" as const,
                id: r.id,
              })),
              { type: "IngredientRecipes", id: "LIST" },
            ]
          : [{ type: "IngredientRecipes", id: "LIST" }],
    }),

    /** POST /ingredient-recipes/upsert */
    upsertIngredientRecipe: build.mutation<
      IngredientRecipe,
      { data: UpsertIngredientRecipeDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return {
          url: "/ingredient-recipes/upsert",
          method: "POST",
          body: data,
          headers,
        };
      },
      // invalidamos la receta específica y el listado por branch
      invalidatesTags: (_res, _err, { data }) => [
        { type: "IngredientRecipes", id: "LIST" },
        { type: "IngredientRecipes", id: `PREP-${data.preparedIngredientId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRecipeByPreparedIngredientQuery,
  useListRecipesByBranchQuery,
  useUpsertIngredientRecipeMutation,
} = ingredientRecipesApi;
