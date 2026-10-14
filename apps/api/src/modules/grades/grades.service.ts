import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { BulkGradesDto } from './dto/bulk-grades.dto.js';
import {
  examInScope,
  resolveTeacherScope,
} from '../../common/helpers/teacher-scope.js';
import {
  assertStudentVisible,
} from '../../common/helpers/family-scope.js';
import type { RequestActor } from '../../common/types/request-actor.js';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 403 si l'examen est hors du périmètre enseignant (TEACHER uniquement). */
  private async assertExamInTeacherScope(
    establishmentId: string,
    exam: { subjectId: string; classroomId: string | null; academicYearId: string },
    actor?: RequestActor,
  ) {
    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    if (scope && !examInScope(scope, exam)) {
      throw new ForbiddenException('Examen hors de votre périmètre');
    }
  }

  async create(establishmentId: string, dto: CreateGradeDto, actor?: RequestActor) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: dto.examId, establishmentId, isActive: true },
    });
    if (!exam) throw new BadRequestException('Examen invalide');
    await this.assertExamInTeacherScope(establishmentId, exam, actor);

    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, establishmentId, isActive: true },
    });
    if (!student) throw new BadRequestException('Élève invalide');

    const existing = await this.prisma.grade.findUnique({
      where: {
        examId_studentId: {
          examId: dto.examId,
          studentId: dto.studentId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        'Une note existe déjà pour cet élève sur cet examen',
      );
    }

    return this.prisma.grade.create({
      data: {
        establishmentId,
        examId: dto.examId,
        studentId: dto.studentId,
        score: dto.isAbsent ? null : dto.score,
        appreciation: dto.appreciation,
        isAbsent: dto.isAbsent ?? false,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        exam: { select: { id: true, name: true, maxScore: true } },
      },
    });
  }

  async bulkCreate(establishmentId: string, dto: BulkGradesDto, actor?: RequestActor) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: dto.examId, establishmentId, isActive: true },
    });
    if (!exam) throw new BadRequestException('Examen invalide');
    await this.assertExamInTeacherScope(establishmentId, exam, actor);

    const results = [];

    for (const gradeDto of dto.grades) {
      const existing = await this.prisma.grade.findUnique({
        where: {
          examId_studentId: {
            examId: dto.examId,
            studentId: gradeDto.studentId,
          },
        },
      });

      if (existing) {
        // Mise à jour si la note existe déjà
        const updated = await this.prisma.grade.update({
          where: { id: existing.id },
          data: {
            score: gradeDto.isAbsent ? null : gradeDto.score,
            appreciation: gradeDto.appreciation,
            isAbsent: gradeDto.isAbsent ?? false,
          },
        });
        results.push(updated);
      } else {
        const created = await this.prisma.grade.create({
          data: {
            establishmentId,
            examId: dto.examId,
            studentId: gradeDto.studentId,
            score: gradeDto.isAbsent ? null : gradeDto.score,
            appreciation: gradeDto.appreciation,
            isAbsent: gradeDto.isAbsent ?? false,
          },
        });
        results.push(created);
      }
    }

    return results;
  }

  async findByExam(examId: string, establishmentId: string, actor?: RequestActor) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, establishmentId },
    });
    // Examen inconnu → [] (contrat existant) ; hors périmètre → 403.
    if (exam) {
      await this.assertExamInTeacherScope(establishmentId, exam, actor);
    }
    return this.prisma.grade.findMany({
      where: { examId, establishmentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });
  }

  async findAll(
    establishmentId: string,
    actor?: RequestActor,
    filters?: { studentId?: string },
  ) {
    // Périmètre famille : lui-même / ses enfants uniquement.
    if (actor?.role === 'STUDENT' || actor?.role === 'PARENT') {
      if (!filters?.studentId) {
        throw new ForbiddenException('Précisez un élève');
      }
      await assertStudentVisible(
        this.prisma,
        actor,
        filters.studentId,
        establishmentId,
      );
    }

    const scope = await resolveTeacherScope(this.prisma, establishmentId, actor);
    // Restriction aux examens du périmètre (aucune note hors assignation).
    let examIds: string[] | undefined;
    if (scope) {
      const exams = await this.prisma.exam.findMany({
        where: { establishmentId, isActive: true },
        select: { id: true, subjectId: true, classroomId: true, academicYearId: true },
      });
      examIds = exams
        .filter((exam) => examInScope(scope, exam))
        .map((exam) => exam.id);
    }
    // PARENT/STUDENT voient toutes les notes de l'élève (tous examens).
    const studentIds = filters?.studentId ? [filters.studentId] : undefined;
    return this.prisma.grade.findMany({
      where: {
        establishmentId,
        ...(examIds ? { examId: { in: examIds } } : {}),
        ...(studentIds ? { studentId: { in: studentIds } } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        exam: {
          select: {
            id: true,
            name: true,
            maxScore: true,
            examDate: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, establishmentId: string, dto: UpdateGradeDto, actor?: RequestActor) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, establishmentId },
      include: { exam: true },
    });
    if (!grade) throw new NotFoundException('Note introuvable');
    await this.assertExamInTeacherScope(establishmentId, grade.exam, actor);

    return this.prisma.grade.update({
      where: { id },
      data: {
        score: dto.isAbsent ? null : dto.score,
        appreciation: dto.appreciation,
        isAbsent: dto.isAbsent,
      },
    });
  }

  async remove(id: string, establishmentId: string, actor?: RequestActor) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, establishmentId },
      include: { exam: true },
    });
    if (!grade) throw new NotFoundException('Note introuvable');
    await this.assertExamInTeacherScope(establishmentId, grade.exam, actor);

    return this.prisma.grade.delete({ where: { id } });
  }
}
