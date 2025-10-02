// src/redux/slices/authSlice.ts
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { AuthUser, UserRole } from "@/types/auth";

/* ========================
   Tipos
   ======================== */

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

type State = {
  session: AuthSession;
  loading: boolean;                 // 👈 estado de carga para /auth/me, etc.
  devRoleOverride: UserRole | null; // 👈 override temporal de rol (solo front/dev)
};

/* ========================
   Helpers
   ======================== */

const createInitialSession = (): AuthSession => ({
  token: null,
  tenantId: null,
  branchId: null,
  role: null,
  user: null,
  flags: {},
});

const initialState: State = {
  session: createInitialSession(),
  loading: false,
  devRoleOverride: null,
};

const hasOwn = <K extends keyof AuthSession>(
  patch: AuthSessionPayload,
  key: K
) => Object.prototype.hasOwnProperty.call(patch, key);

/**
 * Rellena derivados (role/tenantId/branchId) desde user si no fueron provistos
 * explícitamente y el estado no los tenía todavía.
 */
const applyDerivedFields = (state: AuthSession, patch?: AuthSessionPayload) => {
  const providedUser = patch && hasOwn(patch, "user") ? patch.user : undefined;
  const user = providedUser !== undefined ? providedUser : state.user;

  const roleProvided = !!patch && hasOwn(patch, "role");
  const tenantProvided = !!patch && hasOwn(patch, "tenantId");
  const branchProvided = !!patch && hasOwn(patch, "branchId");

  if (!roleProvided && !state.role && user?.role) {
    state.role = user.role ?? state.role;
  }
  if (!tenantProvided && (state.tenantId == null) && user?.tenantId) {
    state.tenantId = user.tenantId ?? state.tenantId;
  }
  if (!branchProvided && (state.branchId == null) && user?.branchId) {
    state.branchId = user.branchId ?? state.branchId;
  }
};

/* ========================
   Slice
   ======================== */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Hidrata desde storage al iniciar la app
    hydrateSession: (state, action: PayloadAction<AuthSessionPayload>) => {
      const next = createInitialSession();
      const patch = action.payload;

      if (patch.token !== undefined) next.token = patch.token;
      if (patch.tenantId !== undefined) next.tenantId = patch.tenantId;
      if (patch.branchId !== undefined) next.branchId = patch.branchId;
      if (patch.role !== undefined) next.role = patch.role;
      if (patch.user !== undefined) next.user = patch.user;
      if (patch.flags !== undefined) next.flags = { ...patch.flags };

      applyDerivedFields(next, patch);
      state.session = next;
    },

    // Aplica cambios incrementales a la sesión
    setSession: (state, action: PayloadAction<AuthSessionPayload>) => {
      const patch = action.payload;
      if (patch.token !== undefined) state.session.token = patch.token;
      if (patch.tenantId !== undefined) state.session.tenantId = patch.tenantId;
      if (patch.branchId !== undefined) state.session.branchId = patch.branchId;
      if (patch.role !== undefined) state.session.role = patch.role;
      if (patch.user !== undefined) state.session.user = patch.user;
      if (patch.flags !== undefined) {
        state.session.flags = { ...patch.flags };
      }

      applyDerivedFields(state.session, patch);
    },

    // Limpia toda la sesión
    clearSession: (state) => {
      state.session = createInitialSession();
      state.loading = false;
      // NO tocamos devRoleOverride para que el switcher dev persista si querés
      // Si querés limpiarlo también al desloguear, descomentá:
      // state.devRoleOverride = null;
    },

    // Estado de carga (útil para RoleGuard y splash)
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Override temporal de rol (dev only, no toca token ni user)
    setDevRoleOverride: (state, action: PayloadAction<UserRole | null>) => {
      state.devRoleOverride = action.payload;
    },
    clearDevRoleOverride: (state) => {
      state.devRoleOverride = null;
    },
  },
});

export const {
  hydrateSession,
  setSession,
  clearSession,
  setAuthLoading,
  setDevRoleOverride,
  clearDevRoleOverride,
} = authSlice.actions;

/* ========================
   Selectores
   ======================== */

export const selectState = (state: RootState): State => state.auth;

export const selectSession = createSelector(selectState, (s) => s.session);
export const selectAuthUser = createSelector(selectSession, (s) => s.user);
export const selectAuthToken = createSelector(selectSession, (s) => s.token);
export const selectAuthRole = createSelector(selectSession, (s) => s.role);
export const selectAuthTenantId = createSelector(selectSession, (s) => s.tenantId);
export const selectAuthBranchId = createSelector(selectSession, (s) => s.branchId);
export const selectAuthFlags = createSelector(selectSession, (s) => s.flags);
export const selectIsAuthenticated = createSelector(selectSession, (s) => Boolean(s.token));

export const selectAuthLoading = createSelector(selectState, (s) => s.loading);
export const selectDevRoleOverride = createSelector(selectState, (s) => s.devRoleOverride);

// Rol efectivo: override dev → role de sesión → role del usuario
export const selectEffectiveRole = createSelector(
  selectDevRoleOverride,
  selectAuthRole,
  selectAuthUser,
  (override, role, user) => override ?? role ?? user?.role ?? null
);

export default authSlice.reducer;
