import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

class AttendanceItemDto {
  @IsUUID()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkAttendanceDto {
  @IsUUID()
  classroomId: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  attendances: AttendanceItemDto[];
}
