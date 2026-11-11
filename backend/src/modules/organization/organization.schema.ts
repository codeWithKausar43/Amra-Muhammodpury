import { z } from 'zod';

export const ApplyMembershipSchema = z.object({
  fullName: z.string().min(2, 'সম্পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে').max(100),
  phone: z.string().min(11, 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন').max(15),
  profession: z.string().min(2, 'পেশা উল্লেখ করুন').max(100),
  monthlyContribution: z.coerce
    .number()
    .min(50, 'মাসিক অনুদান সর্বনিম্ন ৫০ টাকা হতে হবে'),
  agreedToMonthlyFee: z
    .boolean()
    .refine((val) => val === true, 'আপনাকে প্রতি মাসে নির্ধারিত চাঁদা পরিশোধে সম্মতি দিতে হবে'),
});

export const InitialPaymentSchema = z.object({
  paymentMethod: z.enum(['BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CASH']),
  trxId: z.string().optional(),
  senderNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const PayContributionSchema = z.object({
  periodMonth: z.coerce.number().min(1).max(12).optional(),
  months: z.array(z.coerce.number().min(1).max(12)).min(1).optional(),
  periodYear: z.coerce.number().min(2020).max(2050),
  amount: z.coerce.number().min(50, 'অনুদান সর্বনিম্ন ৫০ টাকা হতে হবে'),
  paymentMethod: z.enum(['BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CASH']),
  trxId: z.string().optional(),
  senderNumber: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.periodMonth !== undefined || (data.months && data.months.length > 0), {
  message: 'কমপক্ষে একটি মাস নির্বাচন করতে হবে',
  path: ['months'],
});

export const ChangeContributionSchema = z.object({
  newAmount: z.coerce.number().min(50, 'নতুন মাসিক অনুদান সর্বনিম্ন ৫০ টাকা হতে হবে'),
  reason: z.string().optional(),
});

export const ReviewApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export const ReviewPaymentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().optional(),
});

export const CreateFundSchema = z.object({
  name: z.string().min(2, 'তহবিলের নাম আবশ্যক'),
  code: z.string().min(2, 'তহবিল কোড আবশ্যক').toUpperCase(),
  description: z.string().optional(),
  openingBalance: z.coerce.number().min(0).default(0),
});

export const ExpenseItemInputSchema = z.object({
  itemName: z.string().min(1, 'আইটেম নাম আবশ্যক'),
  amount: z.coerce.number().positive('পরিমাণ অবশ্যই ধনাত্মক সংখ্যা হতে হবে'),
  category: z.string().optional(),
  description: z.string().optional(),
  expenseDate: z.string().optional(),
  responsiblePerson: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const FundTransactionSchema = z.object({
  fundId: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'CONTRIBUTION']),
  amount: z.coerce.number().positive('পরিমাণ অবশ্যই ধনাত্মক সংখ্যা হতে হবে'),
  title: z.string().min(2, 'বিবরণ আবশ্যক'),
  description: z.string().optional(),
  category: z.string().optional(),
  receiptUrl: z.string().optional(),
  toFundId: z.string().uuid().optional(), // For fund transfer
  projectId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  items: z.array(ExpenseItemInputSchema).optional(),
});

export const CreateCommitteeSchema = z.object({
  name: z.string().min(2, 'কমিটির নাম আবশ্যক'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const AssignCommitteeMemberSchema = z.object({
  committeeId: z.string().uuid(),
  userId: z.string().uuid(),
  designationId: z.string().uuid(),
  customTitle: z.string().optional(),
});

export const CreateMeetingSchema = z.object({
  title: z.string().min(2, 'মিটিংয়ের বিষয় আবশ্যক'),
  description: z.string().optional(),
  date: z.string(),
  location: z.string().min(2, 'স্থান উল্লেখ করুন'),
  agenda: z.string().optional(),
});

export const RecordAttendanceSchema = z.object({
  attendees: z.array(
    z.object({
      userId: z.string().uuid(),
      attended: z.boolean(),
      notes: z.string().optional(),
    }),
  ),
  minutes: z.string().optional(),
});

export const CreateNoticeSchema = z.object({
  title: z.string().min(2, 'বিজ্ঞপ্তির শিরোনাম আবশ্যক'),
  content: z.string().min(5, 'বিজ্ঞপ্তির বিবরণ আবশ্যক'),
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']).default('NORMAL'),
  isPinned: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

export const UpdateNoticeSchema = z.object({
  title: z.string().min(2, 'বিজ্ঞপ্তির শিরোনাম আবশ্যক').optional(),
  content: z.string().min(5, 'বিজ্ঞপ্তির বিবরণ আবশ্যক').optional(),
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']).optional(),
  isPinned: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(2, 'প্রকল্পের নাম আবশ্যক'),
  description: z.string().min(5, 'প্রকল্পের বিবরণ আবশ্যক'),
  budget: z.coerce.number().min(0).default(0),
  spent: z.coerce.number().min(0).default(0),
  progress: z.coerce.number().min(0).max(100).default(0),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD']).default('ACTIVE'),
  isPublic: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  images: z.array(z.string()).default([]),
  category: z.enum(['GENERAL', 'HUMANITARIAN', 'TREE_PLANTATION']).default('GENERAL'),
  
  // Humanitarian Aid
  beneficiaryName: z.string().optional(),
  beneficiaryPhone: z.string().optional(),
  beneficiaryAddress: z.string().optional(),
  assistanceType: z.string().optional(),
  consentGiven: z.boolean().default(true),
  
  // Tree Plantation for Newborn initiative
  childName: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  treesPlanted: z.string().optional(),
  plantationLocation: z.string().optional(),
  plantationDate: z.string().optional(),

  fundId: z.string().uuid().optional(),
  items: z.array(ExpenseItemInputSchema).optional(),
});

export const CreateDocumentSchema = z.object({
  title: z.string().min(2, 'ফাইলের শিরোনাম আবশ্যক'),
  description: z.string().optional(),
  fileUrl: z.string().url('সঠিক ফাইল লিংক দিন'),
  fileType: z.string().optional(),
  fileSize: z.coerce.number().optional(),
  category: z.enum(['POLICY', 'FINANCE', 'MEETING_MINUTES', 'RECEIPT', 'GENERAL']).default('GENERAL'),
  accessLevel: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'OFFICERS_ONLY']).default('MEMBERS_ONLY'),
});

// Digital Election Schemas
export const CreateElectionSchema = z.object({
  title: z.string().min(3, 'নির্বাচনের নাম আবশ্যক'),
  description: z.string().optional(),
  nominationStartDate: z.string(),
  nominationEndDate: z.string(),
  votingStartDate: z.string(),
  votingEndDate: z.string(),
  rules: z.string().optional(),
  positions: z.array(
    z.object({
      designationId: z.string().uuid(),
      maxWinners: z.coerce.number().min(1).default(1),
    }),
  ).min(1, 'কমপক্ষে একটি পদের নির্বাচন নির্ধারণ করুন'),
});

export const SubmitNominationSchema = z.object({
  positionId: z.string().uuid(),
  candidateName: z.string().min(2, 'প্রার্থীর নাম আবশ্যক'),
  candidatePhoto: z.string().optional(),
  experience: z.string().optional(),
  manifesto: z.string().min(10, 'নির্বাচনী ইশতেহার কমপক্ষে ১০ অক্ষরের হতে হবে'),
});

export const ReviewNominationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

export const CastVoteSchema = z.object({
  ballots: z.array(
    z.object({
      positionId: z.string().uuid(),
      candidateNominationId: z.string().uuid(),
    }),
  ).min(1, 'কমপক্ষে একটি পদে ভোট প্রদান করতে হবে'),
});

export const UpdateElectionStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'UPCOMING',
    'NOMINATION_OPEN',
    'NOMINATION_CLOSED',
    'VOTING_ACTIVE',
    'VOTING_CLOSED',
    'RESULTS_REVIEW',
    'COMPLETED',
    'FINALIZED',
    'CANCELLED',
  ]),
});

export const CreateVotingPollSchema = z.object({
  title: z.string().min(3, 'ভোটের শিরোনাম আবশ্যক'),
  positionName: z.string().min(2, 'পদের নাম আবশ্যক'),
  description: z.string().optional(),
  votingStartDate: z.string(),
  votingEndDate: z.string(),
  isPublished: z.boolean().default(true),
  candidates: z
    .array(
      z.object({
        name: z.string().min(2, 'প্রার্থীর নাম আবশ্যক'),
        photo: z.string().optional(),
        image: z.string().optional(),
        bio: z.string().optional(),
        userId: z.string().optional(),
      }),
    )
    .min(2, 'কমপক্ষে ২ জন প্রার্থী যোগ করুন'),
});

export const UpdateVotingScheduleSchema = z.object({
  votingStartDate: z.string(),
  votingEndDate: z.string(),
});

export const UpdateVotingConfigSchema = z.object({
  isVotingEnabled: z.boolean(),
});

// ==========================================
// Organization Member Management & Tracking Schemas
// ==========================================

export const MemberDirectoryQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const AdminMembersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ALL', 'ACTIVE', 'PENDING', 'APPROVED_PAYMENT_PENDING', 'SUSPENDED', 'ARCHIVED']).default('ALL'),
  designationId: z.string().optional(),
  committeeId: z.string().optional(),
  paymentStatus: z.enum(['ALL', 'PAID', 'UNPAID', 'PENDING', 'OVERDUE']).default('ALL'),
  year: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const UpdateMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'APPROVED_PAYMENT_PENDING']),
  notes: z.string().optional(),
});

