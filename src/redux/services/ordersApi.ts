import { baseApi } from "./baseApi";

/** ===== Enums según tu backend ===== */
export type OrderChannel = "TAKEAWAY" | "DELIVERY" | "DINE_IN" | string;
export type OrderStatus  = "OPEN" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | string;
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | string;

/** ===== Entidades relacionadas incluidas en list/detail ===== */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  price: number;        // Decimal -> number
  discount: number;     // Decimal -> number
  total: number;        // Decimal -> number
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
  };
}

export interface OrderPayment {
  id: string;
  orderId: string;
  accountId: string;
  amount: number;       // Decimal -> number
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface CustomerAddress {
  id: string;
  label?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

/** ===== Modelo Order que devuelve list/detail ===== */
export interface Order {
  id: string;
  branchId: string;
  cashierId: string;
  customerId: string | null;
  channel: OrderChannel;
  addressId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string | null;
  deliveryNotes: string | null;
  subtotal: number;       // Decimal -> number
  discountTotal: number;  // Decimal -> number
  total: number;          // Decimal -> number
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  payments?: OrderPayment[];
  customer?: Customer | null;
  address?: CustomerAddress | null;
}

/** ===== DTOs ===== */
export interface CreateOrderDto {
  cashierId: string;
  customerId?: string | null;
  channel: OrderChannel;
  addressId?: string | null;     // obligatorio si channel === DELIVERY
  customerName?: string | null;
  deliveryNotes?: string | null;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;          // si pasa a DELIVERED dispara consumos/costos
}

/** Header override puntual */
export type BranchArg = { branchId?: string };

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /orders
    listOrders: build.query<Order[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/orders", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((o) => ({ type: "Orders" as const, id: o.id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),

    // GET /orders/:id
    getOrderById: build.query<Order, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/orders/${id}`, headers };
      },
      providesTags: (_res, _err, { id }) => [{ type: "Orders", id }],
    }),

    // POST /orders
    createOrder: build.mutation<Order, { data: CreateOrderDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/orders", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),

    // PATCH /orders/:id/status
    setOrderStatus: build.mutation<
      Order,
      { id: string; data: UpdateOrderStatusDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/orders/${id}/status`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Orders", id },
        { type: "Orders", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useSetOrderStatusMutation,
} = ordersApi;
