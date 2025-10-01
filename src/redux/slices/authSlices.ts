// src/redux/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "ADMIN" | "MANAGER" | "CASHIER" | "STAFF";
export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  branchId?: string | null;
};

type AuthState = {
  user: MockUser | null;
};

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<MockUser | null>) {
      state.user = action.payload;
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
