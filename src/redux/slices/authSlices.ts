// src/redux/slices/authSlice.ts
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { AuthUser, UserRole } from "@/types/auth";

export type AuthFlags = Record<string, boolean>;

export interface AuthSession {
  token: string | null;
  tenantId: string | null;
  branchId: string | null;
  role: UserRole | null;
  user: AuthUser | null;
  flags: AuthFlags;
}

export type AuthSessionPayload = Partial<AuthSession>;

const createInitialSession = (): AuthSession => ({
  token: null,
  tenantId: null,
  branchId: null,
  role: null,
  user: null,
  flags: {},
});

const hasOwn = <K extends keyof AuthSession>(
  patch: AuthSessionPayload,
  key: K
) => Object.prototype.hasOwnProperty.call(patch, key);

const applyDerivedFields = (state: AuthSession, patch?: AuthSessionPayload) => {
  const providedUser = patch && hasOwn(patch, "user") ? patch.user : undefined;
  const user = providedUser !== undefined ? providedUser : state.user;
  const roleProvided = !!patch && hasOwn(patch, "role");
  const tenantProvided = !!patch && hasOwn(patch, "tenantId");
  const branchProvided = !!patch && hasOwn(patch, "branchId");

  if (!roleProvided && !state.role && user?.role) {
    state.role = user.role ?? state.role;
  }
  if (
    !tenantProvided &&
    (state.tenantId === null || state.tenantId === undefined) &&
    user?.tenantId
  ) {
    state.tenantId = user.tenantId ?? state.tenantId;
  }
  if (
    !branchProvided &&
    (state.branchId === null || state.branchId === undefined) &&
    user?.branchId
  ) {
    state.branchId = user.branchId ?? state.branchId;
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: createInitialSession(),
  reducers: {
    hydrateSession: (_, action: PayloadAction<AuthSessionPayload>) => {
      const next = createInitialSession();
      const patch = action.payload;

      if (patch.token !== undefined) next.token = patch.token;
      if (patch.tenantId !== undefined) next.tenantId = patch.tenantId;
      if (patch.branchId !== undefined) next.branchId = patch.branchId;
      if (patch.role !== undefined) next.role = patch.role;
      if (patch.user !== undefined) next.user = patch.user;
      if (patch.flags !== undefined) next.flags = { ...patch.flags };

      applyDerivedFields(next, patch);
      return next;
    },
    setSession: (state, action: PayloadAction<AuthSessionPayload>) => {
      const patch = action.payload;
      if (patch.token !== undefined) state.token = patch.token;
      if (patch.tenantId !== undefined) state.tenantId = patch.tenantId;
      if (patch.branchId !== undefined) state.branchId = patch.branchId;
      if (patch.role !== undefined) state.role = patch.role;
      if (patch.user !== undefined) state.user = patch.user;
      if (patch.flags !== undefined) {
        state.flags = { ...patch.flags };
      }

      applyDerivedFields(state, patch);
    },
    clearSession: () => createInitialSession(),
  },
});

export const { hydrateSession, setSession, clearSession } = authSlice.actions;

export const selectSession = (state: RootState): AuthSession => state.auth;
export const selectAuthUser = createSelector(selectSession, (session) => session.user);
export const selectAuthToken = createSelector(selectSession, (session) => session.token);
export const selectAuthRole = createSelector(selectSession, (session) => session.role);
export const selectAuthTenantId = createSelector(selectSession, (session) => session.tenantId);
export const selectAuthBranchId = createSelector(selectSession, (session) => session.branchId);
export const selectAuthFlags = createSelector(selectSession, (session) => session.flags);
export const selectIsAuthenticated = createSelector(selectSession, (session) => Boolean(session.token));

export default authSlice.reducer;
