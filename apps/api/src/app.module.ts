import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EstablishmentsModule } from './modules/establishments/establishments.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AcademicYearsModule } from './modules/academic/academic-years/academic-years.module.js';
import { CyclesModule } from './modules/academic/cycles/cycles.module.js';
import { LevelsModule } from './modules/academic/levels/levels.module.js';
import { SeriesModule } from './modules/academic/series/series.module.js';
import { ClassroomsModule } from './modules/academic/classrooms/classrooms.module.js';
import { SubjectsModule } from './modules/academic/subjects/subjects.module.js';
import { PeriodsModule } from './modules/academic/periods/periods.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { TeachersModule } from './modules/teachers/teachers.module.js';
import { ParentsModule } from './modules/parents/parents.module.js';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module.js';
import { ExamsModule } from './modules/exams/exams.module.js';
import { GradesModule } from './modules/grades/grades.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EstablishmentsModule,
    AcademicYearsModule,
    CyclesModule,
    LevelsModule,
    SeriesModule,
    ClassroomsModule,
    SubjectsModule,
    PeriodsModule,
    StudentsModule,
    TeachersModule,
    ParentsModule,
    EnrollmentsModule,
    ExamsModule,
    GradesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
