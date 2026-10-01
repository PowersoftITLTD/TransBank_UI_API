import { createAction, props } from '@ngrx/store';
export const loginSuccess = createAction(
    '[Auth] Login Success',
    props<{ authData: {
      token: string;
      user?: string;
      role?: string;
      userEncryptedDetails?: string;
    } }>()
);

export const logout = createAction('[Auth] Logout');
