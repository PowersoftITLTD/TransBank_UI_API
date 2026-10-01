import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { localStorageSyncReducer } from './persist-meta.reducer';


// Import individual reducers here
import { authReducer } from './auth/auth.reducer';
import { AuthState } from './auth/auth.interface';




// Define the shape of your app's state
export interface AppState {
  auth: AuthState; // Add other slices as needed
}

// Map reducers to state slices
export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer, // Add other reducers here
};

// Define meta-reducers
export const metaReducers: MetaReducer<AppState>[] = [localStorageSyncReducer];
