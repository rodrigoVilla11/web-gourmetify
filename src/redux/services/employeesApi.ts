import { baseApi } from "./baseApi";

/** ==== Tipos que devuelve tu backend (incluye user y rates) ==== */
export interface EmployeeRate {
  id: string;
  employeeId: string;
  hourlyRate: number;       // Prisma.Decimal -> number en JSON
  validFrom: string;        // ISO
  validTo: string | null;   // ISO | null
  createdAt: string;        // ISO
}

export interface UserSummary {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  startDate: string;        // ISO
  endDate: string | null;   // ISO | null
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
  rates: EmployeeRate[];
}

/** ==== DTOs según tu controller/service ==== */
export interface CreateEmployeeDto {
  userId: string;
  startDate: string;        // ISO o YYYY-MM-DD
  endDate?: string | null;  // opcional
}

export interface AddRateDto {
  employeeId: string;
  hourlyRate: number;       // en ARS u otra moneda; number
  validFrom: string;        // ISO o YYYY-MM-DD
  validTo?: string | null;  // opcional
}

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /employees   (include: user, rates)
    listEmployees: build.query<Employee[], void>({
      query: () => ({ url: "/employees" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: "Employees" as const, id: e.id })),
              { type: "Employees", id: "LIST" },
            ]
          : [{ type: "Employees", id: "LIST" }],
    }),

    // POST /employees
    createEmployee: build.mutation<Employee, { data: CreateEmployeeDto }>({
      query: ({ data }) => ({
        url: "/employees",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Employees", id: "LIST" }],
    }),

    // POST /employees/rates
    addEmployeeRate: build.mutation<EmployeeRate, { data: AddRateDto }>({
      query: ({ data }) => ({
        url: "/employees/rates",
        method: "POST",
        body: data,
      }),
      // Invalidamos LIST para que refresque el empleado con rates actualizados
      invalidatesTags: [{ type: "Employees", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useAddEmployeeRateMutation,
} = employeesApi;
