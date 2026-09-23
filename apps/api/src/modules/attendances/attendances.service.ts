import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto.js';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    establishmentId: string,
    userId: string,
    dto: CreateAttendanceDto,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, establishmentId, isActive: true },
    });
    if (!student) throw new BadRequestException('Élève invalide');

    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    return this.prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: dto.studentId,
          date: new Date(dto.date),
        },
      },
      update: {
        status: dto.status ?? AttendanceStatus.PRESENT,
        notes: dto.notes,
        recordedById: userId,
        classroomId: dto.classroomId,
      },
      create: {
        establishmentId,
        studentId: dto.studentId,
        classroomId: dto.classroomId,
        date: new Date(dto.date),
        status: dto.status ?? AttendanceStatus.PRESENT,
        notes: dto.notes,
        recordedById: userId,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async bulkCreate(
    establishmentId: string,
    userId: string,
    dto: BulkAttendanceDto,
  ) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: dto.classroomId, establishmentId, isActive: true },
    });
    if (!classroom) throw new BadRequestException('Classe invalide');

    const results = [];

    for (const item of dto.attendances) {
      const record = await this.prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: item.studentId,
            date: new Date(dto.date),
          },
        },
        update: {
          status: item.status,
          notes: item.notes,
          recordedById: userId,
          classroomId: dto.classroomId,
        },
        create: {
          establishmentId,
          studentId: item.studentId,
          classroomId: dto.classroomId,
          date: new Date(dto.date),
          status: item.status,
          notes: item.notes,
          recordedById: userId,
        },
      });
      results.push(record);
    }

    return results;
  }

  async findByClassroomAndDate(
    establishmentId: string,
    classroomId: string,
    date: string,
  ) {
    return this.prisma.attendance.findMany({
      where: {
        establishmentId,
        classroomId,
        date: new Date(date),
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
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });
  }

  async findByStudent(studentId: string, establishmentId: string) {
    return this.prisma.attendance.findMany({
      where: { studentId, establishmentId },
      orderBy: { date: 'desc' },
    });
  }
}
