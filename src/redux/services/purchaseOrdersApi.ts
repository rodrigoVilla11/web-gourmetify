import { baseApi } from "./baseApi";
import { inventoryApi } from "./inventoryApi";

/** ===== Enums según tu DTO ===== */
export type PurchaseOrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "RECEIVED"
  | "CANCELLED"
  | string;

/** ===== Entidades relacionadas que vienen en list/include ===== */
export interface SupplierRef {
  id: string;
  name: string;
  defaultPaymentTerm?: string | null;
}

export interface IngredientRef {
  id: string;
  name: string;
  unit: string; // UnitType
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  ingredientId: string;
  qty: number;        // Decimal -> number
  unitPrice: number;  // Decimal -> number
  subtotal: number;   // Decimal -> number
  ingredient?: IngredientRef; // include
}

/** ===== PO principal ===== */
export interface PurchaseOrder {
  id: string;
  supplierId: string;
  branchId: string;
  status: PurchaseOrderStatus;
  date: string;          // ISO
  total: number;         // Decimal -> number
  paymentTerm?: string | null;
  createdBy: string;     // userId
  createdAt: string;
  updatedAt: string;
  supplier?: SupplierRef;
  items?: PurchaseOrderItem[];
}

/** ===== DTOs del controller ===== */
export interface CreatePurchaseOrderDto {
  supplierId: string;
  date: string;        // ISO o YYYY-MM-DD
  createdBy: string;   // userId (el service valida que exista)
}

export interface AddPOItemDto {
  purchaseOrderId: string;
  ingredientId: string;
  qty: number;
  unitPrice: number;
}

export interface SetPOStatusDto {
  status: PurchaseOrderStatus; // RECEIVED dispara ingreso de stock + update supplier prices
}

/** Header override puntual por request */
export type BranchArg = { branchId?: string };

export const purchaseOrdersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /purchase-orders (include: supplier, items.ingredient)
    listPurchaseOrders: build.query<PurchaseOrder[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/purchase-orders", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((po) => ({ type: "PurchaseOrders" as const, id: po.id })),
              { type: "PurchaseOrders", id: "LIST" },
            ]
          : [{ type: "PurchaseOrders", id: "LIST" }],
    }),

    // POST /purchase-orders
    createPurchaseOrder: build.mutation<
      PurchaseOrder,
      { data: CreatePurchaseOrderDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/purchase-orders", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "PurchaseOrders", id: "LIST" }],
    }),

    // POST /purchase-orders/add-item
    addPurchaseOrderItem: build.mutation<
      PurchaseOrder, // tu service devuelve la PO con items y total recalculado
      { data: AddPOItemDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/purchase-orders/add-item", method: "POST", body: data, headers };
      },
      invalidatesTags: (_res, _err, { data }) => [
        { type: "PurchaseOrders", id: data.purchaseOrderId },
        { type: "PurchaseOrders", id: "LIST" },
      ],
    }),

    // PATCH /purchase-orders/:id/status
    setPurchaseOrderStatus: build.mutation<
      PurchaseOrder,
      { id: string; data: SetPOStatusDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/purchase-orders/${id}/status`, method: "PATCH", body: data, headers };
      },
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        try {
          const { data: po } = await queryFulfilled;
          // Si la PO pasó a RECEIVED, refrescamos inventario (entraron insumos)
          if (data.status === "RECEIVED") {
            dispatch(inventoryApi.util.invalidateTags([{ type: "Inventory", id: "LIST" }]));
          }
          // Invalida lista y detalle de la PO
          dispatch(
            purchaseOrdersApi.util.invalidateTags([
              { type: "PurchaseOrders", id },
              { type: "PurchaseOrders", id: "LIST" },
            ])
          );
        } catch {
          /* noop */
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useAddPurchaseOrderItemMutation,
  useSetPurchaseOrderStatusMutation,
} = purchaseOrdersApi;
