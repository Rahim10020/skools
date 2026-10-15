/**
 * Seed de développement.
 * ÉTAPE 1 : socle (établissement → classes) + comptes.
 * ÉTAPE 2 : personnes (500 élèves, 30 enseignants, 200 parents),
 *   liens parent-élève, inscriptions sur l'année courante.
 * ÉTAPE 3 : affectations profs, examens, notes, présences (5 jours),
 *   EDT (6 créneaux/classe), fiches discipline.
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

  // ======================
  // ÉTAPE 2 — personnes + inscriptions (déterministe, seed fixe).
  // ======================
  function mulberry32(seed: number) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20261015);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const rint = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));
  const ascii = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const FIRST_M = [
    "Lamine", "Moussa", "Ibrahim", "Ousmane", "Sekou", "Abdoulaye", "Cheick",
    "Yao", "Koffi", "Kwame", "Jean", "Pierre", "Jacques", "Michel", "Alain",
    "Didier", "Fabrice", "Hervé", "Armand", "Patrick", "Serge", "Olivier",
    "Romaric", "Anderson", "Wilfried", "Stéphane", "Emmanuel", "Samuel",
    "David", "Josué",
  ];
  const FIRST_F = [
    "Awa", "Fatou", "Mariam", "Aïcha", "Aminata", "Fatoumata", "Kadiatou",
    "Nadia", "Aya", "Akissi", "Adjoua", "Marie", "Anne", "Sophie", "Claire",
    "Isabelle", "Nathalie", "Sandra", "Prisca", "Larissa", "Grâce", "Divine",
    "Esther", "Ruth", "Sarah", "Deborah", "Léa", "Chloé", "Inès", "Salimata",
  ];
  const LAST = [
    "Diallo", "Koné", "Touré", "Coulibaly", "Bah", "Barry", "Diarra", "Sy",
    "Traoré", "Camara", "Keïta", "Sow", "Ndiaye", "Kouassi", "Yao", "Koffi",
    "Mensah", "Okafor", "Adeyemi", "Nguessan", "Kacou", "Assi", "Kouamé",
    "Djedje", "Gbagbo", "Ouattara", "Soro", "Kobenan", "Amani", "Konan",
    "Martin", "Bernard", "Dubois", "Laurent", "Moreau", "Simon", "Michel",
    "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel",
    "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine", "Rousseau",
  ];
  const STREETS = [
    "Rue des Jardins, Cocody", "Av. de la Paix, Plateau", "Rue 12, Yopougon",
    "Bd de Marseille, Treichville", "Rue du Canal, Marcory", "Cité Verte, Attécoubé",
    "Rue des Frères, Adjamé", "Av. Noguès, Abobo", "Cité BCEAO, Bingerville",
    "Rue Belle-Vue, Koumassi",
  ];
  const JOBS = [
    "Commerçante", "Enseignant", "Chauffeur", "Infirmière", "Comptable",
    "Menuisier", "Couturière", "Fonctionnaire", "Maçon", "Secrétaire",
  ];
  const SPECIALTIES = [
    "Mathématiques", "Français", "Histoire-Géographie", "Anglais",
    "Physique-Chimie", "SVT", "Philosophie", "EPS", "Informatique",
  ];
  const BIRTH_YEAR_BY_LEVEL: Record<string, number> = {
    "6ème": 2014, "5ème": 2013, "4ème": 2012, "3ème": 2011,
    Seconde: 2010, Première: 2009, Terminale: 2008,
  };

  const existingStudents = await prisma.student.count({
    where: { establishmentId: establishment.id },
  });
  if (existingStudents === 0) {
    // Dossiers enseignants (30). Les 2 comptes profs sont liés à leur dossier.
    const teacherRows = Array.from({ length: 30 }, (_, i) => {
      const male = rand() < 0.5;
      const firstName = male ? pick(FIRST_M) : pick(FIRST_F);
      const lastName = pick(LAST);
      return {
        establishmentId: establishment.id,
        firstName,
        lastName,
        matricule: `T-${String(i + 1).padStart(4, "0")}`,
        gender: male ? "M" : "F",
        phone: `07${String(rint(10000000, 99999999))}`,
        email: `${ascii(firstName)}.${ascii(lastName)}${i}@ecole.test`,
        specialty: SPECIALTIES[i % SPECIALTIES.length],
      };
    });
    await prisma.teacher.createMany({ data: teacherRows });
    for (const [email, specialty] of [
      ["prof.maths@ecole.test", "Mathématiques"],
      ["prof.francais@ecole.test", "Français"],
    ] as const) {
      const user = await prisma.user.findUnique({ where: { email } });
      const dossier = await prisma.teacher.findFirst({
        where: { establishmentId: establishment.id, specialty },
      });
      if (user && dossier) {
        await prisma.teacher.update({
          where: { id: dossier.id },
          data: { userId: user.id },
        });
      }
    }

    // 500 élèves répartis sur les 10 classes (total = 500).
    const classrooms = await prisma.classroom.findMany({
      where: { establishmentId: establishment.id, academicYearId: currentYear.id },
      include: { level: { select: { name: true } } },
    });
    const classByName = new Map(classrooms.map((c) => [c.name, c]));
    const distribution: Array<[string, number]> = [
      ["6ème A", 60], ["6ème B", 60], ["5ème A", 55], ["4ème A", 55],
      ["3ème A", 55], ["Seconde A", 55], ["Première A", 40],
      ["Terminale A", 35], ["Terminale C", 40], ["Terminale D", 45],
    ];
    const studentRows: Array<{
      establishmentId: string;
      firstName: string;
      lastName: string;
      matricule: string;
      gender: string;
      dateOfBirth: Date;
      placeOfBirth: string;
      phone: string | null;
      address: string;
      classroomId: string;
    }> = [];
    let num = 0;
    for (const [className, count] of distribution) {
      const classroom = classByName.get(className);
      if (!classroom) throw new Error(`Classe seed manquante : ${className}`);
      const birthYear = BIRTH_YEAR_BY_LEVEL[classroom.level.name] ?? 2012;
      for (let k = 0; k < count; k++) {
        num += 1;
        const male = rand() < 0.5;
        studentRows.push({
          establishmentId: establishment.id,
          firstName: male ? pick(FIRST_M) : pick(FIRST_F),
          lastName: pick(LAST),
          matricule: `E-${String(num).padStart(4, "0")}`,
          gender: male ? "M" : "F",
          dateOfBirth: new Date(birthYear, rint(0, 11), rint(1, 28)),
          placeOfBirth: pick(["Abidjan", "Bouaké", "Daloa", "Korhogo", "Man"]),
          phone: rand() < 0.3 ? `05${String(rint(10000000, 99999999))}` : null,
          address: pick(STREETS),
          classroomId: classroom.id,
        });
      }
    }
    // `classroomId` sert uniquement à la répartition/inscription ci-dessous.
    await prisma.student.createMany({
      data: studentRows.map(({ classroomId: _cid, ...s }) => s),
    });
    const students = await prisma.student.findMany({
      where: { establishmentId: establishment.id },
      select: { id: true, matricule: true },
      orderBy: { matricule: "asc" },
    });
    const studentClassroom = new Map(
      studentRows.map((row, i) => [students[i].id, row.classroomId]),
    );

    // Lie le compte élève test au premier dossier.
    const eleveUser = await prisma.user.findUnique({
      where: { email: "eleve@ecole.test" },
    });
    if (eleveUser && students.length > 0) {
      await prisma.student.update({
        where: { id: students[0].id },
        data: { userId: eleveUser.id },
      });
    }

    // 200 parents.
    const parentRows = Array.from({ length: 200 }, (_, i) => {
      const male = rand() < 0.5;
      const firstName = male ? pick(FIRST_M) : pick(FIRST_F);
      const lastName = pick(LAST);
      return {
        establishmentId: establishment.id,
        firstName,
        lastName,
        phone: `01${String(rint(10000000, 99999999))}`,
        email: `${ascii(firstName)}.${ascii(lastName)}.p${i}@ecole.test`,
        address: pick(STREETS),
        profession: pick(JOBS),
      };
    });
    await prisma.parent.createMany({ data: parentRows });
    const parents = await prisma.parent.findMany({
      where: { establishmentId: establishment.id },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    const parentUser = await prisma.user.findUnique({
      where: { email: "parent@ecole.test" },
    });
    if (parentUser && parents.length > 0) {
      await prisma.parent.update({
        where: { id: parents[0].id },
        data: { userId: parentUser.id },
      });
    }

    // Liens parent-élève : 1 parent pour les 300 premiers + 2ème parent pour 50.
    const relations = ["FATHER", "MOTHER", "GUARDIAN"] as const;
    const links: Array<{
      parentId: string;
      studentId: string;
      relation: (typeof relations)[number];
      isPrimary: boolean;
    }> = [];
    students.slice(0, 300).forEach((student, i) => {
      links.push({
        parentId: parents[i % parents.length].id,
        studentId: student.id,
        relation: relations[i % relations.length],
        isPrimary: true,
      });
    });
    students.slice(0, 50).forEach((student, i) => {
      links.push({
        parentId: parents[(i + 97) % parents.length].id,
        studentId: student.id,
        relation: "GUARDIAN",
        isPrimary: false,
      });
    });
    await prisma.parentStudent.createMany({ data: links });

    // 1 inscription / élève sur l'année courante (90 % approuvées).
    await prisma.enrollment.createMany({
      data: students.map((student, i) => ({
        establishmentId: establishment.id,
        studentId: student.id,
        classroomId: studentClassroom.get(student.id) as string,
        academicYearId: currentYear.id,
        status: i % 10 === 9 ? "PENDING" : "APPROVED",
        enrolledAt:
          i % 10 === 9
            ? null
            : new Date(2025, 8, rint(1, 20)),
        notes: i % 10 === 9 ? "Dossier en cours de vérification" : null,
      })),
    });
  }

  // ======================
  // ÉTAPE 3 — pédagogie (chaque bloc est skippé s'il existe déjà).
  // ======================
  const COEF: Record<string, number> = {
    MATH: 4, FR: 3, PC: 3, PHILO: 3, SVT: 2, HG: 2, ANG: 2, INFO: 2, EPS: 1,
  };
  function subjectsForClass(className: string, levelName: string): string[] {
    if (className === "Terminale C") return ["MATH", "PC", "SVT", "FR"];
    if (className === "Terminale D") return ["MATH", "SVT", "PC", "FR"];
    if (className === "Terminale A" || className === "Première A")
      return ["PHILO", "FR", "HG", "MATH"];
    if (levelName === "Seconde") return ["MATH", "FR", "PC", "ANG"];
    return ["MATH", "FR", "HG", "ANG"];
  }

  const directorUser = await prisma.user.findUnique({
    where: { email: "director@ecole.test" },
  });
  const allSubjects = await prisma.subject.findMany({
    where: { establishmentId: establishment.id },
  });
  const subjectByCode = new Map(allSubjects.map((s) => [s.code, s]));
  const subjectNameByCode = new Map(allSubjects.map((s) => [s.code, s.name]));
  const trimester1 = await prisma.period.findFirst({
    where: {
      establishmentId: establishment.id,
      academicYearId: currentYear.id,
      name: "Trimestre 1",
    },
  });
  const trimester2 = await prisma.period.findFirst({
    where: {
      establishmentId: establishment.id,
      academicYearId: currentYear.id,
      name: "Trimestre 2",
    },
  });
  const teacherDossiers = await prisma.teacher.findMany({
    where: { establishmentId: establishment.id },
  });
  const teachersBySpecialty = new Map<string, { id: string }[]>();
  for (const t of teacherDossiers) {
    const list = teachersBySpecialty.get(t.specialty ?? "") ?? [];
    list.push({ id: t.id });
    teachersBySpecialty.set(t.specialty ?? "", list);
  }
  const teacherCounters = new Map<string, number>();
  function teacherForSubject(code: string): string | null {
    const name = subjectNameByCode.get(code);
    const list: Array<{ id: string }> =
      (name ? teachersBySpecialty.get(name) : undefined) ?? teacherDossiers;
    if (list.length === 0) return null;
    const i = teacherCounters.get(code) ?? 0;
    teacherCounters.set(code, i + 1);
    return list[i % list.length].id;
  }
  const classroomsFull = await prisma.classroom.findMany({
    where: {
      establishmentId: establishment.id,
      academicYearId: currentYear.id,
    },
    include: { level: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const approvedEnrollments = await prisma.enrollment.findMany({
    where: {
      establishmentId: establishment.id,
      academicYearId: currentYear.id,
      status: "APPROVED",
    },
    select: { studentId: true, classroomId: true },
  });
  const studentsByClass = new Map<string, string[]>();
  for (const e of approvedEnrollments) {
    const list = studentsByClass.get(e.classroomId) ?? [];
    list.push(e.studentId);
    studentsByClass.set(e.classroomId, list);
  }

  // Affectations : 1 prof / matière / classe (~40).
  if (
    trimester1 &&
    (await prisma.teacherAssignment.count({
      where: { establishmentId: establishment.id },
    })) === 0
  ) {
    const rows: Array<{
      establishmentId: string;
      teacherId: string;
      subjectId: string;
      classroomId: string;
      academicYearId: string;
    }> = [];
    for (const classroom of classroomsFull) {
      for (const code of subjectsForClass(classroom.name, classroom.level.name)) {
        const subject = subjectByCode.get(code);
        const teacherId = teacherForSubject(code);
        if (!subject || !teacherId) continue;
        rows.push({
          establishmentId: establishment.id,
          teacherId,
          subjectId: subject.id,
          classroomId: classroom.id,
          academicYearId: currentYear.id,
        });
      }
    }
    await prisma.teacherAssignment.createMany({ data: rows });
  }

  // Examens : 1 composition T1 (publiée) + 1 devoir T2 (brouillon) par matière (~80).
  if (
    trimester1 &&
    trimester2 &&
    (await prisma.exam.count({ where: { establishmentId: establishment.id } })) === 0
  ) {
    const rows: Array<{
      establishmentId: string;
      academicYearId: string;
      periodId: string;
      subjectId: string;
      classroomId: string;
      name: string;
      type: "COMPOSITION" | "DEVOIR";
      examDate: Date;
      maxScore: number;
      coefficient: number;
      isPublished: boolean;
    }> = [];
    for (const classroom of classroomsFull) {
      for (const code of subjectsForClass(classroom.name, classroom.level.name)) {
        const subject = subjectByCode.get(code);
        if (!subject) continue;
        const coef = COEF[code] ?? 2;
        rows.push({
          establishmentId: establishment.id,
          academicYearId: currentYear.id,
          periodId: trimester1.id,
          subjectId: subject.id,
          classroomId: classroom.id,
          name: `${subject.name} — Composition T1`,
          type: "COMPOSITION",
          examDate: new Date(2025, 10, rint(10, 28)),
          maxScore: 20,
          coefficient: coef,
          isPublished: true,
        });
        rows.push({
          establishmentId: establishment.id,
          academicYearId: currentYear.id,
          periodId: trimester2.id,
          subjectId: subject.id,
          classroomId: classroom.id,
          name: `${subject.name} — Devoir T2`,
          type: "DEVOIR",
          examDate: new Date(2026, 1, rint(2, 20)),
          maxScore: 20,
          coefficient: coef,
          isPublished: false,
        });
      }
    }
    await prisma.exam.createMany({ data: rows });
  }

  // Notes : 1 / élève inscrit / examen (~4000, 5 % absents).
  if ((await prisma.grade.count({ where: { establishmentId: establishment.id } })) === 0) {
    const exams = await prisma.exam.findMany({
      where: { establishmentId: establishment.id },
      select: { id: true, classroomId: true },
    });
    const rows: Array<{
      establishmentId: string;
      examId: string;
      studentId: string;
      score: number | null;
      appreciation: string | null;
      isAbsent: boolean;
    }> = [];
    for (const exam of exams) {
      if (!exam.classroomId) continue;
      for (const studentId of studentsByClass.get(exam.classroomId) ?? []) {
        if (rand() < 0.05) {
          rows.push({
            establishmentId: establishment.id,
            examId: exam.id,
            studentId,
            score: null,
            appreciation: "Absent",
            isAbsent: true,
          });
          continue;
        }
        const score = Math.round((8 + rand() * 8) * 2) / 2;
        rows.push({
          establishmentId: establishment.id,
          examId: exam.id,
          studentId,
          score,
          appreciation:
            score >= 16 ? "Excellent" : score >= 14 ? "Bien" : score < 8 ? "Insuffisant" : null,
          isAbsent: false,
        });
      }
    }
    for (let i = 0; i < rows.length; i += 1000) {
      await prisma.grade.createMany({ data: rows.slice(i, i + 1000) });
    }
  }

  // Présences : 5 jours ouvrés × inscrits (~2500).
  if (
    (await prisma.attendance.count({ where: { establishmentId: establishment.id } })) === 0
  ) {
    const days = [8, 9, 10, 11, 12].map((d) => new Date(2025, 8, d));
    const rows: Array<{
      establishmentId: string;
      studentId: string;
      classroomId: string;
      date: Date;
      status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
      notes: string | null;
      recordedById: string | null;
    }> = [];
    for (const [classroomId, studentIds] of studentsByClass) {
      for (const studentId of studentIds) {
        for (const date of days) {
          const r = rand();
          const status =
            r < 0.9 ? "PRESENT" : r < 0.95 ? "LATE" : r < 0.98 ? "ABSENT" : "EXCUSED";
          rows.push({
            establishmentId: establishment.id,
            studentId,
            classroomId,
            date,
            status,
            notes: status === "ABSENT" ? "Absence non justifiée" : status === "EXCUSED" ? "Mot des parents" : null,
            recordedById: directorUser?.id ?? null,
          });
        }
      }
    }
    for (let i = 0; i < rows.length; i += 1000) {
      await prisma.attendance.createMany({ data: rows.slice(i, i + 1000) });
    }
  }

  // EDT : 6 créneaux / classe (~60).
  if (
    (await prisma.schedule.count({ where: { establishmentId: establishment.id } })) === 0
  ) {
    const slots: Array<{
      day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
      start: string;
      end: string;
    }> = [
      { day: "MONDAY", start: "08:00", end: "10:00" },
      { day: "TUESDAY", start: "10:00", end: "12:00" },
      { day: "WEDNESDAY", start: "08:00", end: "10:00" },
      { day: "THURSDAY", start: "14:00", end: "16:00" },
      { day: "FRIDAY", start: "08:00", end: "10:00" },
      { day: "FRIDAY", start: "10:00", end: "12:00" },
    ];
    const rows: Array<{
      establishmentId: string;
      classroomId: string;
      subjectId: string;
      teacherId: string | null;
      academicYearId: string;
      dayOfWeek: (typeof slots)[number]["day"];
      startTime: string;
      endTime: string;
      room: string | null;
    }> = [];
    classroomsFull.forEach((classroom, ci) => {
      const codes = [...subjectsForClass(classroom.name, classroom.level.name), "EPS", "INFO"];
      slots.forEach((slot, si) => {
        const code = codes[(si + ci) % codes.length];
        const subject = subjectByCode.get(code);
        if (!subject) return;
        rows.push({
          establishmentId: establishment.id,
          classroomId: classroom.id,
          subjectId: subject.id,
          teacherId: teacherForSubject(code),
          academicYearId: currentYear.id,
          dayOfWeek: slot.day,
          startTime: slot.start,
          endTime: slot.end,
          room: `S${ci + 1}`,
        });
      });
    });
    await prisma.schedule.createMany({ data: rows });
  }

  // Discipline : 20 fiches réparties.
  if (
    (await prisma.disciplineRecord.count({ where: { establishmentId: establishment.id } })) === 0
  ) {
    const allStudentIds = (
      await prisma.student.findMany({
        where: { establishmentId: establishment.id },
        select: { id: true },
        take: 500,
      })
    ).map((s) => s.id);
    const cases: Array<{
      type: "WARNING" | "OBSERVATION" | "REPRIMAND" | "DETENTION";
      title: string;
    }> = [
      { type: "OBSERVATION", title: "Bavardages répétés en classe" },
      { type: "WARNING", title: "Retard non justifié" },
      { type: "WARNING", title: "Devoir non rendu" },
      { type: "OBSERVATION", title: "Tenue non conforme" },
      { type: "REPRIMAND", title: "Insolence envers un surveillant" },
      { type: "DETENTION", title: "Bagarre dans la cour" },
    ];
    const statuses = ["PENDING", "ACTIVE", "RESOLVED", "RESOLVED"] as const;
    await prisma.disciplineRecord.createMany({
      data: Array.from({ length: 20 }, (_, i) => {
        const c = cases[i % cases.length];
        const status = statuses[i % statuses.length];
        return {
          establishmentId: establishment.id,
          studentId: allStudentIds[(i * 23) % allStudentIds.length],
          reportedById: directorUser?.id ?? null,
          type: c.type,
          status,
          title: c.title,
          description: "Fiche générée par le seed de développement.",
          incidentDate: new Date(2025, 8, rint(2, 25)),
          resolution: status === "RESOLVED" ? "Convocation des parents effectuée" : null,
          resolvedAt: status === "RESOLVED" ? new Date(2025, 8, rint(26, 30)) : null,
        };
      }),
    });
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
    teachers: await prisma.teacher.count({
      where: { establishmentId: establishment.id },
    }),
    students: await prisma.student.count({
      where: { establishmentId: establishment.id },
    }),
    parents: await prisma.parent.count({
      where: { establishmentId: establishment.id },
    }),
    parentLinks: await prisma.parentStudent.count(),
    enrollments: await prisma.enrollment.count({
      where: { establishmentId: establishment.id },
    }),
    assignments: await prisma.teacherAssignment.count({
      where: { establishmentId: establishment.id },
    }),
    exams: await prisma.exam.count({
      where: { establishmentId: establishment.id },
    }),
    grades: await prisma.grade.count({
      where: { establishmentId: establishment.id },
    }),
    attendances: await prisma.attendance.count({
      where: { establishmentId: establishment.id },
    }),
    schedules: await prisma.schedule.count({
      where: { establishmentId: establishment.id },
    }),
    discipline: await prisma.disciplineRecord.count({
      where: { establishmentId: establishment.id },
    }),
  };
  console.log(`Seed étapes 1+2+3 OK — ${establishment.slug}`, counts);
  console.log(`Comptes test : ${ACCOUNTS.map((a) => a.email).join(", ")} / ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed étape 1 échoué :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
