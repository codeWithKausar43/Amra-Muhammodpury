import { z } from 'zod';

export const bangladeshMobileRegex = /^(\+?880|0)1[3-9]\d{8}$/;

export const checkAvailabilitySchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z
    .string()
    .regex(bangladeshMobileRegex, 'Invalid Bangladesh mobile number (e.g. 01712345678)')
    .optional(),
});

export const registrationValidationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(bangladeshMobileRegex, 'Invalid Bangladesh mobile number (e.g. 01712345678)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  profileImageToken: z.string().optional(),
});

export type RegistrationValidationInput = z.infer<typeof registrationValidationSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
