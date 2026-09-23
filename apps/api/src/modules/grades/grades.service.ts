import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { BulkGradesDto } from './dto/bulk-grades.dto.js';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateGradeDto) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: dto.examId, establishmentId, isActive: true },
    });
    if (!exam) throw new BadRequestException('Examen invalide');

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

  async bulkCreate(establishmentId: string, dto: BulkGradesDto) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: dto.examId, establishmentId, isActive: true },
    });
    if (!exam) throw new BadRequestException('Examen invalide');

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

  async findByExam(examId: string, establishmentId: string) {
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

  async findAll(establishmentId: string) {
    return this.prisma.grade.findMany({
      where: { establishmentId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        exam: { select: { id: true, name: true, maxScore: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, establishmentId: string, dto: UpdateGradeDto) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, establishmentId },
    });
    if (!grade) throw new NotFoundException('Note introuvable');

    return this.prisma.grade.update({
      where: { id },
      data: {
        score: dto.isAbsent ? null : dto.score,
        appreciation: dto.appreciation,
        isAbsent: dto.isAbsent,
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, establishmentId },
    });
    if (!grade) throw new NotFoundException('Note introuvable');

    return this.prisma.grade.delete({ where: { id } });
  }
}
