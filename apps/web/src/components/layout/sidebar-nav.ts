import { ROUTES } from "../../lib/routes";
import type { IconComponent } from "../icons/Icon";
import DashboardIcon from "../icons/DashboardIcon";
import CalendarIcon from "../icons/CalendarIcon";
import { FolderIcon } from "../icons/FolderIcon";
import { FilterIcon } from "../icons/FilterIcon";
import { FileIcon } from "../icons/FileIcon";
import NotePadIcon from "../icons/NotePadIcon";
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
 * Navigation du shell. Les routes existantes, groupées par domaine.
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
    title: "Référentiels",
    items: [
      {
        to: ROUTES.academicYears,
        label: "Années scolaires",
        icon: CalendarIcon,
      },
      { to: ROUTES.cycles, label: "Cycles", icon: FolderIcon },
      { to: ROUTES.levels, label: "Niveaux", icon: FilterIcon },
      { to: ROUTES.series, label: "Séries", icon: FileIcon },
      { to: ROUTES.subjects, label: "Matières", icon: NotePadIcon },
      { to: ROUTES.periods, label: "Périodes", icon: ClockIcon },
      { to: ROUTES.classrooms, label: "Classes", icon: DoorIcon },
    ],
  },
  {
    title: "Personnes",
    items: [
      { to: ROUTES.students, label: "Élèves", icon: ContactsIcon },
      { to: ROUTES.teachers, label: "Enseignants", icon: EyeIcon },
      { to: ROUTES.parents, label: "Parents", icon: MailIcon },
      { to: ROUTES.linkParents, label: "Lier parents", icon: LinkIcon },
      { to: ROUTES.myChildren, label: "Mes enfants", icon: ContactsIcon },
      {
        to: ROUTES.teacherAssignments,
        label: "Affectations",
        icon: ArrowForwardIcon,
      },
      { to: ROUTES.enrollments, label: "Inscriptions", icon: AddIcon },
    ],
  },
  {
    title: "Évaluations",
    items: [
      { to: ROUTES.exams, label: "Examens", icon: ExamIcon },
      { to: ROUTES.grades, label: "Notes", icon: CheckCircleIcon },
      { to: ROUTES.myGrades, label: "Mes notes", icon: CheckCircleIcon },
      { to: ROUTES.reportCards, label: "Bulletins", icon: DownloadIcon },
    ],
  },
  {
    title: "Vie scolaire",
    items: [
      { to: ROUTES.attendances, label: "Présences", icon: CheckIcon },
      { to: ROUTES.myAbsences, label: "Mes absences", icon: CheckIcon },
      { to: ROUTES.schedules, label: "Emplois du temps", icon: DateIcon },
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
