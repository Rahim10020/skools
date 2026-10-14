/**
 * Source unique des endpoints API (base VITE_API_URL + préfixe /api/v1, voir lib/api.ts).
 * Règle : aucun littéral "/…" d'API en dehors de ce fichier — utiliser API.* / apiPath.*.
 * Contrats : docs/frontend-contracts.md.
 */
export const API = {
  authLogin: "/auth/login",
  authRegister: "/auth/register",
  authRefresh: "/auth/refresh",
  authLogout: "/auth/logout",
  authMe: "/auth/me",
  establishments: "/establishments",
  academicYears: "/academic-years",
  cycles: "/cycles",
  levels: "/levels",
  series: "/series",
  subjects: "/subjects",
  periods: "/periods",
  classrooms: "/classrooms",
  students: "/students",
  studentsMe: "/students/me",
  teachers: "/teachers",
  teachersMe: "/teachers/me",
  parents: "/parents",
  parentsMe: "/parents/me",
  parentStudents: "/parent-students",
  myChildren: "/parent-students/my-children",
  teacherAssignments: "/teacher-assignments",
  teacherAssignmentsMe: "/teacher-assignments/me",
  enrollments: "/enrollments",
  exams: "/exams",
  grades: "/grades",
  gradesBulk: "/grades/bulk",
  reportCardsStudent: "/report-cards/student",
  reportCardsClassroom: "/report-cards/classroom",
  attendances: "/attendances",
  attendancesBulk: "/attendances/bulk",
  attendancesByStudent: "/attendances/student",
  schedules: "/schedules",
  discipline: "/discipline",
  userEstablishments: "/user-establishments",
  notifications: "/notifications",
  notificationsUnreadCount: "/notifications/unread-count",
  notificationsReadAll: "/notifications/read-all",
} as const;

/** Builders de query params (un seul formatage par filtre, testé en un point). */
export const apiPath = {
  /** Item REST imbriqué : `${base}/${id}` (mutations use-crud, suppressions). */
  withId: (base: string, id: string) => `${base}/${id}` as const,
  gradesByExam: (examId: string) => `${API.grades}?examId=${examId}` as const,
  gradesByStudent: (studentId: string) => `${API.grades}?studentId=${studentId}` as const,
  attendancesByClass: (classroomId: string, date: string) =>
    `${API.attendances}?classroomId=${classroomId}&date=${date}` as const,
  attendancesByStudent: (studentId: string) =>
    `${API.attendancesByStudent}?studentId=${studentId}` as const,
  disciplineByStudent: (studentId: string) => `${API.discipline}?studentId=${studentId}` as const,
  schedulesByClassroom: (classroomId: string) =>
    `${API.schedules}?classroomId=${classroomId}` as const,
  reportCard: (studentId: string, academicYearId: string, periodId?: string) =>
    `${API.reportCardsStudent}?studentId=${studentId}&academicYearId=${academicYearId}${periodId ? `&periodId=${periodId}` : ""}` as const,
  reportCardClassroom: (classroomId: string, academicYearId: string) =>
    `${API.reportCardsClassroom}?classroomId=${classroomId}&academicYearId=${academicYearId}` as const,
  parentStudentsOfStudent: (studentId: string) =>
    `${API.parentStudents}/student/${studentId}` as const,
  notificationRead: (id: string) => `${API.notifications}/${id}/read` as const,
};
