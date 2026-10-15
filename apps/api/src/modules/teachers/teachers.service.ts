import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { validateDossierUserLink } from '../../common/helpers/dossier-user-link.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { ListTeachersQuery } from './dto/list-teachers.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../common/helpers/list-query.js';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateTeacherDto) {
    if (dto.matricule) {
      const existing = await this.prisma.teacher.findUnique({
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
        'teacher',
        establishmentId,
        dto.userId,
      );
    }

    return this.prisma.teacher.create({
      data: {
        establishmentId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        matricule: dto.matricule,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        specialty: dto.specialty,
        userId: dto.userId,
      },
    });
  }

  /** Liste façon epl : `?search=&specialty=&page=&limit=` (sans param → tableau brut). */
  async findAll(establishmentId: string, query: ListTeachersQuery = {}) {
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter: query.specialty !== undefined,
    });
    if (!parsed.paginated) {
      return this.prisma.teacher.findMany({
        where: { establishmentId, isActive: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    }
    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (parsed.search) {
      const match = containsInsensitive(parsed.search);
      where.OR = [
        { firstName: match },
        { lastName: match },
        { matricule: match },
        { specialty: match },
      ];
    }
    if (query.specialty) where.specialty = containsInsensitive(query.specialty);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
  }

  async findOne(id: string, establishmentId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, establishmentId },
    });

    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable');
    }

    return teacher;
  }

  /** Dossier enseignant du compte connecté (rôle TEACHER). */
  async findByUserId(userId: string, establishmentId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, establishmentId },
      select: { id: true, firstName: true, lastName: true, matricule: true },
    });

    if (!teacher) {
      throw new NotFoundException(
        'Dossier enseignant introuvable pour ce compte',
      );
    }

    return teacher;
  }

  async update(id: string, establishmentId: string, dto: UpdateTeacherDto) {
    await this.findOne(id, establishmentId);

    if (dto.userId) {
      await validateDossierUserLink(
        this.prisma,
        'teacher',
        establishmentId,
        dto.userId,
      );
    }

    return this.prisma.teacher.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.teacher.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
