import { PrismaClient } from '../../config/database.js';
import { NotificationService } from '../notifications/notification.service.js';

const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export class ContributionSchedulerService {
  private reminderTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isReminderRunning = false;
  private isCleanupRunning = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Helper: Get current date and time parts in Asia/Dhaka timezone
   */
  public getDhakaDateTime(date: Date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = getPart('hour');
    const minute = getPart('minute');
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Calculate total days in this Dhaka month (handles February, leap years, etc.)
    const daysInMonth = new Date(year, month, 0).getDate();

    return { year, month, day, hour, minute, dateStr, daysInMonth };
  }

  /**
   * Start background jobs:
   * 1. Reminder job: runs every 10 minutes to check scheduled reminder windows
   * 2. Auto-cleanup job: runs every 30 seconds to clean up read reminders (> 2 mins)
   */
  public start() {
    console.info('🚀 [ContributionScheduler] Starting background reminder & cleanup engines (Asia/Dhaka)...');

    // Run initial cleanup immediately
    this.runCleanupJob().catch(() => {});

    // Run initial reminder check immediately
    this.runReminderJob().catch(() => {});

    // Scheduled reminder check every 10 minutes
    this.reminderTimer = setInterval(() => {
      this.runReminderJob().catch((err) => {
        console.error('❌ [ContributionScheduler] Error in reminder job:', err);
      });
    }, 10 * 60 * 1000);

    // Auto-cleanup check every 30 seconds
    this.cleanupTimer = setInterval(() => {
      this.runCleanupJob().catch((err) => {
        console.error('❌ [ContributionScheduler] Error in cleanup job:', err);
      });
    }, 30 * 1000);
  }

  /**
   * Stop background jobs gracefully
   */
  public stop() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    console.info('🛑 [ContributionScheduler] Stopped background jobs');
  }

  /**
   * Background Task: Cleanup read reminders that have been read for >= 2 minutes
   */
  public async runCleanupJob() {
    if (this.isCleanupRunning) return;
    this.isCleanupRunning = true;
    try {
      const deletedCount = await this.notificationService.cleanupReadReminders();
      if (deletedCount > 0) {
        console.info(`🧹 [ContributionScheduler] Auto-cleaned ${deletedCount} read reminder notification(s) (>2 mins read)`);
      }
    } catch (err) {
      console.warn('⚠️ [ContributionScheduler] Cleanup job warning:', err);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   * Background Task: Automated Advance & Overdue Reminders
   */
  public async runReminderJob() {
    if (this.isReminderRunning) return;
    this.isReminderRunning = true;

    try {
      const dhaka = this.getDhakaDateTime();

      // =========================================================================
      // Phase 1: Advance Reminders (28th, 29th, 30th or Month-End in Asia/Dhaka)
      // Target: Upcoming (Next) Month's Contribution
      // Rule: Send 1 reminder per day to unpaid active members
      // =========================================================================
      const isAdvanceDay =
        dhaka.day >= 28 || dhaka.day === dhaka.daysInMonth; // 28th, 29th, 30th, or 31st (or 28th/29th Feb)

      if (isAdvanceDay) {
        const nextMonth = dhaka.month === 12 ? 1 : dhaka.month + 1;
        const nextYear = dhaka.month === 12 ? dhaka.year + 1 : dhaka.year;
        const slot = `ADVANCE_${nextYear}_${nextMonth}_${dhaka.dateStr}`;

        await this.sendAutomatedRemindersForPeriod({
          periodYear: nextYear,
          periodMonth: nextMonth,
          slot,
          isAdvance: true,
        });
      }

      // =========================================================================
      // Phase 2: Overdue Reminders (1st of month and onwards)
      // Target: Current Month's Contribution (and previous unpaid active months)
      // Rule: Send 2 reminders per day at configurable times (Slot 1: 10:00 AM, Slot 2: 06:00 PM)
      // =========================================================================
      const isOverdueDay = dhaka.day >= 1;
      // Allow delivery within hour 10 (10:00-10:59) and hour 18 (18:00-18:59) Dhaka time
      const isSlot1 = dhaka.hour >= 10 && dhaka.hour < 14;
      const isSlot2 = dhaka.hour >= 18 && dhaka.hour < 22;

      if (isOverdueDay && (isSlot1 || isSlot2)) {
        const slotTag = isSlot1 ? 'SLOT1' : 'SLOT2';
        const slot = `OVERDUE_${dhaka.year}_${dhaka.month}_${dhaka.dateStr}_${slotTag}`;

        await this.sendAutomatedRemindersForPeriod({
          periodYear: dhaka.year,
          periodMonth: dhaka.month,
          slot,
          isAdvance: false,
        });
      }
    } catch (err) {
      console.error('❌ [ContributionScheduler] Error running reminder scheduler:', err);
    } finally {
      this.isReminderRunning = false;
    }
  }

  /**
   * Helper: Send reminders to all unpaid active members for a specific target period & slot
   * Guaranteed idempotent via Prisma unique constraint: @@unique([userId, periodYear, periodMonth, slot])
   */
  private async sendAutomatedRemindersForPeriod(params: {
    periodYear: number;
    periodMonth: number;
    slot: string;
    isAdvance: boolean;
  }) {
    const { periodYear, periodMonth, slot, isAdvance } = params;

    // 1. Find all active members
    const activeMembers = await this.prisma.orgMembership.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (activeMembers.length === 0) return;

    // 2. Find who has already VERIFIED paid for this period
    const verifiedPayments = await this.prisma.contributionPayment.findMany({
      where: {
        periodYear,
        periodMonth,
        status: 'VERIFIED',
      },
      select: { userId: true },
    });
    const verifiedUserIds = new Set(verifiedPayments.map((p) => p.userId));

    // 3. Find who already received a reminder for this exact slot
    const existingReminders = await this.prisma.contributionReminder.findMany({
      where: {
        periodYear,
        periodMonth,
        slot,
      },
      select: { userId: true },
    });
    const alreadyRemindedUserIds = new Set(existingReminders.map((r) => r.userId));

    const monthName = MONTH_NAMES_BN[periodMonth - 1] || `${periodMonth} তম`;

    for (const member of activeMembers) {
      // Must not be already paid
      if (verifiedUserIds.has(member.userId)) continue;

      // Must not already have received this slot's reminder (Deduplication)
      if (alreadyRemindedUserIds.has(member.userId)) continue;

      // Check joining date eligibility
      const joinedDate = member.joinedAt ? new Date(member.joinedAt) : new Date(member.createdAt);
      const joinedYear = joinedDate.getFullYear();
      const joinedMonth = joinedDate.getMonth() + 1;
      if (periodYear < joinedYear || (periodYear === joinedYear && periodMonth < joinedMonth)) {
        continue; // Not a member during this period
      }

      const title = isAdvance
        ? 'মাসিক চাঁদার অগ্রিম তাগিদ 🔔'
        : 'মাসিক চাঁদা বকেয়া রয়েছে ⚠️';

      const content = isAdvance
        ? `প্রিয় ${member.user.name}, আপনার আগামী ${monthName} (${periodYear}) মাসের সংগঠনের নির্ধারিত চাঁদা ৳${member.monthlyContribution} বকেয়া হতে যাচ্ছে। অনুগ্রহ করে সময়মতো চাঁদা পরিশোধ করুন।`
        : `প্রিয় ${member.user.name}, আপনার ${monthName} (${periodYear}) মাসের সংগঠনের নির্ধারিত চাঁদা ৳${member.monthlyContribution} এখনো পরিশোধ করা হয়নি। অনুগ্রহ করে আপনার পেমেন্ট সম্পন্ন করুন।`;

      try {
        // Record reminder with database-level uniqueness to ensure zero duplication
        await this.prisma.$transaction(async (tx) => {
          // 1. In-app notification
          await tx.notification.create({
            data: {
              recipientId: member.userId,
              type: 'CONTRIBUTION_REMINDER',
              title,
              content,
              entityType: 'contribution_reminder',
              entityId: member.id,
              isRead: false,
            },
          });

          // 2. Dedup reminder record
          await tx.contributionReminder.create({
            data: {
              userId: member.userId,
              periodYear,
              periodMonth,
              slot,
              channel: 'IN_APP',
            },
          });

          // 3. Update membership's lastReminderSentAt
          await tx.orgMembership.update({
            where: { id: member.id },
            data: { lastReminderSentAt: new Date() },
          });
        });

        // 4. Optional WebPush notification with sound
        this.notificationService.sendPushToUser(member.userId, {
          title,
          body: content,
          url: '/organization/member',
          sound: '/sounds/notification.wav',
        }).catch(() => {});
      } catch (err: any) {
        // Duplicate slot violation or transient error -> ignore gracefully
        if (!err?.message?.includes('Unique constraint failed')) {
          console.warn(`[ContributionScheduler] Notice sending reminder to user ${member.userId}:`, err?.message);
        }
      }
    }
  }
}

