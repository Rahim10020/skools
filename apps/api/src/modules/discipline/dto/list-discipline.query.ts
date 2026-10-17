import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DisciplineStatus, DisciplineType } from '@prisma/client';

/**
 * Filtres liste discipline : `?search=&studentId=&status=&type=&page=&limit=`.
 * `search` porte sur le titre / la description et le nom / prénom de l'élève.
 * Sans param, le service renvoie le tableau brut historique.
 */
export class ListDisciplineQuery {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsEnum(DisciplineStatus)
  status?: DisciplineStatus;

  @IsOptional()
  @IsEnum(DisciplineType)
  type?: DisciplineType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
