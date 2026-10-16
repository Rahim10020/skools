import { z } from "zod";
import type { CrudFieldDef } from "../../components/crud/CrudPage";
import {
  formatDateFr,
  omitEmptyStrings,
  optionalUuidString,
  toDateInput,
} from "../../components/crud/crud-helpers";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  phone: string | null;
  address: string | null;
  userId: string | null;
}

export const studentSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  matricule: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  userId: optionalUuidString(),
});

export const studentFields: CrudFieldDef[] = [
  { name: "firstName", label: "Prénom", type: "text", required: true },
  { name: "lastName", label: "Nom", type: "text", required: true },
  { name: "matricule", label: "Matricule", type: "text" },
  {
    name: "gender",
    label: "Genre",
    type: "text",
    placeholder: "Ex : Féminin, Masculin",
  },
  { name: "dateOfBirth", label: "Date de naissance", type: "date" },
  { name: "placeOfBirth", label: "Lieu de naissance", type: "text" },
  { name: "phone", label: "Téléphone", type: "text" },
  { name: "address", label: "Adresse", type: "text" },
  {
    name: "userId",
    label: "Compte utilisateur",
    type: "text",
    placeholder: "UUID du compte (optionnel)",
    helperText: "Lier ce dossier à un compte membre de l'établissement.",
  },
];

export const fullName = (student: Student) =>
  `${student.lastName} ${student.firstName}`;

export function studentToDefaults(student?: Student): Record<string, string> {
  return {
    firstName: student?.firstName ?? "",
    lastName: student?.lastName ?? "",
    matricule: student?.matricule ?? "",
    gender: student?.gender ?? "",
    dateOfBirth: toDateInput(student?.dateOfBirth),
    placeOfBirth: student?.placeOfBirth ?? "",
    phone: student?.phone ?? "",
    address: student?.address ?? "",
    userId: student?.userId ?? "",
  };
}

export function studentToSubmit(values: Record<string, string>) {
  return omitEmptyStrings({
    firstName: values.firstName,
    lastName: values.lastName,
    matricule: values.matricule,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth,
    placeOfBirth: values.placeOfBirth,
    phone: values.phone,
    address: values.address,
    userId: values.userId,
  });
}

export function studentToCsvRow(student: Student): string[] {
  return [
    fullName(student),
    student.matricule ?? "",
    formatDateFr(student.dateOfBirth),
    student.phone ?? "",
  ];
}
