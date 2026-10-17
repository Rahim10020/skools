import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Role } from '@prisma/client';

/**
 * Recherche de comptes membres pour un sélecteur de liaison dossier → compte.
 * `excludeLinked` exclut les comptes déjà rattachés à un dossier du même type
 * (l'exception `includeUserId` reste visible : c'est la liaison courante).
 */
export class LookupAccountsQuery {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Compte à toujours inclure (liaison courante). */
  @IsOptional()
  @IsUUID()
  includeUserId?: string;

  /** Exclut les comptes déjà liés à un dossier du type `role`. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  excludeLinked?: boolean;
}
