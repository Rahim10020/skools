import { PartialType } from '@nestjs/mapped-types';
import { CreateParentDto } from './create-parent.dto.js';

export class UpdateParentDto extends PartialType(CreateParentDto) {}
