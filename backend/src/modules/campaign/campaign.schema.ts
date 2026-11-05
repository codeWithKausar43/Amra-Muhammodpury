import { z } from 'zod';

export const CampaignStatusEnum = z.enum([
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED',
]);

export const DonationStatusEnum = z.enum(['PENDING', 'VERIFIED', 'REJECTED']);

export const PaymentMethodEnum = z.enum([
  'BKASH',
  'NAGAD',
  'ROCKET',
  'BANK',
  'CASH',
  'OTHER',
]);

// --------------------------------------------------------------------------
// Public Schemas
// --------------------------------------------------------------------------

export const PublicCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  categoryId: z.string().optional(),
  search: z.string().optional(),
});

export const PublicDonationSubmitSchema = z.object({
  donorName: z.string().min(2, 'দাতার নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  donorPhone: z
    .string()
    .min(10, 'সঠিক ফোন নম্বর প্রদান করুন')
    .max(16, 'ফোন নম্বর সর্বোচ্চ ১৬ ডিজিটের হতে পারে')
    .regex(/^[0-9+–—\s-]+$/, 'ফোন নম্বরে কেবল সংখ্যা ও গ্রহণযোগ্য চিহ্ন ব্যবহার করুন'),
  donorEmail: z.string().email('সঠিক ইমেইল ঠিকানা দিন').optional().or(z.literal('')),
  amount: z.coerce
    .number()
    .min(10, 'অনুদানের সর্বনিম্ন পরিমাণ ১০ টাকা')
    .max(10000000, 'অনুদানের সর্বোচ্চ পরিমাণ অতিরিক্ত বড়'),
  paymentMethod: PaymentMethodEnum,
  trxId: z.string().max(100).optional().or(z.literal('')),
  senderNumber: z.string().max(50).optional().or(z.literal('')),
  receiptUrl: z.string().url('রশিদের সঠিক ছবি দিন').optional().or(z.literal('')),
  donorNotes: z.string().max(500).optional().or(z.literal('')),
});

// --------------------------------------------------------------------------
// Admin Schemas
// --------------------------------------------------------------------------

export const CreateCampaignSchema = z.object({
  title: z.string().min(3, 'ক্যাম্পেইনের শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে').max(200),
  slug: z.string().max(250).optional(),
  categoryId: z.string().uuid('সঠিক ক্যাটাগরি নির্বাচন করুন').optional().or(z.literal('')),
  coverImage: z.string().url('কভার ছবির সঠিক লিংক প্রদান করুন'),
  shortDescription: z.string().min(10, 'সংক্ষিপ্ত বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে').max(500),
  description: z.string().min(20, 'বিস্তারিত বিবরণ কমপক্ষে ২০ অক্ষরের হতে হবে'),
  goalAmount: z.coerce.number().min(0).optional().nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'সঠিক শুরুর তারিখ দিন'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'সঠিক সমাপ্তির তারিখ দিন'),
  location: z.string().max(200).optional().or(z.literal('')),
  status: CampaignStatusEnum.default('DRAFT'),
  isFeatured: z.boolean().default(false),
  priority: z.coerce.number().int().default(0),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial();

export const UpdateCampaignStatusSchema = z.object({
  status: CampaignStatusEnum,
});

export const AdminCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: CampaignStatusEnum.optional().or(z.literal('ALL')),
  categoryId: z.string().optional(),
  search: z.string().optional(),
});

export const AdminDonationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  campaignId: z.string().optional(),
  status: z.enum(['ALL', 'PENDING', 'VERIFIED', 'REJECTED']).optional().default('ALL'),
  paymentMethod: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const ReviewDonationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'ক্যাটাগরির নাম দিন').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  icon: z.string().max(50).optional().or(z.literal('')),
  displayOrder: z.coerce.number().int().default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const CreateExpenseSchema = z.object({
  campaignId: z.string().uuid('সঠিক ক্যাম্পেইন নির্বাচন করুন'),
  amount: z.coerce.number().min(1, 'খরচের পরিমাণ দিন'),
  purpose: z.string().min(3, 'খরচের উদ্দেশ্য লিখুন').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  expenseDate: z.string().optional(),
  voucherUrl: z.string().url('ভাউচারের সঠিক লিংক দিন').optional().or(z.literal('')),
  performedBy: z.string().min(2, 'অনুমোদনকারী/ব্যক্তি লিখুন').max(100),
});

export const UpdatePaymentConfigSchema = z.object({
  method: PaymentMethodEnum,
  title: z.string().min(2).max(100),
  accountNumber: z.string().min(4).max(100),
  accountType: z.string().min(2).max(50),
  instructions: z.string().max(1000).optional(),
  qrCodeUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

