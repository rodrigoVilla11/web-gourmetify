import { baseApi } from "./baseApi";

/** Modelo que devuelve tu backend */
export interface CustomerAddress {
  id: string;
  customerId: string;
  label?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** DTOs según tu service */
export interface CreateCustomerAddressDto {
  customerId: string;
  label?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isDefault?: boolean;
}

export type UpdateCustomerAddressDto = Partial<
  Omit<CreateCustomerAddressDto, "customerId">
> & {
  // si alguna vez permitís cambiar customerId en update, agregalo acá
};

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

/** Params de lista GET /customer-addresses?customerId=... */
export interface ListAddressesQuery extends BranchArg {
  customerId: string;
}

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /customer-addresses?customerId=...
    listCustomerAddresses: build.query<CustomerAddress[], ListAddressesQuery>({
      query: ({ customerId, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const params = new URLSearchParams({ customerId }).toString();
        return { url: `/customer-addresses?${params}`, headers };
      },
      providesTags: (result, _err, { customerId }) =>
        result
          ? [
              ...result.map((a) => ({ type: "CustomerAddresses" as const, id: a.id })),
              { type: "CustomerAddresses", id: `LIST-${customerId}` },
            ]
          : [{ type: "CustomerAddresses", id: `LIST-${customerId}` }],
    }),

    // POST /customer-addresses
    createCustomerAddress: build.mutation<
      CustomerAddress,
      { data: CreateCustomerAddressDto } & BranchArg
    >({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/customer-addresses", method: "POST", body: data, headers };
      },
      // invalida solamente la lista del cliente afectado
      invalidatesTags: (_res, _err, { data }) => [
        { type: "CustomerAddresses", id: `LIST-${data.customerId}` },
      ],
    }),

    // PATCH /customer-addresses/:id
    updateCustomerAddress: build.mutation<
      CustomerAddress,
      { id: string; data: UpdateCustomerAddressDto & { customerId: string } } & BranchArg
    >({
      // Nota: incluyo customerId en data para poder invalidar correctamente su lista
      query: ({ id, data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const { customerId: _cid, ...rest } = data; // no enviamos customerId si no corresponde
        return { url: `/customer-addresses/${id}`, method: "PATCH", body: rest, headers };
      },
      invalidatesTags: (_res, _err, { id, data }) => [
        { type: "CustomerAddresses", id },
        { type: "CustomerAddresses", id: `LIST-${data.customerId}` },
      ],
    }),

    // DELETE /customer-addresses/:id
    deleteCustomerAddress: build.mutation<
      { id: string },
      { id: string; customerId: string } & BranchArg
    >({
      query: ({ id, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: `/customer-addresses/${id}`, method: "DELETE", headers };
      },
      invalidatesTags: (_res, _err, { id, customerId }) => [
        { type: "CustomerAddresses", id },
        { type: "CustomerAddresses", id: `LIST-${customerId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomerAddressesQuery,
  useCreateCustomerAddressMutation,
  useUpdateCustomerAddressMutation,
  useDeleteCustomerAddressMutation,
} = addressesApi;
