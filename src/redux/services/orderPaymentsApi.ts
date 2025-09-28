import { baseApi } from "./baseApi";
import { ordersApi } from "./ordersApi";
import { dailyReportsApi } from "./dailyReportsApi";
import { movementsApi } from "./movementsApi";

/** ===== Entidades / DTOs ===== */
export interface OrderPayment {
  id: string;
  orderId: string;
  accountId: string;
  amount: number;     // Decimal -> number
  note: string | null;
  createdAt: string;  // ISO
  updatedAt?: string; // si el modelo lo tuviera
}

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | string;

export interface CreateOrderPaymentDto {
  orderId: string;
  accountId: string;
  amount: number;     // > 0
  note?: string | null;
}

/** Respuesta del POST según tu service */
export interface CreateOrderPaymentResponse {
  pay: OrderPayment;
  movement: {
    id: string;
    accountId: string;
    amount: number;
    type: "SALE" | string;
    date: string;
    description: string | null;
  };
  paymentStatus: PaymentStatus;
}

/** Para override puntual del header por request */
export type BranchArg = { branchId?: string };

/** ===== API ===== */
export const orderPaymentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /order-payments?orderId=...
    listOrderPayments: build.query<OrderPayment[], { orderId: string } & BranchArg>({
      query: ({ orderId, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const qs = new URLSearchParams({ orderId }).toString();
        return { url: `/order-payments?${qs}`, headers };
      },
      providesTags: (result, _err, { orderId }) =>
        result
          ? [
              ...result.map((p) => ({ type: "OrderPayments" as const, id: p.id })),
              { type: "OrderPayments", id: `LIST-${orderId}` },
            ]
          : [{ type: "OrderPayments", id: `LIST-${orderId}` }],
    }),

    // POST /order-payments
    createOrderPayment: build.mutation<
      CreateOrderPaymentResponse,
      { data: CreateOrderPaymentDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/order-payments", method: "POST", body: data, headers };
      },
      // Refrescamos órdenes, pagos de la orden y resúmenes financieros
      async onQueryStarted({ data }, { dispatch, queryFulfilled }) {
        try {
          const { data: res } = await queryFulfilled;

          // 1) refrescar pagos de la orden
          dispatch(
            orderPaymentsApi.util.invalidateTags([
              { type: "OrderPayments", id: `LIST-${data.orderId}` },
            ])
          );

          // 2) refrescar detalle y listado de órdenes (paymentStatus/total se actualiza)
          dispatch(
            ordersApi.util.invalidateTags([
              { type: "Orders", id: data.orderId },
              { type: "Orders", id: "LIST" },
            ])
          );

          // 3) refrescar dashboards: DailyReports (LIST + SUMMARY) y Movements LIST
          dispatch(
            dailyReportsApi.util.invalidateTags([
              { type: "DailyReports", id: "LIST" },
              { type: "DailyReports", id: "SUMMARY" },
            ])
          );
          dispatch(
            movementsApi.util.invalidateTags([{ type: "Movements", id: "LIST" }])
          );

          // (Opcional) podrías también invalidar balances de cuentas si tenés ese slice.
        } catch {
          // noop
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useListOrderPaymentsQuery,
  useCreateOrderPaymentMutation,
} = orderPaymentsApi;
