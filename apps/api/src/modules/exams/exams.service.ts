import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import {
  examInScope,
  resolveTeacherScope,
} from '../../common/helpers/teacher-scope.js';
import type { RequestActor } from '../../common/types/request-actor.js';
import { ListExamsQuery } from './dto/list-exams.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../common/helpers/list-query.js';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateExamDto) {
    // Vérifications de base
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) throw new BadRequestException('Année scolaire invalide');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, establishmentId, isActive: true },
    });
    if (!subject) throw new BadRequestException('Matière invalide');

    if (dto.periodId) {
      const period = await this.prisma.period.findFirst({
        where: { id: dto.periodId, establishmentId, isActive: true },
      });
      if (!period) throw new BadRequestException('Période invalide');
    }

    if (dto.classroomId) {
      const classroom = await this.prisma.classroom.findFirst({
        where: { id: dto.classroomId, establishmentId, isActive: true },
      });
      if (!classroom) throw new BadRequestException('Classe invalide');
    }

    return this.prisma.exam.create({
      data: {
        establishmentId,
        academicYearId: dto.academicYearId,
        periodId: dto.periodId,
        subjectId: dto.subjectId,
        classroomId: dto.classroomId,
        name: dto.name,
        type: dto.type,
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
        maxScore: dto.maxScore ?? 20,
        coefficient: dto.coefficient ?? 1,
        isPublished: dto.isPublished ?? false,
      },
      include: {
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Liste avec recherche et pagination : `?search=&subjectId=&classroomId=&periodId=&page=&limit=`.
   * Périmètre enseignant préservé (post-filtre, pagination en mémoire).
   * Sans param → tableau brut historique.
   */
  async findAll(
    establishmentId: string,
    actor?: RequestActor,
    query: ListExamsQuery = {},
  ) {
    const include = {
      subject: { select: { id: true, name: true } },
      classroom: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      period: { select: { id: true, name: true } },
    };
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter:
        query.subjectId !== undefined ||
        query.classroomId !== undefined ||
        query.periodId !== undefined,
    });
    if (!parsed.paginated) {
      const exams = await this.prisma.exam.findMany({
        where: { establishmentId, isActive: true },
        include,
        orderBy: { examDate: 'desc' },
      });
      const scope = await resolveTeacherScope(
        this.prisma,
        establishmentId,
        actor,
      );
      if (!scope) return exams;
      return exams.filter((exam) =>
        examInScope(scope, {
          subjectId: exam.subjectId,
          classroomId: exam.classroomId,
          academicYearId: exam.academicYearId,
        }),
      );
    }

    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (parsed.search) where.name = containsInsensitive(parsed.search);
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.classroomId) where.classroomId = query.classroomId;
    if (query.periodId) where.periodId = query.periodId;
    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (!scope) {
      const [total, items] = await this.prisma.$transaction([
        this.prisma.exam.count({ where }),
        this.prisma.exam.findMany({
          where,
          include,
          orderBy: { examDate: 'desc' },
          skip: parsed.skip,
          take: parsed.limit,
        }),
      ]);
      return paginate(items, total, parsed.page, parsed.limit);
    }
    // Périmètre enseignant : filtre en mémoire puis pagination locale.
    const exams = await this.prisma.exam.findMany({
      where,
      include,
      orderBy: { examDate: 'desc' },
    });
    const visible = exams.filter((exam) =>
      examInScope(scope, {
        subjectId: exam.subjectId,
        classroomId: exam.classroomId,
        academicYearId: exam.academicYearId,
      }),
    );
    return paginate(
      visible.slice(parsed.skip, parsed.skip + parsed.limit),
      visible.length,
      parsed.page,
      parsed.limit,
    );
  }

  async findOne(id: string, establishmentId: string, actor?: RequestActor) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, establishmentId },
      include: {
        subject: true,
        classroom: true,
        academicYear: true,
        period: true,
      },
    });

    if (!exam) throw new NotFoundException('Examen introuvable');

    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (
      scope &&
      !examInScope(scope, {
        subjectId: exam.subjectId,
        classroomId: exam.classroomId,
        academicYearId: exam.academicYearId,
      })
    ) {
      throw new ForbiddenException('Examen hors de votre périmètre');
    }
    return exam;
  }

  async update(id: string, establishmentId: string, dto: UpdateExamDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.exam.update({
      where: { id },
      data: {
        ...dto,
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
      },
      include: {
        subject: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.exam.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
