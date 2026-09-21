import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';

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
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.teacher.findMany({
      where: { establishmentId, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
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

  async update(id: string, establishmentId: string, dto: UpdateTeacherDto) {
    await this.findOne(id, establishmentId);

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
