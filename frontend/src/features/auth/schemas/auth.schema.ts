import { z } from 'zod';

export const bangladeshMobileRegex = /^(\+?880|0)1[3-9]\d{8}$/;

export const loginFormSchema = z.object({
  email: z.string().email('অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন'),
  password: z.string().min(1, 'পাসওয়ার্ড প্রদান করা আবশ্যক'),
});

export const registerFormSchema = z
  .object({
    name: z.string().min(2, 'পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(50),
    email: z.string().email('অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন'),
    phone: z
      .string()
      .regex(bangladeshMobileRegex, 'সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'),
    password: z
      .string()
      .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
      .regex(/[A-Z]/, 'কমপক্ষে একটি বড় হাতের অক্ষর (A-Z) থাকতে হবে')
      .regex(/[a-z]/, 'কমপক্ষে একটি ছোট হাতের অক্ষর (a-z) থাকতে হবে')
      .regex(/[0-9]/, 'কমপক্ষে একটি সংখ্যা (০-৯) থাকতে হবে'),
    confirmPassword: z.string().min(1, 'পাসওয়ার্ড নিশ্চিত করুন'),
    profileImage: z.string().nullable().optional(),
    tempImageToken: z.string().nullable().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
      .regex(/[A-Z]/, 'কমপক্ষে একটি বড় হাতের অক্ষর (A-Z) থাকতে হবে')
      .regex(/[a-z]/, 'কমপক্ষে একটি ছোট হাতের অক্ষর (a-z) থাকতে হবে')
      .regex(/[0-9]/, 'কমপক্ষে একটি সংখ্যা (০-৯) থাকতে হবে'),
    confirmPassword: z.string().min(1, 'পাসওয়ার্ড নিশ্চিত করুন'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
