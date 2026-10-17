import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class BulkCreateEnrollmentsDto {
  @IsUUID()
  classroomId: string;

  @IsUUID()
  academicYearId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @IsUUID(undefined, { each: true })
  studentIds: string[];
}
