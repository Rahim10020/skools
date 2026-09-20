import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEstablishmentDto } from './dto/create-establishment.dto.js';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto.js';
import { Role } from '@prisma/client';

@Injectable()
export class EstablishmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEstablishmentDto) {
    const existing = await this.prisma.establishment.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Ce slug est déjà utilisé');
    }

    return this.prisma.establishment.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        logoUrl: dto.logoUrl,
      },
    });
  }

  async createWithOwner(dto: CreateEstablishmentDto, userId: string) {
    const existing = await this.prisma.establishment.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Ce slug est déjà utilisé');
    }

    const establishment = await this.prisma.establishment.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        logoUrl: dto.logoUrl,
        users: {
          create: {
            userId,
            role: 'DIRECTOR',
          },
        },
      },
    });

    return establishment;
  }

  async findAll() {
    return this.prisma.establishment.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { id },
    });

    if (!establishment) {
      throw new NotFoundException('Établissement introuvable');
    }

    return establishment;
  }

  async update(id: string, dto: UpdateEstablishmentDto) {
    await this.findOne(id); // vérifie l'existence

    return this.prisma.establishment.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete
    return this.prisma.establishment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignUser(establishmentId: string, userId: string, role: Role) {
    // Vérifie que l’établissement existe
    await this.findOne(establishmentId);

    return this.prisma.userEstablishment.upsert({
      where: {
        userId_establishmentId: {
          userId,
          establishmentId,
        },
      },
      update: { role, isActive: true },
      create: {
        userId,
        establishmentId,
        role,
      },
    });
  }
}
