import { baseApi } from "./baseApi";
import { ordersApi } from "./ordersApi";

/** === DTOs del controller === */
export interface CreateOrderItemDto {
  orderId: string;
  productId: string;
  qty: number; // entero/decimal según tu modelo de venta
}

/** === Item que retorna el backend al crear === */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  unitPrice: number; // Decimal -> number
  discount: number;  // Decimal -> number
  subtotal: number;  // Decimal -> number
  createdAt: string; // ISO
}

/** Para override puntual del header por request */
export type BranchArg = { branchId?: string };

export const orderItemsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // POST /order-items
    addOrderItem: build.mutation<OrderItem, { data: CreateOrderItemDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/order-items", method: "POST", body: data, headers };
      },
      // Refrescamos lista y detalle de la orden
      async onQueryStarted({ data }, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          // invalidación selectiva para que la UI quede consistente
          dispatch(
            ordersApi.util.invalidateTags([
              { type: "Orders", id: created.orderId },
              { type: "Orders", id: "LIST" },
            ])
          );
        } catch {
          // noop
        }
      },
    }),

    // DELETE /order-items/:id
    removeOrderItem: build.mutation<{ ok: true }, { id: string; orderId: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/order-items/${id}`, method: "DELETE", headers };
      },
      async onQueryStarted({ orderId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            ordersApi.util.invalidateTags([
              { type: "Orders", id: orderId },
              { type: "Orders", id: "LIST" },
            ])
          );
        } catch {
          // noop
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddOrderItemMutation,
  useRemoveOrderItemMutation,
} = orderItemsApi;
