import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClassroomDto {
  @IsUUID()
  academicYearId: string;

  @IsUUID()
  levelId: string;

  @IsUUID()
  @IsOptional()
  seriesId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string; // 6ème A, Terminale C...

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}
