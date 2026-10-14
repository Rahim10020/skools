import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LinkParentStudentDto } from './dto/link-parent-student.dto.js';

@Injectable()
export class ParentStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async link(establishmentId: string, dto: LinkParentStudentDto) {
    const parent = await this.prisma.parent.findFirst({
      where: { id: dto.parentId, establishmentId, isActive: true },
    });
    if (!parent) throw new BadRequestException('Parent invalide');

    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, establishmentId, isActive: true },
    });
    if (!student) throw new BadRequestException('Élève invalide');

    const existing = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: dto.parentId,
          studentId: dto.studentId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Ce parent est déjà lié à cet élève');
    }

    return this.prisma.parentStudent.create({
      data: {
        parentId: dto.parentId,
        studentId: dto.studentId,
        relation: dto.relation ?? 'OTHER',
        isPrimary: dto.isPrimary ?? false,
      },
      include: {
        parent: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
      },
    });
  }

  async findByStudent(studentId: string, establishmentId: string) {
    // Vérifie que l'élève appartient à l'établissement
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, establishmentId },
    });
    if (!student) throw new NotFoundException('Élève introuvable');

    return this.prisma.parentStudent.findMany({
      where: { studentId },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async findByParent(parentId: string, establishmentId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, establishmentId },
    });
    if (!parent) throw new NotFoundException('Parent introuvable');

    return this.prisma.parentStudent.findMany({
      where: { parentId },
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
    });
  }

  async unlink(id: string, establishmentId: string) {
    const link = await this.prisma.parentStudent.findFirst({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!link || link.student.establishmentId !== establishmentId) {
      throw new NotFoundException('Liaison introuvable');
    }

    return this.prisma.parentStudent.delete({ where: { id } });
  }

  /** Enfants du compte connecté (rôle PARENT), avec leur classe de l'année en cours. */
  async findMyChildren(userId: string, establishmentId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { userId, establishmentId, isActive: true },
    });
    if (!parent) {
      throw new NotFoundException('Aucun dossier parent lié à ce compte');
    }

    const links = await this.prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, matricule: true },
        },
      },
      orderBy: { student: { lastName: 'asc' } },
    });

    const currentYear = await this.prisma.academicYear.findFirst({
      where: { establishmentId, isCurrent: true, isActive: true },
      select: { id: true },
    });

    const enrollments = currentYear
      ? await this.prisma.enrollment.findMany({
          where: {
            studentId: { in: links.map((l) => l.student.id) },
            academicYearId: currentYear.id,
            establishmentId,
            isActive: true,
          },
          include: { classroom: { select: { id: true, name: true } } },
        })
      : [];
    const classroomByStudent = new Map(
      enrollments.map((e) => [e.studentId, e.classroom]),
    );

    return links.map((link) => ({
      ...link,
      classroom: classroomByStudent.get(link.student.id) ?? null,
    }));
  }
}
