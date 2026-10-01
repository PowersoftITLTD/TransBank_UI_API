// export interface AuthState {
//   token: string | null;
//   userEncryptedDetails: string;
//   isLoggedIn: boolean;  // optional
// }

// export const initialAuthState: AuthState = {
//   token: null,
//   userEncryptedDetails: '',
//   isLoggedIn: true
// };



export interface AuthState {
    token: string | null;
    user:string;
    role:string;
    isLoggedIn:boolean;
}

function loadAuthState(): AuthState {
    const emptyState: AuthState = { token: null, user: '', role: '', isLoggedIn: false };
    if (typeof localStorage === 'undefined') return emptyState;

    try {
        const token = localStorage.getItem('token')?.trim();
        if (!token) return emptyState;

        const persistedState = localStorage.getItem('appState');
        const persistedAuth = persistedState ? JSON.parse(persistedState)?.auth : null;
        return { ...emptyState, ...(persistedAuth ?? {}), token, isLoggedIn: true };
    } catch {
        return emptyState;
    }
}

export const initialAuthState: AuthState = loadAuthState();
