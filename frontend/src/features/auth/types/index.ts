export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
