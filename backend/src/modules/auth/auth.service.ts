import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { ConflictError, UnauthorizedError } from '../../errors/app-error.js';
import { AuthTokenResponse, UserProfileDto } from './auth.types.js';

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  public async register(input: RegisterInput): Promise<UserProfileDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  public async login(input: LoginInput): Promise<AuthTokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const userDto: UserProfileDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    // Return authenticated profile with placeholder session token for initial foundation
    return {
      user: userDto,
      accessToken: `session_${user.id}_${Date.now()}`,
    };
  }
}
