// store/auth/auth.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.interface';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const storedDetails = createSelector(
  selectAuthState,
  (state: AuthState | undefined) => state
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState | undefined) => {
    return !!(state?.isLoggedIn && state.token?.trim());
  }
);


export const userDetails = createSelector(
    selectAuthState,
    (state: AuthState) => ({
        token:state.token,
        user: state.user,
        // userName: state.userName,
        // password: state.password, 
    })
);
