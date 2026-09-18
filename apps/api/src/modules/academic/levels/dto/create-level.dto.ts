import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLevelDto {
  @IsUUID()
  cycleId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string; // 6ème, 5ème, Seconde...

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
