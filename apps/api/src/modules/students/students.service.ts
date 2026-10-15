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
   * Liste façon epl : `?search=&gender=&classroomId=&page=&limit=`.
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
    if (query.gender) where.gender = query.gender;
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
