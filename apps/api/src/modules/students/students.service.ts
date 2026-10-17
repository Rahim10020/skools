import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { validateDossierUserLink } from '../../common/helpers/dossier-user-link.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../common/helpers/list-query.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { BulkCreateStudentsDto } from './dto/bulk-students.dto.js';
import { GENDERS } from '../../common/constants/gender.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { ListStudentsQuery } from './dto/list-students.query.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateStudentDto) {
    if (dto.matricule) {
      const existing = await this.prisma.student.findUnique({
        where: {
          establishmentId_matricule: {
            establishmentId,
            matricule: dto.matricule,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Ce matricule existe déjà');
      }
    }

    if (dto.userId) {
      await validateDossierUserLink(
        this.prisma,
        'student',
        establishmentId,
        dto.userId,
      );
    }

    return this.prisma.student.create({
      data: {
        establishmentId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        matricule: dto.matricule,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        placeOfBirth: dto.placeOfBirth,
        phone: dto.phone,
        address: dto.address,
        userId: dto.userId,
      },
    });
  }

  /**
   * Import en masse. Chaque ligne est traitée indépendamment : les lignes
   * valides sont créées, les invalides sont signalées (numéro de ligne).
   * Une colonne `classroomName` optionnelle inscrit l'élève dans la classe.
   */
  async bulkCreate(establishmentId: string, dto: BulkCreateStudentsDto) {
    const errors: Array<{ line: number; message: string }> = [];

    const classroomNames = [
      ...new Set(
        dto.students
          .map((row) => row.classroomName?.trim())
          .filter((name): name is string => !!name),
      ),
    ];

    const classrooms = classroomNames.length
      ? await this.prisma.classroom.findMany({
          where: {
            establishmentId,
            isActive: true,
            name: { in: classroomNames, mode: 'insensitive' },
          },
          select: { id: true, name: true },
        })
      : [];
    const classroomByName = new Map(
      classrooms.map((classroom) => [classroom.name.toLowerCase(), classroom.id]),
    );

    let academicYearId = dto.academicYearId;
    if (!academicYearId && classroomNames.length) {
      const current = await this.prisma.academicYear.findFirst({
        where: { establishmentId, isActive: true, isCurrent: true },
        select: { id: true },
      });
      academicYearId = current?.id;
    }

    const matricules = dto.students
      .map((row) => row.matricule?.trim())
      .filter((matricule): matricule is string => !!matricule);
    const existingMatricules = matricules.length
      ? await this.prisma.student.findMany({
          where: { establishmentId, matricule: { in: matricules } },
          select: { matricule: true },
        })
      : [];
    const takenMatricules = new Set(
      existingMatricules
        .map((row) => row.matricule)
        .filter((matricule): matricule is string => !!matricule),
    );
    const seenMatricules = new Set<string>();

    let created = 0;
    let enrolled = 0;

    for (let index = 0; index < dto.students.length; index++) {
      const line = index + 2;
      const row = dto.students[index];
      const firstName = row.firstName?.trim();
      const lastName = row.lastName?.trim();
      if (!firstName || !lastName) {
        errors.push({ line, message: 'Prénom et nom requis' });
        continue;
      }

      const matricule = row.matricule?.trim();
      if (matricule) {
        if (takenMatricules.has(matricule)) {
          errors.push({ line, message: `Matricule déjà utilisé : ${matricule}` });
          continue;
        }
        if (seenMatricules.has(matricule)) {
          errors.push({
            line,
            message: `Matricule en double dans le fichier : ${matricule}`,
          });
          continue;
        }
      }

      const gender = this.normalizeGender(row.gender);
      if (row.gender && !gender) {
        errors.push({ line, message: `Genre invalide : ${row.gender}` });
        continue;
      }

      let classroomId: string | undefined;
      const classroomName = row.classroomName?.trim();
      if (classroomName) {
        if (!academicYearId) {
          errors.push({
            line,
            message: 'Aucune année scolaire active pour inscrire',
          });
          continue;
        }
        classroomId = classroomByName.get(classroomName.toLowerCase());
        if (!classroomId) {
          errors.push({ line, message: `Classe introuvable : ${classroomName}` });
          continue;
        }
      }

      try {
        const student = await this.prisma.student.create({
          data: {
            establishmentId,
            firstName,
            lastName,
            matricule: matricule || undefined,
            gender,
            dateOfBirth: row.dateOfBirth
              ? new Date(row.dateOfBirth)
              : undefined,
            placeOfBirth: row.placeOfBirth,
            phone: row.phone,
            address: row.address,
          },
        });
        if (matricule) {
          takenMatricules.add(matricule);
          seenMatricules.add(matricule);
        }
        created += 1;

        if (classroomId && academicYearId) {
          try {
            await this.prisma.enrollment.create({
              data: {
                establishmentId,
                studentId: student.id,
                classroomId,
                academicYearId,
              },
            });
            enrolled += 1;
          } catch {
            errors.push({ line, message: 'Élève créé mais inscription impossible' });
          }
        }
      } catch {
        errors.push({ line, message: 'Création impossible' });
      }
    }

    return { total: dto.students.length, created, enrolled, errors };
  }

  /** Accepte les libellés complets et les anciens codes M/F. */
  private normalizeGender(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (trimmed === 'M') return 'Masculin';
    if (trimmed === 'F') return 'Féminin';
    return (GENDERS as readonly string[]).includes(trimmed)
      ? trimmed
      : undefined;
  }

  /**
   * Liste avec recherche et pagination : `?search=&gender=&classroomId=&page=&limit=`.
   * Sans param → tableau brut historique (compat frontend).
   * Avec param → `{ data, pagination }`.
   */
  async findAll(establishmentId: string, query: ListStudentsQuery = {}) {
    const base = { establishmentId, isActive: true };
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter:
        query.gender !== undefined ||
        query.classroomId !== undefined ||
        query.academicYearId !== undefined,
    });
    if (!parsed.paginated) {
      return this.prisma.student.findMany({
        where: base,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    }

    const where: Record<string, unknown> = { ...base };
    if (parsed.search) {
      where.OR = [
        { firstName: containsInsensitive(parsed.search) },
        { lastName: containsInsensitive(parsed.search) },
        { matricule: containsInsensitive(parsed.search) },
      ];
    }
    if (query.gender) {
      // Tolère les libellés complets et les anciens codes M/F.
      const aliases =
        query.gender === 'Masculin'
          ? ['Masculin', 'M']
          : query.gender === 'Féminin'
            ? ['Féminin', 'F']
            : [query.gender];
      where.gender = { in: aliases };
    }
    if (query.classroomId || query.academicYearId) {
      const enrollment: Record<string, unknown> = {};
      if (query.classroomId) enrollment.classroomId = query.classroomId;
      if (query.academicYearId) enrollment.academicYearId = query.academicYearId;
      where.enrollments = { some: enrollment };
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
  }

  async findOne(id: string, establishmentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, establishmentId },
    });

    if (!student) {
      throw new NotFoundException('Élève introuvable');
    }

    return student;
  }

  /** Dossier élève du compte connecté (rôle STUDENT). */
  async findByUserId(userId: string, establishmentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId, establishmentId },
      select: { id: true, firstName: true, lastName: true, matricule: true },
    });

    if (!student) {
      throw new NotFoundException('Dossier élève introuvable pour ce compte');
    }

    return student;
  }

  async update(id: string, establishmentId: string, dto: UpdateStudentDto) {
    await this.findOne(id, establishmentId);

    if (dto.userId) {
      await validateDossierUserLink(
        this.prisma,
        'student',
        establishmentId,
        dto.userId,
      );
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.student.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
