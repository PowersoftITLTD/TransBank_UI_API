// models/auth.models.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}