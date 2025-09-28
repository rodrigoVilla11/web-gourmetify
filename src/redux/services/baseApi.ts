import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCurrentBranch, getTenantId } from "@/lib/tenant";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    prepareHeaders: (headers, { extra }) => {
      headers.set("x-tenant-id", process.env.NEXT_PUBLIC_TENANT_ID!);

      const branchId =
        (extra as { branchId?: string } | undefined)?.branchId ??
        (typeof window !== "undefined"
          ? localStorage.getItem("x-branch-id") ||
            process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID
          : process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID);

      if (branchId) headers.set("x-branch-id", branchId);

      return headers;
    },
  }),

  tagTypes: [
    "Customers",
    "Branches",
    "Accounts",
    "CashClosures",
    "Categories",
    "CustomerAddresses",
    "CustomerNotes",
    "CustomerTags",
    "DailyReports",
    "Employees",
    "EmployeeShifts",
    "Ingredients",
    "IngredientRecipes",
    "Inventory",
    "Movements",
    "Orders",
    "OrderPayments",
    "ProductCategories",
    "Products",
    "ProductionBatches",
    "PurchaseOrders",
    "Recipes",
    "Suppliers",
    "Tenants",
    "Transfers",
    "Users"
  ],
  endpoints: () => ({}),
});
