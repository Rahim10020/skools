import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { CreateGradeDto } from './create-grade.dto.js';

export class BulkGradesDto {
  @IsUUID()
  examId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeDto)
  grades: CreateGradeDto[];
}
