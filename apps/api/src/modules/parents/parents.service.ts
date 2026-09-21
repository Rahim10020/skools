import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateParentDto) {
    return this.prisma.parent.create({
      data: {
        establishmentId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        profession: dto.profession,
      },
    });
  }

  async findAll(establishmentId: string) {
    return this.prisma.parent.findMany({
      where: { establishmentId, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string, establishmentId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, establishmentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent introuvable');
    }

    return parent;
  }

  async update(id: string, establishmentId: string, dto: UpdateParentDto) {
    await this.findOne(id, establishmentId);

    return this.prisma.parent.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.parent.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