export const AssignMemberDesignationSchema = z.object({
  designationId: z.string().uuid().nullable().optional().or(z.literal('')),
  committeeId: z.string().uuid().nullable().optional().or(z.literal('')),
  customTitle: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const ContributionTrackingQuerySchema = z.object({
  year: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
});

export const SendContributionReminderSchema = z.object({
  userId: z.string().min(1).optional(),
  memberId: z.string().min(1).optional(),
  periodYear: z.coerce.number().min(2020).max(2050).optional(),
  year: z.coerce.number().min(2020).max(2050).optional(),
  periodMonth: z.coerce.number().min(1).max(12).optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  channel: z.string().optional(),
  customNote: z.string().optional(),
});

export const BulkContributionReminderSchema = z.object({
  userIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
  periodYear: z.coerce.number().min(2020).max(2050).optional(),
  year: z.coerce.number().min(2020).max(2050).optional(),
  periodMonth: z.coerce.number().min(1).max(12).optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  filter: z.enum(['ALL_UNPAID', 'ONLY_OVERDUE']).optional(),
  customNote: z.string().optional(),
});

export const CreateDesignationSchema = z.object({
  name: z.string().min(2, 'পদবির নাম আবশ্যক'),
  code: z.string().min(2, 'পদবি কোড আবশ্যক').toUpperCase().optional(),
  rank: z.coerce.number().default(10),
  description: z.string().optional(),
});

export const UpdateDesignationSchema = z.object({
  name: z.string().min(2).optional(),
  rank: z.coerce.number().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateOrgPaymentConfigSchema = z.object({
  method: z.string().min(2).max(50),
  title: z.string().min(2).max(100),
  accountNumber: z.string().min(2).max(100),
  accountType: z.string().min(2).max(50),
  instructions: z.string().max(1000).nullable().optional().or(z.literal('')),
  qrCodeUrl: z.string().max(1000).nullable().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const AdminUsersQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['ALL', 'GENERAL_USER', 'MEMBER']).default('ALL'),
  provider: z.enum(['ALL', 'google', 'credential']).default('ALL'),
  role: z.enum(['ALL', 'USER', 'ADMIN', 'SUPER_ADMIN']).default('ALL'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
});

export const SuspendUserSchema = z.object({
  isSuspended: z.boolean(),
  reason: z.string().max(500).optional(),
});


