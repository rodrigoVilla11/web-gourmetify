import { baseApi } from "./baseApi";

/** Ajustá si tenés un enum específico en tu backend */
export type AccountType = string; // p.ej. "CASH" | "BANK" | "MP"

export type Account = {
  id: string;
  branchId: string;
  name: string;
  type: AccountType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAccountDto = {
  name: string;
  type: AccountType;
  isActive?: boolean;
};

export type UpdateAccountDto = Partial<CreateAccountDto>;

/** Para forzar sucursal puntual por request si lo necesitás */
type BranchOverride = { branchId?: string };

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /accounts
    getAccounts: build.query<Account[], BranchOverride | void>({
      query: () => "/accounts",
      extraOptions: (arg: BranchOverride ) => ({ branchId: arg?.branchId }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "Accounts" as const, id: a.id })),
              { type: "Accounts", id: "LIST" },
            ]
          : [{ type: "Accounts", id: "LIST" }],
    }),

    // GET /accounts/:id
    getAccountById: build.query<Account, { id: string } & BranchOverride>({
      query: ({ id }) => `/accounts/${id}`,
      extraOptions: (arg: BranchOverride) => ({ branchId: arg?.branchId }),
      providesTags: (_res, _err, { id }) => [{ type: "Accounts", id }],
    }),

    // POST /accounts
    createAccount: build.mutation<Account, { data: CreateAccountDto } & BranchOverride>({
      query: ({ data }) => ({
        url: "/accounts",
        method: "POST",
        body: data,
      }),
      extraOptions: (arg: BranchOverride) => ({ branchId: arg?.branchId }),
      invalidatesTags: [{ type: "Accounts", id: "LIST" }],
    }),

    // PATCH /accounts/:id
    updateAccount: build.mutation<Account, { id: string; data: UpdateAccountDto } & BranchOverride>({
      query: ({ id, data }) => ({
        url: `/accounts/${id}`,
        method: "PATCH",
        body: data,
      }),
      extraOptions: (arg: BranchOverride) => ({ branchId: arg?.branchId }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Accounts", id },
        { type: "Accounts", id: "LIST" },
      ],
    }),

    // DELETE /accounts/:id
    deleteAccount: build.mutation<{ id: string }, { id: string } & BranchOverride>({
      query: ({ id }) => ({
        url: `/accounts/${id}`,
        method: "DELETE",
      }),
      extraOptions: (arg: BranchOverride) => ({ branchId: arg?.branchId }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Accounts", id },
        { type: "Accounts", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountsApi;
