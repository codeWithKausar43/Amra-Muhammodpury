import { createAuthClient } from 'better-auth/react';
import { env } from '@/config/env';

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
});

export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
export const useSession = authClient.useSession;
export const getSession = authClient.getSession;

type DynamicAuthClient = {
  forgetPassword: (data: {
    email: string;
    redirectTo?: string;
  }) => Promise<{ error?: { message?: string } }>;
  resetPassword: (data: {
    newPassword: string;
    token: string;
  }) => Promise<{ error?: { message?: string } }>;
  verifyEmail: (data: { query: { token: string } }) => Promise<{ error?: { message?: string } }>;
};

const dynamicClient = authClient as unknown as DynamicAuthClient;

export const forgetPassword = async (data: { email: string; redirectTo?: string }) => {
  return dynamicClient.forgetPassword(data);
};

export const resetPassword = async (data: { newPassword: string; token: string }) => {
  return dynamicClient.resetPassword(data);
};

export const verifyEmail = async (data: { query: { token: string } }) => {
  return dynamicClient.verifyEmail(data);
};
