import { baseApi } from "./baseApi";
import { inventoryApi } from "./inventoryApi"; // para invalidar inventario tras el batch

/** ===== Tipos relacionados que devuelve tu include ===== */
export type UnitType =
  | "UNIT"
  | "GRAM"
  | "KILOGRAM"
  | "LITER"
  | "MILLILITER"
  | "PACK"
  | string;

export interface Ingredient {
  id: string;
  branchId: string;
  name: string;
  unit: UnitType;
  kind: "RAW" | "PREPARED" | string;
}

export interface RecipePrepared {
  id: string;
  branchId: string;
  name: string;
  unit: UnitType;
  kind: "PREPARED";
}

export interface IngredientRecipeRef {
  id: string;
  preparedIngredientId: string;
  preparedIngredient: RecipePrepared;
}

export interface ProductionBatchConsumption {
  id: string;
  productionBatchId: string;
  ingredientId: string;
  qtyUsed: number;   // Decimal -> number
  unit: UnitType;
  cost: number;      // costo unitario usado para el insumo
  ingredient?: Ingredient; // include: { ingredient: true }
}

/** ===== Modelo del batch que devuelve el service ===== */
export interface ProductionBatch {
  id: string;
  ingredientRecipeId: string;
  branchId: string;
  outputQty: number;     // Decimal -> number
  unit: UnitType;
  producedAt: string;    // ISO
  createdBy: string;     // userId
  totalInputCost: number; // Decimal -> number (suma de (qtyUsed * unitCost) por insumo)
  unitCost: number;       // totalInputCost / outputQty
  ingredientRecipe: IngredientRecipeRef;
  consumptions: ProductionBatchConsumption[];
}

/** ===== DTO de entrada ===== */
export interface CreateProductionBatchDto {
  ingredientRecipeId: string;
  outputQty: number;         // cantidad producida en unidad del preparado
  producedAt?: string;       // ISO opcional
  createdByUserId: string;
}

/** Header override opcional */
export type BranchArg = { branchId?: string };

export const productionBatchesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** POST /production-batches  (createCompleted) */
    createProductionBatch: build.mutation<
      ProductionBatch,
      { data: CreateProductionBatchDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return {
          url: "/production-batches",
          method: "POST",
          body: data,
          headers,
        };
      },
      // Al producir, se descuenta stock de insumos y se incrementa stock del preparado.
      async onQueryStarted({ branchId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Refrescar inventario (lista completa). Si manejás per-ingrediente, podés invalidar ids específicos.
          dispatch(inventoryApi.util.invalidateTags([{ type: "Inventory", id: "LIST" }]));
        } catch {
          /* noop */
        }
      },
      invalidatesTags: [{ type: "ProductionBatches", id: "LIST" }],
    }),

    /** (Opcional) GET /production-batches (si más adelante lo agregás) */
    // listProductionBatches: build.query<ProductionBatch[], BranchArg | void>({
    //   query: (arg) => {
    //     const headers: Record<string, string> = {};
    //     const branchId = (arg as BranchArg | undefined)?.branchId;
    //     if (branchId) headers["x-branch-id"] = branchId;
    //     return { url: "/production-batches", headers };
    //   },
    //   providesTags: (result) =>
    //     result
    //       ? [
    //           ...result.map((b) => ({ type: "ProductionBatches" as const, id: b.id })),
    //           { type: "ProductionBatches", id: "LIST" },
    //         ]
    //       : [{ type: "ProductionBatches", id: "LIST" }],
    // }),
  }),
  overrideExisting: false,
});

export const {
  useCreateProductionBatchMutation,
  // useListProductionBatchesQuery,
} = productionBatchesApi;
