import { baseApi } from "./baseApi";

/** === Tipos del backend === */
export type MovementType =
  | "SALE"
  | "INCOME_OTHER"
  | "TRANSFER_IN"
  | "SUPPLIER_PAYMENT"
  | "EXPENSE_GENERAL"
  | "TRANSFER_OUT"
  | "ADJUSTMENT"
  | string;

export interface Movement {
  id: string;
  accountId: string;
  categoryId: string | null;
  supplierId: string | null;
  userId: string;
  date: string;        // ISO
  type: MovementType;
  amount: number;      // Prisma.Decimal -> number
  description: string | null;
  documentUrl: string | null;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
}

/** === DTOs controller/service === */
export interface CreateMovementDto {
  accountId: string;
  categoryId?: string | null;
  supplierId?: string | null;
  userId: string;
  /** ISO/fecha válida; el backend valida y usa Date(dto.date) */
  date: string;
  type: MovementType;
  /** > 0 */
  amount: number;
  description?: string | null;
  documentUrl?: string | null;
}

export type UpdateMovementDto = Partial<
  Omit<CreateMovementDto, "accountId" | "userId">
> & {
  // en update no se cambia accountId/userId según tu service
};

/** Para override puntual de sucursal */
export type BranchArg = { branchId?: string };

/** Query GET /movements (por rango) */
export interface MovementsRangeQuery extends BranchArg {
  from: string; // ISO / YYYY-MM-DD
  to: string;   // ISO / YYYY-MM-DD  (backend usa { gte: from, lt: to })
}

export const movementsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /movements?from=&to= */
    listMovementsByDate: build.query<Movement[], MovementsRangeQuery>({
      query: ({ from, to, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const qs = new URLSearchParams({ from, to }).toString();
        return { url: `/movements?${qs}`, headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((m) => ({ type: "Movements" as const, id: m.id })),
              { type: "Movements", id: "LIST" },
            ]
          : [{ type: "Movements", id: "LIST" }],
    }),

    /** GET /movements/:id */
    getMovementById: build.query<Movement, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/movements/${id}`, headers };
      },
      providesTags: (_res, _err, { id }) => [{ type: "Movements", id }],
    }),

    /** POST /movements */
    createMovement: build.mutation<Movement, { data: CreateMovementDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/movements", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "Movements", id: "LIST" }],
    }),

    /** PATCH /movements/:id */
    updateMovement: build.mutation<
      Movement,
      { id: string; data: UpdateMovementDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/movements/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Movements", id },
        { type: "Movements", id: "LIST" },
      ],
    }),

    /** DELETE /movements/:id */
    deleteMovement: build.mutation<{ id: string }, { id: string } & BranchArg>({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/movements/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Movements", id },
        { type: "Movements", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMovementsByDateQuery,
  useGetMovementByIdQuery,
  useCreateMovementMutation,
  useUpdateMovementMutation,
  useDeleteMovementMutation,
} = movementsApi;
