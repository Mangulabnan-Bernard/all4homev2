import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

/**
 * Idempotent seed (run via `npm run db:seed`). Every write upserts on a natural
 * unique key so re-runs never duplicate. No bookings/payments are seeded — those
 * must flow through the real actions so the lifecycle + TRX generator are
 * exercised. Default passwords are for local dev only.
 */
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });

const CATEGORIES = [
  { slug: "cleaning", name: "Home Cleaning", icon: "Sparkles" },
  { slug: "plumbing", name: "Plumbing", icon: "Wrench" },
  { slug: "electrical", name: "Electrical", icon: "Zap" },
  { slug: "barber", name: "Barber & Grooming", icon: "Scissors" },
  { slug: "gardening", name: "Gardening & Lawn", icon: "Leaf" },
];

const PROVIDERS = [
  { email: "cleaner@all4home.local", name: "Maria Santos", cat: "cleaning", title: "Standard Home Clean", price: 35 },
  { email: "plumber@all4home.local", name: "James Reyes", cat: "plumbing", title: "Leak Repair Call-out", price: 60 },
  { email: "electrician@all4home.local", name: "Elena Cruz", cat: "electrical", title: "Wiring & Safety Check", price: 65 },
];

async function main() {
  // 1) Categories
  for (const c of CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: { slug: c.slug, name: c.name, icon: c.icon, description: `${c.name} services` },
    });
  }

  // 2) Admin
  await prisma.user.upsert({
    where: { email: "admin@all4home.local" },
    update: { role: "ADMIN", isVerified: true },
    create: {
      email: "admin@all4home.local",
      name: "Site Admin",
      role: "ADMIN",
      isVerified: true,
      password: await bcrypt.hash("Admin123!", 12),
    },
  });

  // 3) Sample customer
  await prisma.user.upsert({
    where: { email: "customer@all4home.local" },
    update: {},
    create: {
      email: "customer@all4home.local",
      name: "Casey Customer",
      role: "CUSTOMER",
      isVerified: true,
      password: await bcrypt.hash("Customer123!", 12),
    },
  });

  // 4) Approved providers + profile + a service + weekday availability
  const providerPw = await bcrypt.hash("Provider123!", 12);
  for (const p of PROVIDERS) {
    const category = await prisma.serviceCategory.findUnique({ where: { slug: p.cat } });
    if (!category) continue;

    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { role: "PROVIDER", isVerified: true },
      create: { email: p.email, name: p.name, role: "PROVIDER", isVerified: true, password: providerPw },
    });

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: { verificationStatus: "APPROVED", approvedAt: new Date(), categoryId: category.id },
      create: {
        userId: user.id,
        categoryId: category.id,
        verificationStatus: "APPROVED",
        approvedAt: new Date(),
        bio: `${p.name} — trusted ${p.cat} professional.`,
        hourlyRate: p.price,
        experienceYears: 5,
      },
    });

    // No (providerId, title) unique key, so guard manually for idempotency.
    const existing = await prisma.service.findFirst({
      where: { providerId: profile.id, title: p.title },
      select: { id: true },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          providerId: profile.id,
          categoryId: category.id,
          title: p.title,
          price: p.price,
          durationMin: 60,
        },
      });
    }

    for (let day = 1; day <= 5; day++) {
      await prisma.providerAvailability.upsert({
        where: {
          providerId_dayOfWeek_startTime_endTime: {
            providerId: profile.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
          },
        },
        update: {},
        create: { providerId: profile.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
      });
    }
  }

  console.info("✔ Seed complete (categories, admin, customer, 3 approved providers).");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("✖ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
