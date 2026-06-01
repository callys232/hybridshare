/**
 * Development seed
 * Run: npm run db:seed  (from apps/api)
 *
 * Creates two ready-to-use accounts:
 *   ADMIN  → admin@hybridshare.io  / Admin@1234!
 *   MEMBER → member@hybridshare.io / Member@1234!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USERS = [
  {
    email:    'admin@hybridshare.io',
    name:     'Admin User',
    password: 'Admin@1234!',
    role:     'ADMIN'    as const,
    planType: 'ENTERPRISE' as const,
    subscriptionStatus: 'ACTIVE' as const,
    jobTitle: 'Platform Administrator',
  },
  {
    email:    'member@hybridshare.io',
    name:     'Test Member',
    password: 'Member@1234!',
    role:     'MEMBER'   as const,
    planType: 'STARTER'  as const,
    subscriptionStatus: 'ACTIVE' as const,
    jobTitle: 'Team Member',
  },
];

async function main() {
  console.log('\n🌱  Seeding dev accounts…\n');

  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });

    if (existing) {
      // Update password in case it drifted
      const hashed = await bcrypt.hash(u.password, 12);
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashed, planType: u.planType, subscriptionStatus: u.subscriptionStatus, isActive: true, isEmailVerified: true },
      });
      console.log(`  ↩  ${u.role.padEnd(7)}  ${u.email}  ← updated`);
      continue;
    }

    const hashed = await bcrypt.hash(u.password, 12);

    await prisma.user.create({
      data: {
        email:              u.email,
        name:               u.name,
        password:           hashed,           // ← correct field (not passwordHash)
        role:               u.role,
        provider:           'LOCAL',
        isEmailVerified:    true,
        isActive:           true,
        planType:           u.planType,
        subscriptionStatus: u.subscriptionStatus,
        jobTitle:           u.jobTitle,
        timezone:           'UTC',
        language:           'en',
      },
    });

    console.log(`  ✓  ${u.role.padEnd(7)}  ${u.email}`);
  }

  console.log('\n┌─────────────────────────────────────────────────────┐');
  console.log('│  Dev credentials                                    │');
  console.log('│  ADMIN   admin@hybridshare.io   Admin@1234!         │');
  console.log('│  MEMBER  member@hybridshare.io  Member@1234!        │');
  console.log('└─────────────────────────────────────────────────────┘\n');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
