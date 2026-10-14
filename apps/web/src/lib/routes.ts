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
  structures: "/structures",
  cycles: "/cycles",
  levels: "/levels",
  series: "/series",
  subjects: "/subjects",
  matieresPeriodes: "/matieres-periodes",
  periods: "/periods",
  classrooms: "/classrooms",
  students: "/students",
  teachers: "/teachers",
  parents: "/parents",
  linkParents: "/link-parents",
  teacherAssignments: "/teacher-assignments",
  enrollments: "/enrollments",
  exams: "/exams",
  examensNotes: "/examens-notes",
  grades: "/grades",
  reportCards: "/report-cards",
  attendances: "/attendances",
  schedules: "/schedules",
  discipline: "/discipline",
  myChildren: "/my-children",
  myGrades: "/my-grades",
  myAbsences: "/my-absences",
  users: "/users",
  settings: "/settings",
  profil: "/profil",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Les liens renvoyés par l'API notifications doivent pointer vers une route connue. */
export function isKnownRoute(path: string): path is AppRoute {
  return (Object.values(ROUTES) as string[]).includes(path);
}
