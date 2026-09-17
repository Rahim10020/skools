import { Module } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service.js';
import { AcademicYearsController } from './academic-years.controller.js';

@Module({
  controllers: [AcademicYearsController],
  providers: [AcademicYearsService],
  exports: [AcademicYearsService],
})
export class AcademicYearsModule {}
