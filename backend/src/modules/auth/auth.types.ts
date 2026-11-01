export interface UserProfileDto {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: Date;
}

export interface AuthTokenResponse {
  user: UserProfileDto;
  accessToken: string;
}
