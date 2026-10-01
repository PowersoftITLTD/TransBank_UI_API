// // store/auth/auth.reducer.ts
// import { createReducer, on } from '@ngrx/store';
// import * as AuthActions from './auth.actions';
// import { AuthState, initialAuthState } from './auth.state';

// export const authReducer = createReducer(
//   initialAuthState,
//   on(AuthActions.loginSuccess, (state, { authData }) => ({
//     ...state,
//      token: authData.token,  
//     user: authData.user,
//     isLoggedIn:true
//   })),
//   on(AuthActions.logout, (state) => ({
//     ...state,
//     token: '', 
//     user: '',
//     isLoggedIn:false
//   }))
//   // Add other actions as needed
// );


// auth.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { initialAuthState } from './auth.state';
import * as AuthActions from './auth.actions';

export const authReducer = createReducer(
  initialAuthState,
  
  on(AuthActions.loginSuccess, (state, { authData }) => {
    if (!authData?.token) return state;
    return {
      ...state,
      token: authData.token,
      user: authData.user ?? '',
      role: authData.role ?? '',
      isLoggedIn: true
    };
  }),
  on(AuthActions.logout, () => initialAuthState)
);
