/**
 * Seed de développement — ÉTAPE 1 : socle (établissement → classes) + comptes.
 * Étape 2 (à venir) : personnes (500 élèves…), inscriptions, notes, présences.
 *
 * Usage (dev local uniquement) :
 *   docker compose up -d postgres
 *   pnpm --filter api exec prisma migrate reset --force
 *   pnpm --filter api seed
 *
 * Garde-fou : refuse de tourner hors localhost.
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const TEST_PASSWORD = "Password123!";

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    throw new Error(
      "Refus de seeder : DATABASE_URL ne pointe pas sur localhost. Seed dev uniquement.",
    );
  }
}

type SeedAccount = {
  email: string;
  firstName: string;
  lastName: string;
  role: "DIRECTOR" | "ADMIN" | "CENSEUR" | "TEACHER" | "SURVEILLANT" | "PARENT" | "STUDENT";
};

const ACCOUNTS: SeedAccount[] = [
  { email: "director@ecole.test", firstName: "Awa", lastName: "Diallo", role: "DIRECTOR" },
  { email: "admin@ecole.test", firstName: "Moussa", lastName: "Koné", role: "ADMIN" },
  { email: "censeur@ecole.test", firstName: "Fatou", lastName: "Sy", role: "CENSEUR" },
  { email: "prof.maths@ecole.test", firstName: "Ibrahim", lastName: "Touré", role: "TEACHER" },
  { email: "prof.francais@ecole.test", firstName: "Mariam", lastName: "Coulibaly", role: "TEACHER" },
  { email: "surveillant@ecole.test", firstName: "Ousmane", lastName: "Barry", role: "SURVEILLANT" },
  { email: "parent@ecole.test", firstName: "Aïcha", lastName: "Bah", role: "PARENT" },
  { email: "eleve@ecole.test", firstName: "Lamine", lastName: "Diarra", role: "STUDENT" },
];

async function main() {
  assertLocalDatabase();

  // 1 seul hash (bcrypt 12 = lent) réutilisé pour tous les comptes test.
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  const establishment = await prisma.establishment.upsert({
    where: { slug: "college-moderne-test" },
    update: {},
    create: {
      name: "Collège Moderne Test",
      slug: "college-moderne-test",
      type: "MIXED",
    },
  });

  for (const account of ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        passwordHash,
        firstName: account.firstName,
        lastName: account.lastName,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.userEstablishment.upsert({
      where: {
        userId_establishmentId: {
          userId: user.id,
          establishmentId: establishment.id,
        },
      },
      update: { role: account.role },
      create: {
        userId: user.id,
        establishmentId: establishment.id,
        role: account.role,
      },
    });
  }

  async function ensureYear(
    name: string,
    start: string,
    end: string,
    isCurrent: boolean,
  ) {
    const existing = await prisma.academicYear.findFirst({
      where: { establishmentId: establishment.id, name },
    });
    return (
      existing ??
      prisma.academicYear.create({
        data: {
          establishmentId: establishment.id,
          name,
          startDate: new Date(start),
          endDate: new Date(end),
          isCurrent,
        },
      })
    );
  }

  await ensureYear("2024-2025", "2024-09-01", "2025-06-30", false);
  const currentYear = await ensureYear("2025-2026", "2025-09-01", "2026-06-30", true);

  const cycleDefs = [
    { name: "Primaire", order: 1 },
    { name: "Collège", order: 2 },
    { name: "Lycée", order: 3 },
  ];
  const cycles: Record<string, { id: string }> = {};
  for (const def of cycleDefs) {
    const existing = await prisma.cycle.findFirst({
      where: { establishmentId: establishment.id, name: def.name },
    });
    cycles[def.name] =
      existing ??
      (await prisma.cycle.create({
        data: {
          establishmentId: establishment.id,
          name: def.name,
          order: def.order,
        },
      }));
  }

  const levelDefs = [
    { name: "6ème", cycle: "Collège", order: 1 },
    { name: "5ème", cycle: "Collège", order: 2 },
    { name: "4ème", cycle: "Collège", order: 3 },
    { name: "3ème", cycle: "Collège", order: 4 },
    { name: "Seconde", cycle: "Lycée", order: 5 },
    { name: "Première", cycle: "Lycée", order: 6 },
    { name: "Terminale", cycle: "Lycée", order: 7 },
  ];
  const levels: Record<string, { id: string }> = {};
  for (const def of levelDefs) {
    const existing = await prisma.level.findFirst({
      where: { establishmentId: establishment.id, name: def.name },
    });
    levels[def.name] =
      existing ??
      (await prisma.level.create({
        data: {
          establishmentId: establishment.id,
          cycleId: cycles[def.cycle].id,
          name: def.name,
          order: def.order,
        },
      }));
  }

  const seriesDefs = [
    { name: "A", level: "Première" },
    { name: "C", level: "Terminale" },
    { name: "D", level: "Terminale" },
  ];
  const series: Record<string, { id: string }> = {};
  for (const def of seriesDefs) {
    const existing = await prisma.series.findFirst({
      where: { establishmentId: establishment.id, name: def.name },
    });
    series[def.name] =
      existing ??
      (await prisma.series.create({
        data: {
          establishmentId: establishment.id,
          levelId: levels[def.level].id,
          name: def.name,
        },
      }));
  }

  const subjectDefs = [
    { name: "Mathématiques", code: "MATH" },
    { name: "Français", code: "FR" },
    { name: "Histoire-Géographie", code: "HG" },
    { name: "Anglais", code: "ANG" },
    { name: "Physique-Chimie", code: "PC" },
    { name: "SVT", code: "SVT" },
    { name: "Philosophie", code: "PHILO" },
    { name: "EPS", code: "EPS" },
    { name: "Informatique", code: "INFO" },
  ];
  for (const def of subjectDefs) {
    const existing = await prisma.subject.findFirst({
      where: { establishmentId: establishment.id, name: def.name },
    });
    if (!existing) {
      await prisma.subject.create({
        data: {
          establishmentId: establishment.id,
          name: def.name,
          code: def.code,
        },
      });
    }
  }

  const periodDefs = [
    { name: "Trimestre 1", order: 1, start: "2025-09-01", end: "2025-12-15" },
    { name: "Trimestre 2", order: 2, start: "2026-01-05", end: "2026-03-28" },
    { name: "Trimestre 3", order: 3, start: "2026-04-06", end: "2026-06-30" },
  ];
  for (const def of periodDefs) {
    const existing = await prisma.period.findFirst({
      where: {
        establishmentId: establishment.id,
        academicYearId: currentYear.id,
        name: def.name,
      },
    });
    if (!existing) {
      await prisma.period.create({
        data: {
          establishmentId: establishment.id,
          academicYearId: currentYear.id,
          name: def.name,
          startDate: new Date(def.start),
          endDate: new Date(def.end),
          order: def.order,
        },
      });
    }
  }

  const classroomDefs = [
    { name: "6ème A", level: "6ème", series: null as string | null, capacity: 45 },
    { name: "6ème B", level: "6ème", series: null as string | null, capacity: 45 },
    { name: "5ème A", level: "5ème", series: null as string | null, capacity: 45 },
    { name: "4ème A", level: "4ème", series: null as string | null, capacity: 45 },
    { name: "3ème A", level: "3ème", series: null as string | null, capacity: 50 },
    { name: "Seconde A", level: "Seconde", series: null as string | null, capacity: 50 },
    { name: "Première A", level: "Première", series: "A", capacity: 40 },
    { name: "Terminale A", level: "Terminale", series: "A", capacity: 40 },
    { name: "Terminale C", level: "Terminale", series: "C", capacity: 40 },
    { name: "Terminale D", level: "Terminale", series: "D", capacity: 40 },
  ];
  for (const def of classroomDefs) {
    const existing = await prisma.classroom.findFirst({
      where: {
        establishmentId: establishment.id,
        academicYearId: currentYear.id,
        name: def.name,
      },
    });
    if (!existing) {
      await prisma.classroom.create({
        data: {
          establishmentId: establishment.id,
          academicYearId: currentYear.id,
          levelId: levels[def.level].id,
          seriesId: def.series ? series[def.series].id : null,
          name: def.name,
          capacity: def.capacity,
        },
      });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    academicYears: await prisma.academicYear.count({
      where: { establishmentId: establishment.id },
    }),
    cycles: await prisma.cycle.count({
      where: { establishmentId: establishment.id },
    }),
    levels: await prisma.level.count({
      where: { establishmentId: establishment.id },
    }),
    series: await prisma.series.count({
      where: { establishmentId: establishment.id },
    }),
    subjects: await prisma.subject.count({
      where: { establishmentId: establishment.id },
    }),
    periods: await prisma.period.count({
      where: { establishmentId: establishment.id },
    }),
    classrooms: await prisma.classroom.count({
      where: { establishmentId: establishment.id },
    }),
  };
  console.log(`Seed étape 1 OK — ${establishment.slug}`, counts);
  console.log(`Comptes test : ${ACCOUNTS.map((a) => a.email).join(", ")} / ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed étape 1 échoué :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
