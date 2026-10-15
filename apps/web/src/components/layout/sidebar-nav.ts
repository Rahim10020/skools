import { ROUTES } from "../../lib/routes";
import type { IconComponent } from "../icons/Icon";
import DashboardIcon from "../icons/DashboardIcon";
import { FolderIcon } from "../icons/FolderIcon";
import { FilterIcon } from "../icons/FilterIcon";
import { FileIcon } from "../icons/FileIcon";
import NotePadIcon from "../icons/NotePadIcon";
import CalendarIcon from "../icons/CalendarIcon";
import ClockIcon from "../icons/ClockIcon";
import DoorIcon from "../icons/DoorIcon";
import { ContactsIcon } from "../icons/ContactsIcon";
import { EyeIcon } from "../icons/EyeIcon";
import { MailIcon } from "../icons/MailIcon";
import { LinkIcon } from "../icons/LinkIcon";
import { ArrowForwardIcon } from "../icons/ArrowForwardIcon";
import { AddIcon } from "../icons/AddIcon";
import ExamIcon from "../icons/ExamIcon";
import CheckCircleIcon from "../icons/CheckCircleIcon";
import { DownloadIcon } from "../icons/DownloadIcon";
import { CheckIcon } from "../icons/CheckIcon";
import { DateIcon } from "../icons/DateIcon";
import { InfoCircleIcon } from "../icons/InfoCircleIcon";

export interface SidebarNavChild {
  to: string;
  label: string;
  icon: IconComponent;
}

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: IconComponent;
}

export interface SidebarNavParent {
  label: string;
  icon: IconComponent;
  children: SidebarNavChild[];
}

export type SidebarNavEntry = SidebarNavItem | SidebarNavParent;

export function isNavParent(
  entry: SidebarNavEntry,
): entry is SidebarNavParent {
  return "children" in entry;
}

/**
 * Section statique Année Scolaire : toujours dépliée, titre non cliquable,
 * sans chevron. Fonctionnement conservé tel quel.
 */
export interface SidebarNavSection {
  title: string;
  items: SidebarNavEntry[];
}

/**
 * Navigation du shell. Organisation façon matrice (docs/access-matrix.md) :
 * recherche, Vue d'ensemble, section statique Année Scolaire, entrées
 * parentes à flyout (Personnes, Pédagogie, Vie scolaire), pages directes.
 * Filtrage par rôle via `canAccess` (matrice docs/access-matrix.md) dans Sidebar.
 * "Utilisateurs & rôles" n'est visible que pour DIRECTOR.
 */
export const SIDEBAR_STATIC_SECTION: SidebarNavSection = {
  title: "Année Scolaire",
  items: [
    {
      label: "Structures",
      icon: FolderIcon,
      children: [
        { to: ROUTES.academicYears, label: "Années scolaires", icon: CalendarIcon },
        { to: ROUTES.cycles, label: "Cycles", icon: FolderIcon },
        { to: ROUTES.levels, label: "Niveaux", icon: FilterIcon },
        { to: ROUTES.series, label: "Séries", icon: FileIcon },
        { to: ROUTES.classrooms, label: "Classes", icon: DoorIcon },
      ],
    },
    {
      label: "Matières & périodes",
      icon: NotePadIcon,
      children: [
        { to: ROUTES.subjects, label: "Matières", icon: NotePadIcon },
        { to: ROUTES.periods, label: "Périodes", icon: ClockIcon },
      ],
    },
    { to: ROUTES.schedules, label: "Emplois du temps", icon: DateIcon },
  ],
};

/** Entrées plates : feuille directe ou parent à flyout. */
export const SIDEBAR_ENTRIES: SidebarNavEntry[] = [
  { to: ROUTES.dashboard, label: "Tableau de bord", icon: DashboardIcon },
  {
    label: "Personnes",
    icon: ContactsIcon,
    children: [
      { to: ROUTES.students, label: "Élèves", icon: ContactsIcon },
      { to: ROUTES.teachers, label: "Enseignants", icon: EyeIcon },
      { to: ROUTES.parents, label: "Parents", icon: MailIcon },
      { to: ROUTES.enrollments, label: "Inscriptions", icon: AddIcon },
      { to: ROUTES.linkParents, label: "Lier parents", icon: LinkIcon },
      { to: ROUTES.myChildren, label: "Mes enfants", icon: ContactsIcon },
    ],
  },
  {
    label: "Pédagogie",
    icon: ExamIcon,
    children: [
      { to: ROUTES.exams, label: "Examens", icon: ExamIcon },
      { to: ROUTES.grades, label: "Saisie de notes", icon: CheckCircleIcon },
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
    label: "Vie scolaire",
    icon: CheckIcon,
    children: [
      { to: ROUTES.attendances, label: "Présences", icon: CheckIcon },
      { to: ROUTES.myAbsences, label: "Mes absences", icon: CheckIcon },
      { to: ROUTES.discipline, label: "Discipline", icon: InfoCircleIcon },
    ],
  },
  { to: ROUTES.users, label: "Utilisateurs & rôles", icon: ContactsIcon },
];
