import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EstablishmentsModule } from './modules/establishments/establishments.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AcademicYearsModule } from './modules/academic/academic-years/academic-years.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EstablishmentsModule,
    AcademicYearsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
