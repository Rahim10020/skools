import { IsUUID } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @IsUUID()
  teacherId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  classroomId: string;

  @IsUUID()
  academicYearId: string;
}
