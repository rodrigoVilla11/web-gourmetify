import { baseApi } from "./baseApi";

/** ==== Tipos que devuelve tu backend ==== */
export type ShiftStatus = "WORKED" | string;

export interface EmployeeShift {
  id: string;
  employeeId: string;
  branchId: string;
  checkIn: string;          // ISO
  checkOut: string | null;  // ISO | null
  status: ShiftStatus;
  hourlyRate: number;       // Prisma.Decimal serializado como number
  totalHours: number;       // Prisma.Decimal -> number
  totalPay: number;         // Prisma.Decimal -> number
  createdAt: string;
  updatedAt: string;
}

/** ==== DTOs según tu controller/service ==== */
export interface CheckInDto {
  employeeId: string;
  branchId: string;         // importante: el service valida contra user.branchId
  checkIn: string;          // ISO o YYYY-MM-DDTHH:mm:ss
}

export interface CheckOutDto {
  shiftId: string;
  checkOut: string;         // ISO o YYYY-MM-DDTHH:mm:ss (debe ser > checkIn)
}

/** Param para GET /employee-shifts?employeeId=... */
export interface ListShiftsQuery {
  employeeId: string;
}

export const employeeShiftsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /employee-shifts?employeeId=...
    listEmployeeShifts: build.query<EmployeeShift[], ListShiftsQuery>({
      query: ({ employeeId }) => {
        const qs = new URLSearchParams({ employeeId }).toString();
        return { url: `/employee-shifts?${qs}` };
      },
      providesTags: (result, _err, { employeeId }) =>
        result
          ? [
              ...result.map((s) => ({ type: "EmployeeShifts" as const, id: s.id })),
              { type: "EmployeeShifts", id: `LIST-${employeeId}` },
            ]
          : [{ type: "EmployeeShifts", id: `LIST-${employeeId}` }],
    }),

    // POST /employee-shifts/check-in
    checkIn: build.mutation<EmployeeShift, { data: CheckInDto }>({
      query: ({ data }) => ({
        url: "/employee-shifts/check-in",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_res, _err, { data }) => [
        { type: "EmployeeShifts", id: `LIST-${data.employeeId}` },
      ],
    }),

    // POST /employee-shifts/check-out
    checkOut: build.mutation<EmployeeShift, { data: CheckOutDto; employeeId: string }>({
      query: ({ data }) => ({
        url: "/employee-shifts/check-out",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_res, _err, { employeeId }) => [
        { type: "EmployeeShifts", id: `LIST-${employeeId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEmployeeShiftsQuery,
  useCheckInMutation,
  useCheckOutMutation,
} = employeeShiftsApi;
