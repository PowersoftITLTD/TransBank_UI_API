
  // export interface AuthState {
  //   token: string | null;
  //   userEncryptedDetails:string
  //   isLoggedIn:boolean
  // }

    export interface AuthState {
    token: string | null;
    user:string;
    role:string;
    isLoggedIn:boolean;
  }