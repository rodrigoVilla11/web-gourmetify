// src/redux/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types/auth";

type State = { user: AuthUser | null };

const initialState: State = { user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      // normalizador suave por si el backend no envía name/role
      state.user = action.payload ? { ...action.payload } : null;
    },
    clearUser(state) {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
