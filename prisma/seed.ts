import { PrismaClient, UserRole, AuthProvider, PlanType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('Admin@1234!', 12);
  const memberHash = await bcrypt.hash('Member@1234!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hybridshare.io' },
    update: {},
    create: {
      email: 'admin@hybridshare.io',
      name: 'Admin User',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      provider: AuthProvider.LOCAL,
      isEmailVerified: true,
      planType: PlanType.ENTERPRISE,
      storageQuota: BigInt(107374182400), // 100 GB
      jobTitle: 'Platform Admin',
      timezone: 'UTC',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@hybridshare.io' },
    update: {},
    create: {
      email: 'member@hybridshare.io',
      name: 'Test Member',
      passwordHash: memberHash,
      role: UserRole.MEMBER,
      provider: AuthProvider.LOCAL,
      isEmailVerified: true,
      planType: PlanType.STARTER,
      storageQuota: BigInt(53687091200), // 50 GB
      jobTitle: 'Team Member',
      timezone: 'UTC',
    },
  });

  console.log(`Seeded admin: ${admin.email}`);
  console.log(`Seeded member: ${member.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
