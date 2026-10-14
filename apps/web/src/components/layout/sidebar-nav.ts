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
    items: [{ to: "/dashboard", label: "Tableau de bord", icon: DashboardIcon }],
  },
  {
    title: "Référentiels",
    items: [
      { to: "/academic-years", label: "Années scolaires", icon: CalendarIcon },
      { to: "/cycles", label: "Cycles", icon: FolderIcon },
      { to: "/levels", label: "Niveaux", icon: FilterIcon },
      { to: "/series", label: "Séries", icon: FileIcon },
      { to: "/subjects", label: "Matières", icon: NotePadIcon },
      { to: "/periods", label: "Périodes", icon: ClockIcon },
      { to: "/classrooms", label: "Classes", icon: DoorIcon },
    ],
  },
  {
    title: "Personnes",
    items: [
      { to: "/students", label: "Élèves", icon: ContactsIcon },
      { to: "/teachers", label: "Enseignants", icon: EyeIcon },
      { to: "/parents", label: "Parents", icon: MailIcon },
      { to: "/link-parents", label: "Lier parents", icon: LinkIcon },
      { to: "/my-children", label: "Mes enfants", icon: ContactsIcon },
      { to: "/teacher-assignments", label: "Affectations", icon: ArrowForwardIcon },
      { to: "/enrollments", label: "Inscriptions", icon: AddIcon },
    ],
  },
  {
    title: "Évaluations",
    items: [
      { to: "/exams", label: "Examens", icon: ExamIcon },
      { to: "/grades", label: "Notes", icon: CheckCircleIcon },
      { to: "/my-grades", label: "Mes notes", icon: CheckCircleIcon },
      { to: "/report-cards", label: "Bulletins", icon: DownloadIcon },
    ],
  },
  {
    title: "Vie scolaire",
    items: [
      { to: "/attendances", label: "Présences", icon: CheckIcon },
      { to: "/my-absences", label: "Mes absences", icon: CheckIcon },
      { to: "/schedules", label: "Emplois du temps", icon: DateIcon },
      { to: "/discipline", label: "Discipline", icon: InfoCircleIcon },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/users", label: "Utilisateurs & rôles", icon: ContactsIcon },
    ],
  },
];
