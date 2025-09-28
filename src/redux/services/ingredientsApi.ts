import { baseApi } from "./baseApi";

/** Enums del backend (el service normaliza a UPPERCASE) */
export type UnitType =
  | "UNIT"
  | "GRAM"
  | "KILOGRAM"
  | "LITER"
  | "MILLILITER"
  | "PACK"
  | string;

export type IngredientKind = "RAW" | "PREPARED" | string;

/** Inventory embebido en list */
export interface InventoryItem {
  id: string;
  branchId: string;
  ingredientId: string;
  unit: UnitType;
  qty: number;     // Decimal -> number
  minQty: number;  // Decimal -> number
  createdAt: string;
  updatedAt: string;
}

/** Modelo del ingrediente */
export interface Ingredient {
  id: string;
  branchId: string;
  name: string;
  unit: UnitType;
  kind: IngredientKind;
  wastePct: number; // Decimal -> number
  createdAt?: string;
  updatedAt?: string;
  /** Presente en list() por include */
  inventoryItem?: InventoryItem | null;
}

/** DTOs según controller/service */
export interface CreateIngredientDto {
  name: string;
  unit: UnitType | string;  // se acepta string y el backend normaliza
  kind: IngredientKind | string;
  wastePct?: number;        // 0..100 o proporción, según tu modelo
}

export type UpdateIngredientDto = Partial<CreateIngredientDto>;

/** Override opcional por request */
export type BranchArg = { branchId?: string };

export const ingredientsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /ingredients  (include: inventoryItem)
    listIngredients: build.query<Ingredient[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/ingredients", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "Ingredients" as const, id: i.id })),
              { type: "Ingredients", id: "LIST" },
            ]
          : [{ type: "Ingredients", id: "LIST" }],
    }),

    // POST /ingredients
    createIngredient: build.mutation<Ingredient, { data: CreateIngredientDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/ingredients", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "Ingredients", id: "LIST" }],
    }),

    // PATCH /ingredients/:id
    updateIngredient: build.mutation<
      Ingredient,
      { id: string; data: UpdateIngredientDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/ingredients/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Ingredients", id },
        { type: "Ingredients", id: "LIST" },
      ],
    }),

    // DELETE /ingredients/:id
    deleteIngredient: build.mutation<{ id: string }, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/ingredients/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Ingredients", id },
        { type: "Ingredients", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
} = ingredientsApi;
