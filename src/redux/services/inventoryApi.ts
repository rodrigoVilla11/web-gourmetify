import { baseApi } from "./baseApi";
import type { UnitType, IngredientKind } from "./ingredientsApi"; // si no lo tenés, copiá los tipos

/** Relaciones que trae list(): include { ingredient: true } */
export interface IngredientRef {
  id: string;
  branchId: string;
  name: string;
  unit: UnitType;
  kind: IngredientKind;
  wastePct?: number;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  ingredientId: string;
  unit: UnitType;
  qty: number;     // Decimal -> number
  minQty: number;  // Decimal -> number
  createdAt: string; // ISO
  updatedAt: string; // ISO
  ingredient: IngredientRef;
}

/** DTO del PATCH /inventory/adjust */
export interface AdjustInventoryDto {
  ingredientId: string;
  deltaQty: number;         // puede ser negativo/positivo (no puede dejar qty < 0)
  minQty?: number | null;   // opcional
}

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /inventory
    listInventory: build.query<InventoryItem[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/inventory", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((it) => ({ type: "Inventory" as const, id: it.ingredientId })),
              { type: "Inventory", id: "LIST" },
            ]
          : [{ type: "Inventory", id: "LIST" }],
    }),

    // PATCH /inventory/adjust
    adjustInventory: build.mutation<
      InventoryItem,
      { data: AdjustInventoryDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/inventory/adjust", method: "PATCH", body: data, headers };
      },
      // Optimistic update sobre listInventory
      async onQueryStarted({ data, branchId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          inventoryApi.util.updateQueryData("listInventory", branchId ? { branchId } : undefined, (draft) => {
            const row = draft.find((r) => r.ingredientId === data.ingredientId);
            if (!row) return;
            const nextQty = (row.qty ?? 0) + data.deltaQty;
            // reflejo visual inmediato (el backend validará no-negativo)
            row.qty = nextQty;
            if (data.minQty !== undefined && data.minQty !== null) {
              row.minQty = data.minQty;
            }
            row.updatedAt = new Date().toISOString();
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_res, _err, { data }) => [
        { type: "Inventory", id: data.ingredientId },
        { type: "Inventory", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListInventoryQuery,
  useAdjustInventoryMutation,
} = inventoryApi;
