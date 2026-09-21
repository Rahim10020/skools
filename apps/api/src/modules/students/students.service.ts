import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';

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
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.student.findMany({
      where: { establishmentId, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
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

  async update(id: string, establishmentId: string, dto: UpdateStudentDto) {
    await this.findOne(id, establishmentId);

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
