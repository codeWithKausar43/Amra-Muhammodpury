export interface UserSessionDto {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  phone?: string | null;
  role: string;
  createdAt: Date;
}
