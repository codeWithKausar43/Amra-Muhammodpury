import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import { UserSessionDto } from './auth.types.js';

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  public async checkAvailability(email?: string, phone?: string): Promise<{ available: boolean }> {
    if (email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictError('এই ইমেইল ঠিকানাটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে');
      }
    }

    if (phone) {
      // Normalize phone number (strip whitespace or convert +880 to 0)
      const normalizedPhone = phone.replace(/\s+/g, '');
      const existing = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });
      if (existing) {
        throw new ConflictError('এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে');
      }
    }

    return { available: true };
  }

  public async getCurrentUser(userId: string): Promise<UserSessionDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
