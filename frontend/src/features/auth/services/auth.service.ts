import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { AuthResponse, AuthUser } from '../types';
import { LoginFormValues, RegisterFormValues } from '../schemas/auth.schema';

export const authService = {
  async register(values: RegisterFormValues): Promise<ApiResponse<AuthUser>> {
    const { confirmPassword: _, ...payload } = values;
    return apiClient<ApiResponse<AuthUser>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(values: LoginFormValues): Promise<ApiResponse<AuthResponse>> {
    return apiClient<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  },
};
