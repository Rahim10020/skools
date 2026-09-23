import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
  @IsUUID()
  classroomId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsUUID()
  academicYearId: string;

  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Format attendu: HH:mm',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Format attendu: HH:mm',
  })
  endTime: string;

  @IsString()
  @IsOptional()
  room?: string;
}
