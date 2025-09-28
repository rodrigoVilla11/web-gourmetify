import { baseApi } from "./baseApi";
import { dailyReportsApi } from "./dailyReportsApi";
// import { accountsApi } from "./accountsApi"; // <- si mostrás saldos por cuenta, descomentá para invalidar

/** ===== Modelos ===== */
export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;      // Prisma.Decimal -> number
  date: string;        // ISO
  description: string | null;
  userId: string;
  createdAt: string;   // ISO
}

/** ===== DTOs ===== */
export interface CreateTransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;        // > 0
  date: string;          // ISO
  description?: string | null;
  userId: string;
}

/** Header override por request */
export type BranchArg = { branchId?: string };

export const transfersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /transfers?from=...&to=... */
    listTransfers: build.query<
      AccountTransfer[],
      { from: string; to: string } & BranchArg
    >({
      query: ({ from, to, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const qs = new URLSearchParams({ from, to }).toString();
        return { url: `/transfers?${qs}`, headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "Transfers" as const, id: t.id })),
              { type: "Transfers", id: "LIST" },
            ]
          : [{ type: "Transfers", id: "LIST" }],
    }),

    /** POST /transfers */
    createTransfer: build.mutation<
      AccountTransfer,
      { data: CreateTransferDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/transfers", method: "POST", body: data, headers };
      },
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;

          // Refrescar listados que dependen del reporte diario (el service los actualiza)
          dispatch(
            dailyReportsApi.util.invalidateTags([
              { type: "DailyReports", id: "LIST" },
              { type: "DailyReports", id: "SUMMARY" },
            ])
          );

          // (Opcional) si tenés un slice de cuentas con saldo actual:
          // dispatch(
          //   accountsApi.util.invalidateTags([
          //     { type: "Accounts", id: created.fromAccountId },
          //     { type: "Accounts", id: created.toAccountId },
          //     { type: "Accounts", id: "LIST" },
          //   ])
          // );

          // Refrescar lista de transfers
          dispatch(
            transfersApi.util.invalidateTags([
              { type: "Transfers", id: "LIST" },
            ])
          );
        } catch {/* noop */}
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useListTransfersQuery,
  useCreateTransferMutation,
} = transfersApi;
