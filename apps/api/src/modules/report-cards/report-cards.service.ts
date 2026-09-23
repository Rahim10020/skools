import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ReportCardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule les moyennes d'un élève pour une année scolaire (et optionnellement une période)
   */
  async getStudentReport(
    establishmentId: string,
    studentId: string,
    academicYearId: string,
    periodId?: string,
  ) {
    // Vérifie l'élève
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, establishmentId, isActive: true },
    });
    if (!student) throw new NotFoundException('Élève introuvable');

    // Récupère l'inscription de l'élève pour cette année
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        academicYearId,
        establishmentId,
        isActive: true,
      },
      include: {
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    // Récupère tous les examens de l'année (+ période si fournie)
    const exams = await this.prisma.exam.findMany({
      where: {
        establishmentId,
        academicYearId,
        isActive: true,
        ...(periodId ? { periodId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        grades: {
          where: { studentId },
        },
      },
    });

    // Groupe par matière et calcule les moyennes
    const subjectMap = new Map<
      string,
      {
        subjectId: string;
        subjectName: string;
        subjectCode: string | null;
        grades: {
          score: number | null;
          coefficient: number;
          maxScore: number;
          examName: string;
          isAbsent: boolean;
        }[];
      }
    >();

    for (const exam of exams) {
      const grade = exam.grades[0]; // une seule note par élève/examen
      if (!subjectMap.has(exam.subjectId)) {
        subjectMap.set(exam.subjectId, {
          subjectId: exam.subjectId,
          subjectName: exam.subject.name,
          subjectCode: exam.subject.code,
          grades: [],
        });
      }

      subjectMap.get(exam.subjectId)!.grades.push({
        score: grade?.score ?? null,
        coefficient: exam.coefficient,
        maxScore: exam.maxScore,
        examName: exam.name,
        isAbsent: grade?.isAbsent ?? false,
      });
    }

    // Calcul des moyennes par matière
    const subjects = Array.from(subjectMap.values()).map((subject) => {
      let totalWeighted = 0;
      let totalCoef = 0;

      for (const g of subject.grades) {
        if (g.score !== null && !g.isAbsent) {
          // Normalise sur 20 si maxScore différent
          const normalized = (g.score / g.maxScore) * 20;
          totalWeighted += normalized * g.coefficient;
          totalCoef += g.coefficient;
        }
      }

      const average = totalCoef > 0 ? totalWeighted / totalCoef : null;

      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        average: average !== null ? Math.round(average * 100) / 100 : null,
        gradesCount: subject.grades.filter(
          (g) => g.score !== null && !g.isAbsent,
        ).length,
        details: subject.grades,
      };
    });

    // Moyenne générale
    const subjectsWithAverage = subjects.filter((s) => s.average !== null);
    const generalAverage =
      subjectsWithAverage.length > 0
        ? subjectsWithAverage.reduce((sum, s) => sum + (s.average || 0), 0) /
          subjectsWithAverage.length
        : null;

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        matricule: student.matricule,
      },
      classroom: enrollment?.classroom ?? null,
      academicYear: enrollment?.academicYear ?? null,
      subjects,
      generalAverage:
        generalAverage !== null ? Math.round(generalAverage * 100) / 100 : null,
    };
  }

  /**
   * Liste des élèves d'une classe avec leur moyenne générale (aperçu)
   */
  async getClassroomOverview(
    establishmentId: string,
    classroomId: string,
    academicYearId: string,
  ) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        establishmentId,
        classroomId,
        academicYearId,
        isActive: true,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
          },
        },
      },
    });

    const results = [];

    for (const enrollment of enrollments) {
      const report = await this.getStudentReport(
        establishmentId,
        enrollment.studentId,
        academicYearId,
      );
      results.push({
        student: enrollment.student,
        generalAverage: report.generalAverage,
        subjectsCount: report.subjects.length,
      });
    }

    // Trie par moyenne décroissante
    results.sort((a, b) => (b.generalAverage ?? -1) - (a.generalAverage ?? -1));

    return results;
  }
}
