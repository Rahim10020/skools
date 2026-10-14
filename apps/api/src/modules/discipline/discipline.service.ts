import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateDisciplineDto } from './dto/create-discipline.dto.js';
import { UpdateDisciplineDto } from './dto/update-discipline.dto.js';
import { DisciplineStatus } from '@prisma/client';
import type { RequestActor } from '../../common/types/request-actor.js';
import { assertStudentVisible } from '../../common/helpers/family-scope.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class DisciplineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    establishmentId: string,
    userId: string,
    dto: CreateDisciplineDto,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, establishmentId, isActive: true },
    });
    if (!student) throw new BadRequestException('Élève invalide');

    const record = await this.prisma.disciplineRecord.create({
      data: {
        establishmentId,
        studentId: dto.studentId,
        reportedById: userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        incidentDate: new Date(dto.incidentDate),
        status: dto.status ?? DisciplineStatus.PENDING,
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
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Notifie l'élève et ses parents (comptes liés uniquement).
    const links = await this.prisma.parentStudent.findMany({
      where: { studentId: dto.studentId },
      include: { parent: { select: { userId: true } } },
    });
    await this.notificationsService.notify(establishmentId,
      [student.userId, ...links.map((l) => l.parent.userId)],
      {
        type: 'DISCIPLINE',
        title: `Fiche disciplinaire — ${student.firstName} ${student.lastName}`,
        message: dto.title,
        link: '/discipline',
      },
    );

    return record;
  }

  async findAll(establishmentId: string, studentId?: string, actor?: RequestActor) {
    if (actor?.role === 'STUDENT' || actor?.role === 'PARENT') {
      // Périmètre restreint : un élève filtré est obligatoire.
      if (!studentId) {
        throw new ForbiddenException('Précisez un élève');
      }
      await assertStudentVisible(this.prisma, actor, studentId, establishmentId);
      return this.findByStudent(studentId, establishmentId);
    }

    if (studentId) {
      return this.findByStudent(studentId, establishmentId);
    }

    return this.prisma.disciplineRecord.findMany({
      where: { establishmentId, isActive: true },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  async findByStudent(studentId: string, establishmentId: string) {
    return this.prisma.disciplineRecord.findMany({
      where: { studentId, establishmentId, isActive: true },
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
      orderBy: { incidentDate: 'desc' },
    });
  }

  async findOne(id: string, establishmentId: string) {
    const record = await this.prisma.disciplineRecord.findFirst({
      where: { id, establishmentId },
      include: {
        student: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!record) throw new NotFoundException('Fiche disciplinaire introuvable');
    return record;
  }

  async update(id: string, establishmentId: string, dto: UpdateDisciplineDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.disciplineRecord.update({
      where: { id },
      data: {
        ...dto,
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
        resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : undefined,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.disciplineRecord.update({
      where: { id },
      data: { isActive: false, status: DisciplineStatus.CANCELLED },
    });
  }
}
