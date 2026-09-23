import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  examId: string;

  @IsUUID()
  studentId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  appreciation?: string;

  @IsBoolean()
  @IsOptional()
  isAbsent?: boolean;
}
