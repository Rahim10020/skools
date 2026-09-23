import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateScheduleDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException(
        "L'heure de début doit être antérieure à l'heure de fin",
      );
    }

    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, establishmentId, isActive: true },
    });
    if (!subject) throw new BadRequestException('Matière invalide');

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, establishmentId, isActive: true },
    });
    if (!academicYear) throw new BadRequestException('Année scolaire invalide');

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: dto.teacherId, establishmentId, isActive: true },
      });
      if (!teacher) throw new BadRequestException('Enseignant invalide');
    }

    return this.prisma.schedule.create({
      data: {
        establishmentId,
        classroomId: dto.classroomId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        academicYearId: dto.academicYearId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      include: {
        classroom: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(establishmentId: string, classroomId?: string) {
    return this.prisma.schedule.findMany({
      where: {
        establishmentId,
        isActive: true,
        ...(classroomId ? { classroomId } : {}),
      },
      include: {
        classroom: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string, establishmentId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, establishmentId },
      include: {
        classroom: true,
        subject: true,
        teacher: true,
        academicYear: true,
      },
    });

    if (!schedule) throw new NotFoundException('Créneau introuvable');
    return schedule;
  }

  async update(id: string, establishmentId: string, dto: UpdateScheduleDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.schedule.update({
      where: { id },
      data: dto,
      include: {
        classroom: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.schedule.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
