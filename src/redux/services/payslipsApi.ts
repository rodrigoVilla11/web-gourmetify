import { baseApi } from "./baseApi";

/** Estado posible (por ahora tu service crea en DRAFT) */
export type PayslipStatus = "DRAFT" | "APPROVED" | "PAID" | string;

/** Lo que devuelve el backend al generar */
export interface EmployeePayslip {
  id: string;
  employeeId: string;
  branchId: string;
  periodMonth: number;  // 1..12
  periodYear: number;   // YYYY
  baseHours: number;    // Decimal -> number
  basePay: number;      // Decimal -> number
  bonusesTotal: number; // Decimal -> number
  tipsTotal: number;    // Decimal -> number
  advancesTotal: number;// Decimal -> number
  finalAmount: number;  // Decimal -> number
  status: PayslipStatus; // "DRAFT" al crearse
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
}

/** DTO: /payslips/generate */
export interface GeneratePayslipDto {
  employeeId: string;
  periodMonth: number; // 1..12
  periodYear: number;  // YYYY
}

/** Para override puntual del header si hiciera falta en futuros endpoints */
export type BranchArg = { branchId?: string };

export const payslipsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // POST /payslips/generate
    generatePayslip: build.mutation<EmployeePayslip, { data: GeneratePayslipDto }>({
      query: ({ data }) => ({
        url: "/payslips/generate",
        method: "POST",
        body: data,
      }),
      // si luego agregás listados, acá podrías invalidar: [{ type: "Payslips", id: "LIST" }]
    }),
  }),
  overrideExisting: false,
});

export const { useGeneratePayslipMutation } = payslipsApi;
