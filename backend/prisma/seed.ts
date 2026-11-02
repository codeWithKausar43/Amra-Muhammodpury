import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting database seeding...');

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@amra-muhammadpuri.org' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@amra-muhammadpuri.org',
        name: 'System Administrator',
        role: 'ADMIN',
        emailVerified: true,
        accounts: {
          create: {
            accountId: 'admin@amra-muhammadpuri.org',
            providerId: 'credential',
            password: passwordHash,
          },
        },
      },
    });
    console.info(`✅ Seeded default admin user: ${admin.email}`);
  } else {
    console.info('ℹ️ Admin user already exists, skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
