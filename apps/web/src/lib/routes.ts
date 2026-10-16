/**
 * Source unique des routes frontend (paths React Router).
 * Règle : aucun littéral "/…" en dehors de ce fichier — utiliser ROUTES.*.
 * Voir docs/access-matrix.md pour la matrice (permissions.ts consomme ces constantes).
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  createEstablishment: "/create-establishment",
  academicYears: "/academic-years",
  cycles: "/cycles",
  levels: "/levels",
  series: "/series",
  subjects: "/subjects",
  periods: "/periods",
  classrooms: "/classrooms",
  classroomDetails: "/classrooms/:id",
  students: "/students",
  studentDetails: "/students/:id",
  teachers: "/teachers",
  teacherDetails: "/teachers/:id",
  parents: "/parents",
  linkParents: "/link-parents",
  teacherAssignments: "/teacher-assignments",
  enrollments: "/enrollments",
  exams: "/exams",
  grades: "/grades",
  reportCards: "/report-cards",
  attendances: "/attendances",
  schedules: "/schedules",
  discipline: "/discipline",
  myChildren: "/my-children",
  myGrades: "/my-grades",
  myAbsences: "/my-absences",
  users: "/users",
  userDetails: "/users/:id",
  settings: "/settings",
  profil: "/profil",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Les liens renvoyés par l'API notifications doivent pointer vers une route connue. */
export function isKnownRoute(path: string): path is AppRoute {
  return (Object.values(ROUTES) as string[]).includes(path);
}
