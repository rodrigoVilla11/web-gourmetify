import { baseApi } from "./baseApi";

/** === Enums/Tipos === */
export type SupplierPaymentTerm =
  | "CASH"
  | "NET_7"
  | "NET_15"
  | "NET_30"
  | "NET_60"
  | string;

/** === Modelos que devuelve tu backend === */
export interface Supplier {
  id: string;
  branchId: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  defaultPaymentTerm: SupplierPaymentTerm | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface SupplierIngredientPrice {
  id: string;
  supplierId: string;
  ingredientId: string;
  price: number;     // Decimal -> number
  createdAt: string; // ISO (última actualización)
}

/** === DTOs controller/service === */
export interface CreateSupplierDto {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  defaultPaymentTerm?: SupplierPaymentTerm | null;
}

export type UpdateSupplierDto = Partial<CreateSupplierDto>;

export interface UpsertSupplierPriceDto {
  supplierId: string;
  ingredientId: string;
  price: number; // > 0
}

/** Header override puntual por request */
export type BranchArg = { branchId?: string };

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /suppliers */
    listSuppliers: build.query<Supplier[], BranchArg | void>({
      query: (arg) => {
        const headers: Record<string, string> = {};
        const branchId = (arg as BranchArg | undefined)?.branchId;
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/suppliers", headers };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: "Suppliers" as const, id: s.id })),
              { type: "Suppliers", id: "LIST" },
            ]
          : [{ type: "Suppliers", id: "LIST" }],
    }),

    /** POST /suppliers */
    createSupplier: build.mutation<Supplier, { data: CreateSupplierDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/suppliers", method: "POST", body: data, headers };
      },
      invalidatesTags: [{ type: "Suppliers", id: "LIST" }],
    }),

    /** PATCH /suppliers/:id */
    updateSupplier: build.mutation<
      Supplier,
      { id: string; data: UpdateSupplierDto } & BranchArg
    >({
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/suppliers/${id}`, method: "PATCH", body: data, headers };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Suppliers", id },
        { type: "Suppliers", id: "LIST" },
      ],
    }),

    /** POST /suppliers/upsert-price */
    upsertSupplierPrice: build.mutation<
      SupplierIngredientPrice,
      { data: UpsertSupplierPriceDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/suppliers/upsert-price", method: "POST", body: data, headers };
      },
      // Si tu UI muestra precios en la ficha del proveedor, invalidá el supplier concreto:
      async onQueryStarted({ data }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            suppliersApi.util.invalidateTags([
              { type: "Suppliers", id: data.supplierId },
              { type: "Suppliers", id: "LIST" },
            ])
          );
        } catch { /* noop */ }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useListSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useUpsertSupplierPriceMutation,
} = suppliersApi;
