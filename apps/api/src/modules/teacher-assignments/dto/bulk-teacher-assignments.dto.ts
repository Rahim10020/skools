import { Type } from 'class-transformer';
import {
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class BulkTeacherAssignmentItemDto {
  @IsUUID()
  subjectId: string;

  @IsUUID()
  classroomId: string;
}

export class BulkCreateTeacherAssignmentsDto {
  @IsUUID()
  teacherId: string;

  @IsUUID()
  academicYearId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkTeacherAssignmentItemDto)
  assignments: BulkTeacherAssignmentItemDto[];
}
