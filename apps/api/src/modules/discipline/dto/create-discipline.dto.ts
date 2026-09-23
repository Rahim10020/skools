import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { DisciplineType, DisciplineStatus } from '@prisma/client';

export class CreateDisciplineDto {
  @IsUUID()
  studentId: string;

  @IsEnum(DisciplineType)
  type: DisciplineType;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  incidentDate: string;

  @IsEnum(DisciplineStatus)
  @IsOptional()
  status?: DisciplineStatus;
}
