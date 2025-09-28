import { baseApi } from "./baseApi";

/** Tipos auxiliares */
export type AccountType = "CASH" | "BANK" | "MP" | string;
export type CategoryType = "INCOME" | "EXPENSE" | "PRODUCT" | string;

/** Row que devuelve /daily-reports con includes */
export interface DailyReportRow {
  id: string;
  branchId: string;
  date: string;            // ISO
  accountId: string;
  categoryId: string | null;
  totalIncome: number;     // suma del día por cuenta/categoría
  totalExpense: number;
  netTotal: number;        // income - expense
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  account: { id: string; name: string; type: AccountType };
  category: { id: string; name: string; type: CategoryType } | null;
}

/** Resumen que devuelve /daily-reports/summary */
export interface DailyReportSummary {
  totalIncome: number;
  totalExpense: number;
  netTotal: number;
}

/** Filtros de query */
export interface DailyReportsFilters {
  accountId?: string;
  /**
   * categoryId especial:
   *  - string normal = filtra por categoría
   *  - "null" = categorías NULL (sin categoría)
   *  - undefined = no filtra por categoría
   */
  categoryId?: string; // usar literal "null" para null real
  from?: string; // ISO o YYYY-MM-DD
  to?: string;   // ISO o YYYY-MM-DD
}

/** Para override puntual de sucursal */
export type BranchArg = { branchId?: string };

/** Query combinada */
export type DailyReportsQuery = DailyReportsFilters & BranchArg;

/** Helper para QS ordenado */
const toQueryString = (q: Record<string, string | undefined>) =>
  Object.entries(q)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

export const dailyReportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /daily-reports
    listDailyReports: build.query<DailyReportRow[], DailyReportsQuery | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const q = (arg ?? {}) as DailyReportsQuery;
        if (q.branchId) headers["x-branch-id"] = q.branchId;
        const qs = toQueryString({
          accountId: q.accountId,
          categoryId: q.categoryId, // "null" para null real
          from: q.from,
          to: q.to,
        });
        return { url: `/daily-reports${qs ? `?${qs}` : ""}`, headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: "DailyReports" as const, id: r.id })),
              { type: "DailyReports", id: "LIST" },
            ]
          : [{ type: "DailyReports", id: "LIST" }],
    }),

    // GET /daily-reports/summary
    getDailyReportsSummary: build.query<DailyReportSummary, DailyReportsQuery | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const q = (arg ?? {}) as DailyReportsQuery;
        if (q.branchId) headers["x-branch-id"] = q.branchId;
        const qs = toQueryString({
          accountId: q.accountId,
          categoryId: q.categoryId,
          from: q.from,
          to: q.to,
        });
        return { url: `/daily-reports/summary${qs ? `?${qs}` : ""}`, headers };
      },
      providesTags: (_res) => [{ type: "DailyReports", id: "SUMMARY" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListDailyReportsQuery,
  useGetDailyReportsSummaryQuery,
} = dailyReportsApi;
