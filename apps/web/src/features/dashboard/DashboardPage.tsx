import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { Card, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ArrowForwardIcon } from "../../components/icons/ArrowForwardIcon";

interface MeResponse {
  establishments: Array<{
    role: string;
    establishment: { id: string; name: string; slug: string };
  }>;
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function todayFr() {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

interface MyAssignment {
  classroom: { id: string; name: string };
  subject: { id: string; name: string };
}

interface Shortcut {
  to: string;
  label: string;
  description: string;
}

const TEACHER_SHORTCUTS: Shortcut[] = [
  { to: "/grades", label: "Saisie des notes", description: "Noter les copies par examen" },
  { to: "/attendances", label: "Appel", description: "Relever les présences du jour" },
  { to: "/schedules", label: "Emploi du temps", description: "Consulter les créneaux" },
  { to: "/exams", label: "Examens", description: "Voir les évaluations" },
];

const STAFF_SHORTCUTS: Shortcut[] = [
  { to: "/students", label: "Élèves", description: "Gérer les dossiers élèves" },
  { to: "/grades", label: "Notes", description: "Suivre les évaluations" },
  { to: "/attendances", label: "Présences", description: "Suivre l'assiduité" },
  { to: "/report-cards", label: "Bulletins", description: "Éditer les bulletins" },
];

export default function DashboardPage() {
  const { user, role, establishmentId } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!establishmentId) {
      navigate("/create-establishment");
    }
  }, [establishmentId, navigate]);

  const enabled = !!establishmentId;
  const isTeacher = role === "TEACHER";
  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await api.get<unknown[]>("/students")).data,
    // Enseignant : pas d'accès aux listes globales (matrice) — stats via ses assignations.
    enabled: enabled && !isTeacher,
  });
  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => (await api.get<unknown[]>("/teachers")).data,
    enabled: enabled && !isTeacher,
  });
  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => (await api.get<unknown[]>("/classrooms")).data,
    enabled: enabled && !isTeacher,
  });
  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: async () => (await api.get<unknown[]>("/exams")).data,
    // /exams est filtré serveur par assignation pour TEACHER.
    enabled,
  });
  const myAssignmentsQuery = useQuery({
    queryKey: ["teacher-assignments", "me"],
    queryFn: async () => (await api.get<MyAssignment[]>("/teacher-assignments/me")).data,
    enabled: enabled && isTeacher,
  });
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<MeResponse>("/auth/me")).data,
  });

  const isLoading = isTeacher
    ? myAssignmentsQuery.isPending || examsQuery.isPending
    : studentsQuery.isPending || teachersQuery.isPending || classroomsQuery.isPending || examsQuery.isPending;
  const failedQuery = isTeacher
    ? [myAssignmentsQuery, examsQuery].find((q) => q.isError)
    : [studentsQuery, teachersQuery, classroomsQuery, examsQuery].find((q) => q.isError);

  const retryAll = () => {
    if (isTeacher) {
      void myAssignmentsQuery.refetch();
      void examsQuery.refetch();
      return;
    }
    void studentsQuery.refetch();
    void teachersQuery.refetch();
    void classroomsQuery.refetch();
    void examsQuery.refetch();
  };

  const establishmentName =
    meQuery.data?.establishments.find((e) => e.establishment.id === establishmentId)
      ?.establishment.name ?? null;

  const myClasses = new Set((myAssignmentsQuery.data ?? []).map((a) => a.classroom.id));
  const mySubjects = new Set((myAssignmentsQuery.data ?? []).map((a) => a.subject.id));

  const stats = isTeacher
    ? [
        { label: "Mes classes", value: myClasses.size, to: "/teacher-assignments" },
        { label: "Mes matières", value: mySubjects.size, to: "/teacher-assignments" },
        { label: "Examens", value: examsQuery.data?.length ?? 0, to: "/exams" },
      ]
    : [
        { label: "Élèves", value: studentsQuery.data?.length ?? 0, to: "/students" },
        { label: "Enseignants", value: teachersQuery.data?.length ?? 0, to: "/teachers" },
        { label: "Classes", value: classroomsQuery.data?.length ?? 0, to: "/classrooms" },
        { label: "Examens", value: examsQuery.data?.length ?? 0, to: "/exams" },
      ];
  const isEmpty = !isLoading && !failedQuery && stats.every((s) => s.value === 0);
  const shortcuts = role === "TEACHER" ? TEACHER_SHORTCUTS : STAFF_SHORTCUTS;

  return (
    <div className="flex flex-col gap-p6">
      <header className="flex flex-col gap-p1">
        <h1 className="text-sb32 text-(--skools-text-primary)">
          {greetingForHour(new Date().getHours())}, {user?.firstName ?? ""}
        </h1>
        <p className="text-r14 text-(--skools-text-muted)">{todayFr()}</p>
      </header>

      {failedQuery ? (
        <ErrorState
          title="Impossible de charger le tableau de bord"
          onRetry={retryAll}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-p4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Chargement du tableau de bord">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-p4">
              <Skeleton className="h-[14px] w-1/2 rounded-r1" />
              <Skeleton className="mt-p3 h-[32px] w-1/3 rounded-r1" />
            </Card>
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          title="Aucune donnée pour le moment"
          description="Commencez par créer une année scolaire, puis des classes et des élèves."
          action={
            <Link
              to="/academic-years"
              className="inline-flex items-center gap-p1 text-r14 font-medium text-(--common-blue) hover:underline"
            >
              Créer une année scolaire <ArrowForwardIcon className="size-4" />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-p4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.to}>
              <Card className="p-p4 transition-colors hover:border-(--black-20)">
                <p className="text-r14 text-(--skools-text-muted)">{stat.label}</p>
                <p className="mt-p1 text-sb32 text-(--skools-text-primary)">{stat.value}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <section aria-label="Accès rapides">
        <h2 className="text-sb16 text-(--skools-text-primary) mb-p3">Accès rapides</h2>
        <div className="grid grid-cols-1 gap-p4 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.to} to={shortcut.to}>
              <Card className="p-p4 transition-colors hover:border-(--black-20)">
                <span className="flex items-center justify-between gap-p2">
                  <CardTitle>{shortcut.label}</CardTitle>
                  <ArrowForwardIcon className="size-4 shrink-0 text-(--skools-icon-muted)" />
                </span>
                <p className="mt-p1 text-r12 text-(--skools-text-muted)">{shortcut.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Ma session">
        <Card className="p-p4">
          <div className="flex flex-wrap items-center gap-x-p6 gap-y-p3">
            <div>
              <p className="text-r12 text-(--skools-text-muted)">Rôle</p>
              <Badge variant="neutral" className="mt-p1">{role ?? "Non défini"}</Badge>
            </div>
            <div>
              <p className="text-r12 text-(--skools-text-muted)">Établissement</p>
              <p className="mt-p1 text-m14 text-(--skools-text-primary)">
                {meQuery.isPending ? "…" : (establishmentName ?? "Aucun établissement")}
              </p>
            </div>
            <div>
              <p className="text-r12 text-(--skools-text-muted)">Email</p>
              <p className="mt-p1 text-m14 text-(--skools-text-primary)">{user?.email}</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
