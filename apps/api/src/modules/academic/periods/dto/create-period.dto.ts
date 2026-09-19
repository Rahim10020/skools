import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePeriodDto {
  @IsUUID()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string; // Trimestre 1, Semestre 1...

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
