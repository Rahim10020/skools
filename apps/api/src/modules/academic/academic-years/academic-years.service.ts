import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto.js';
import { ListAcademicYearsQuery } from './dto/list-academic-years.query.js';
import {
  containsInsensitive,
  paginate,
  parseListQuery,
} from '../../../common/helpers/list-query.js';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(establishmentId: string, dto: CreateAcademicYearDto) {
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    // Si on définit cette année comme courante, on désactive les autres
    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { establishmentId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.create({
      data: {
        establishmentId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  /** Liste façon epl : `?search=&page=&limit=` (sans param → tableau brut). */
  async findAll(establishmentId: string, query: ListAcademicYearsQuery = {}) {
    const parsed = parseListQuery({
      page: query.page,
      limit: query.limit,
      search: query.search,
      hasFilter: false,
    });
    if (!parsed.paginated) {
      return this.prisma.academicYear.findMany({
        where: { establishmentId, isActive: true },
        orderBy: { startDate: 'desc' },
      });
    }
    const where: Record<string, unknown> = {
      establishmentId,
      isActive: true,
    };
    if (parsed.search) where.name = containsInsensitive(parsed.search);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.academicYear.count({ where }),
      this.prisma.academicYear.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: parsed.skip,
        take: parsed.limit,
      }),
    ]);
    return paginate(items, total, parsed.page, parsed.limit);
  }

  async findOne(id: string, establishmentId: string) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id, establishmentId },
    });

    if (!academicYear) {
      throw new NotFoundException('Année académique introuvable');
    }

    return academicYear;
  }

  async update(
    id: string,
    establishmentId: string,
    dto: UpdateAcademicYearDto,
  ) {
    await this.findOne(id, establishmentId);

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { establishmentId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string, establishmentId: string) {
    await this.findOne(id, establishmentId);

    return this.prisma.academicYear.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
