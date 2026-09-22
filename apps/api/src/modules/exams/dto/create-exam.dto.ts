import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { ExamType } from '@prisma/client';

export class CreateExamDto {
  @IsUUID()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  periodId?: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  @IsOptional()
  classroomId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEnum(ExamType)
  @IsOptional()
  type?: ExamType;

  @IsDateString()
  @IsOptional()
  examDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxScore?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  coefficient?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
