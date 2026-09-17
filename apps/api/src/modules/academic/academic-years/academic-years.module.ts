import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { AcademicYearsService } from './academic-years.service.js';
import { AcademicYearsController } from './academic-years.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AcademicYearsController],
  providers: [AcademicYearsService],
  exports: [AcademicYearsService],
})
export class AcademicYearsModule {}
