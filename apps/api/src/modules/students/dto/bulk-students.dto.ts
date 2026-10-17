import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateStudentDto } from './create-student.dto.js';

/** Ligne d'import : champs élève + classe cible optionnelle (par nom). */
export class BulkStudentRowDto extends CreateStudentDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  classroomName?: string;
}

export class BulkCreateStudentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStudentRowDto)
  students: BulkStudentRowDto[];

  /** Année d'inscription (défaut : année en cours de l'établissement). */
  @IsUUID()
  @IsOptional()
  academicYearId?: string;
}
