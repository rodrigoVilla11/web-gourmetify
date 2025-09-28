import { baseApi } from "./baseApi";

/** Si tenés el enum en Prisma, podés tiparlo así: */
export type BonusType = "PERFORMANCE" | "PRODUCTIVITY" | "OTHER" | string;

/** ==== Entidades que devuelve tu backend ==== */
export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  branchId: string;
  date: string;        // ISO
  amount: number;      // Decimal serializado a number
  description: string | null;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
}

export interface EmployeeBonus {
  id: string;
  employeeId: string;
  branchId: string;
  date: string;        // ISO
  type: BonusType;
  amount: number;
  description: string | null;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
}

/** ==== DTOs del controller ==== */
export interface AdvanceDto {
  employeeId: string;
  branchId: string;   // viaja en el body
  date: string;       // ISO o YYYY-MM-DD
  amount: number;
  description?: string | null;
}

export interface BonusDto {
  employeeId: string;
  branchId: string;   // viaja en el body
  date: string;       // ISO o YYYY-MM-DD
  type: BonusType;
  amount: number;
  description?: string | null;
}

export const employeePayApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // POST /employee-pay/advance
    addEmployeeAdvance: build.mutation<EmployeeAdvance, { data: AdvanceDto }>({
      query: ({ data }) => ({
        url: "/employee-pay/advance",
        method: "POST",
        body: data,
      }),
    }),

    // POST /employee-pay/bonus
    addEmployeeBonus: build.mutation<EmployeeBonus, { data: BonusDto }>({
      query: ({ data }) => ({
        url: "/employee-pay/bonus",
        method: "POST",
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddEmployeeAdvanceMutation,
  useAddEmployeeBonusMutation,
} = employeePayApi;
