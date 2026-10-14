import { ROUTES } from "../../lib/routes";
import type { IconComponent } from "../icons/Icon";
import DashboardIcon from "../icons/DashboardIcon";
import { FolderIcon } from "../icons/FolderIcon";
import NotePadIcon from "../icons/NotePadIcon";
import { ContactsIcon } from "../icons/ContactsIcon";
import { EyeIcon } from "../icons/EyeIcon";
import { MailIcon } from "../icons/MailIcon";
import { LinkIcon } from "../icons/LinkIcon";
import { ArrowForwardIcon } from "../icons/ArrowForwardIcon";
import { AddIcon } from "../icons/AddIcon";
import CheckCircleIcon from "../icons/CheckCircleIcon";
import { DownloadIcon } from "../icons/DownloadIcon";
import { CheckIcon } from "../icons/CheckIcon";
import { DateIcon } from "../icons/DateIcon";
import { InfoCircleIcon } from "../icons/InfoCircleIcon";

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: IconComponent;
  /** Libellés des pages regroupées (recherche : « cycles » → Structures). */
  keywords?: string[];
  /** Routes unitaires du hub (surbrillance active sur les accès directs). */
  activePaths?: string[];
}

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: IconComponent;
}

export interface SidebarNavGroup {
  title: string;
  /** Ouvert par défaut (préférence persistée + route active priment). */
  defaultOpen?: boolean;
  items: SidebarNavItem[];
}

/**
 * Navigation du shell. Organisation façon matrice (docs/access-matrix.md) :
 * hubs à onglets + pages directes, groupés par domaine.
 * Filtrage par rôle via `canAccess` (matrice docs/access-matrix.md) dans Sidebar.
 * "Utilisateurs & rôles" n'est visible que pour DIRECTOR (groupe Administration).
 */
export const SIDEBAR_NAV: SidebarNavGroup[] = [
  {
    title: "Pilotage",
    defaultOpen: true,
    items: [
      { to: ROUTES.dashboard, label: "Tableau de bord", icon: DashboardIcon },
    ],
  },
  {
    title: "Année Scolaire",
    items: [
      {
        to: ROUTES.structures,
        label: "Structures",
        icon: FolderIcon,
        keywords: ["années scolaires", "cycles", "niveaux", "séries", "classes"],
        activePaths: [
          ROUTES.academicYears,
          ROUTES.cycles,
          ROUTES.levels,
          ROUTES.series,
          ROUTES.classrooms,
        ],
      },
      {
        to: ROUTES.matieresPeriodes,
        label: "Matières & périodes",
        icon: NotePadIcon,
        keywords: ["matières", "périodes"],
        activePaths: [ROUTES.subjects, ROUTES.periods],
      },
      { to: ROUTES.schedules, label: "Emplois du temps", icon: DateIcon },
    ],
  },
  {
    title: "Personnes",
    items: [
      { to: ROUTES.students, label: "Élèves", icon: ContactsIcon },
      { to: ROUTES.teachers, label: "Enseignants", icon: EyeIcon },
      { to: ROUTES.parents, label: "Parents", icon: MailIcon },
      { to: ROUTES.enrollments, label: "Inscriptions", icon: AddIcon },
      { to: ROUTES.linkParents, label: "Lier parents", icon: LinkIcon },
      { to: ROUTES.myChildren, label: "Mes enfants", icon: ContactsIcon },
    ],
  },
  {
    title: "Pédagogie",
    items: [
      {
        to: ROUTES.examensNotes,
        label: "Examens & notes",
        icon: CheckCircleIcon,
        keywords: ["examens", "notes", "saisie"],
        activePaths: [ROUTES.exams, ROUTES.grades],
      },
      { to: ROUTES.reportCards, label: "Bulletins", icon: DownloadIcon },
      { to: ROUTES.myGrades, label: "Mes notes", icon: CheckCircleIcon },
      {
        to: ROUTES.teacherAssignments,
        label: "Affectations",
        icon: ArrowForwardIcon,
      },
    ],
  },
  {
    title: "Vie scolaire",
    items: [
      { to: ROUTES.attendances, label: "Présences", icon: CheckIcon },
      { to: ROUTES.myAbsences, label: "Mes absences", icon: CheckIcon },
      { to: ROUTES.discipline, label: "Discipline", icon: InfoCircleIcon },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: ROUTES.users, label: "Utilisateurs & rôles", icon: ContactsIcon },
    ],
  },
];
