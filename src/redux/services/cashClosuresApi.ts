import { baseApi } from "./baseApi";

/** Ajustá si tenés enums estrictos en el backend */
export type MovementType =
  | "SALE"
  | "INCOME_OTHER"
  | "TRANSFER_IN"
  | "SUPPLIER_PAYMENT"
  | "EXPENSE_GENERAL"
  | "TRANSFER_OUT"
  | "ADJUSTMENT"
  | string;

export interface CashClosure {
  id: string;
  branchId: string;
  accountId: string;
  userId: string;
  /** Día cerrado (00:00 UTC del día) */
  date: string; // ISO
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number; // esperado
  realBalance: number;    // contado real
  difference: number;     // real - esperado
  createdAt: string; // ISO
}

export interface CreateCashClosureDto {
  accountId: string;
  userId: string;
  /** Fecha del cierre (YYYY-MM-DD o ISO). El backend la normaliza a 00:00 UTC */
  date: string;
  openingBalance: number;
  realBalance: number;
}

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

/** Parámetros del GET /cash-closures */
export interface ListCashClosuresQuery extends BranchArg {
  accountId: string;
  from: string; // ISO/fecha
  to: string;   // ISO/fecha (exclusivo en backend)
}

export const cashClosuresApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /cash-closures?accountId=...&from=...&to=...
    listCashClosures: build.query<CashClosure[], ListCashClosuresQuery>({
      query: (arg) => {
        const { accountId, from, to, branchId } = arg;
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const params = new URLSearchParams({
          accountId,
          from,
          to,
        }).toString();
        return { url: `/cash-closures?${params}`, headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "CashClosures" as const, id: c.id })),
              { type: "CashClosures", id: "LIST" },
            ]
          : [{ type: "CashClosures", id: "LIST" }],
    }),

    // POST /cash-closures
    createCashClosure: build.mutation<CashClosure, { data: CreateCashClosureDto } & BranchArg>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        if (arg.branchId) headers["x-branch-id"] = arg.branchId;
        return {
          url: "/cash-closures",
          method: "POST",
          body: arg.data,
          headers,
        };
      },
      invalidatesTags: [{ type: "CashClosures", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCashClosuresQuery,
  useCreateCashClosureMutation,
} = cashClosuresApi;
