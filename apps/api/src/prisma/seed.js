"use strict";
/**
 * Development seed
 * Run: npm run db:seed  (from apps/api)
 *
 * Creates two ready-to-use accounts:
 *   ADMIN  → admin@hybridshare.io  / Admin@1234!
 *   MEMBER → member@hybridshare.io / Member@1234!
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const USERS = [
    {
        email: 'admin@hybridshare.io',
        name: 'Admin User',
        password: 'Admin@1234!',
        role: 'ADMIN',
        planType: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        jobTitle: 'Platform Administrator',
    },
    {
        email: 'member@hybridshare.io',
        name: 'Test Member',
        password: 'Member@1234!',
        role: 'MEMBER',
        planType: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        jobTitle: 'Team Member',
    },
];
async function main() {
    console.log('\n🌱  Seeding dev accounts…\n');
    for (const u of USERS) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (existing) {
            // Update password in case it drifted
            const hashed = await bcrypt_1.default.hash(u.password, 12);
            await prisma.user.update({
                where: { id: existing.id },
                data: { password: hashed, planType: u.planType, subscriptionStatus: u.subscriptionStatus, isActive: true, isEmailVerified: true },
            });
            console.log(`  ↩  ${u.role.padEnd(7)}  ${u.email}  ← updated`);
            continue;
        }
        const hashed = await bcrypt_1.default.hash(u.password, 12);
        await prisma.user.create({
            data: {
                email: u.email,
                name: u.name,
                password: hashed, // ← correct field (not passwordHash)
                role: u.role,
                provider: 'LOCAL',
                isEmailVerified: true,
                isActive: true,
                planType: u.planType,
                subscriptionStatus: u.subscriptionStatus,
                jobTitle: u.jobTitle,
                timezone: 'UTC',
                language: 'en',
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
//# sourceMappingURL=seed.js.map