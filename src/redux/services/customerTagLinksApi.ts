import { baseApi } from "./baseApi";
import { customersApi } from "./customersApi";

/** DTO */
export interface LinkTagDto {
  customerId: string;
  tagId: string;
}

/** Para forzar sucursal puntual por request */
export type BranchArg = { branchId?: string };

export const customerTagLinksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // POST /customer-tag-links
    linkCustomerTag: build.mutation<{ id: string } | { ok: true }, { data: LinkTagDto } & BranchArg>({
      query: ({ data, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        return { url: "/customer-tag-links", method: "POST", body: data, headers };
      },
      async onQueryStarted({ data }, { dispatch, queryFulfilled }) {
        // Invalida lista y detail del cliente para refrescar sus tags
        const invalidate = () => {
          dispatch(customersApi.util.invalidateTags([
            { type: "Customers", id: data.customerId },
            { type: "Customers", id: "LIST" },
          ]));
        };
        try {
          await queryFulfilled;
          invalidate();
        } catch {
          // nada: dejamos estado como estaba
        }
      },
    }),

    // DELETE /customer-tag-links?customerId=&tagId=
    unlinkCustomerTag: build.mutation<{ ok: true }, { customerId: string; tagId: string } & BranchArg>({
      query: ({ customerId, tagId, branchId }) => {
        const headers: Record<string, string> = {};
        if (branchId) headers["x-branch-id"] = branchId;
        const qs = new URLSearchParams({ customerId, tagId }).toString();
        return { url: `/customer-tag-links?${qs}`, method: "DELETE", headers };
      },
      async onQueryStarted({ customerId }, { dispatch, queryFulfilled }) {
        const invalidate = () => {
          dispatch(customersApi.util.invalidateTags([
            { type: "Customers", id: customerId },
            { type: "Customers", id: "LIST" },
          ]));
        };
        try {
          await queryFulfilled;
          invalidate();
        } catch {
          // nada
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useLinkCustomerTagMutation,
  useUnlinkCustomerTagMutation,
} = customerTagLinksApi;
