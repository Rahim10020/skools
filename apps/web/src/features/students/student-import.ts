import type { ImportColumn } from "../../components/crud/CsvImportDialog";

export const STUDENT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "firstName", label: "Prénom", required: true, aliases: ["prenom"] },
  { key: "lastName", label: "Nom", required: true, aliases: ["nom de famille"] },
  { key: "matricule", label: "Matricule", aliases: ["matricule eleve"] },
  { key: "gender", label: "Genre", aliases: ["sexe"] },
  {
    key: "dateOfBirth",
    label: "Date de naissance",
    aliases: ["naissance", "date naissance"],
  },
  { key: "placeOfBirth", label: "Lieu de naissance", aliases: ["lieu naissance"] },
  { key: "phone", label: "Téléphone", aliases: ["telephone", "tel"] },
  { key: "address", label: "Adresse" },
  { key: "classroomName", label: "Classe", aliases: ["classe"] },
];

export const STUDENT_IMPORT_EXAMPLE = [
  "Awa",
  "Diallo",
  "MAT-2026-001",
  "Féminin",
  "15/09/2012",
  "Dakar",
  "77 000 00 00",
  "Cité Keur Gorgui",
  "6ème A",
];

export const STUDENT_IMPORT_PREVIEW_KEYS = [
  "lastName",
  "firstName",
  "matricule",
  "gender",
  "dateOfBirth",
  "classroomName",
];

function normalizeGender(value: string): string | null {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (["f", "feminin", "fille", "female"].includes(normalized)) return "Féminin";
  if (["m", "masculin", "garcon", "male"].includes(normalized)) return "Masculin";
  return null;
}

/** Accepte jj/mm/aaaa, jj-mm-aaaa ou aaaa-mm-jj → renvoie aaaa-mm-jj. */
function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  const dmy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const date = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : trimmed;
  }
  return null;
}

export function normalizeStudentImportRow(record: Record<string, string>): {
  values: Record<string, string>;
  error?: string;
} {
  const values: Record<string, string> = {};
  const firstName = record.firstName?.trim() ?? "";
  const lastName = record.lastName?.trim() ?? "";
  if (!firstName || !lastName) {
    return { values, error: "Prénom et nom requis" };
  }
  values.firstName = firstName;
  values.lastName = lastName;

  if (record.matricule?.trim()) values.matricule = record.matricule.trim();

  if (record.gender?.trim()) {
    const gender = normalizeGender(record.gender);
    if (!gender) return { values, error: `Genre invalide : ${record.gender}` };
    values.gender = gender;
  }

  if (record.dateOfBirth?.trim()) {
    const date = normalizeDate(record.dateOfBirth);
    if (!date) {
      return { values, error: `Date invalide : ${record.dateOfBirth}` };
    }
    values.dateOfBirth = date;
  }

  if (record.placeOfBirth?.trim())
    values.placeOfBirth = record.placeOfBirth.trim();
  if (record.phone?.trim()) values.phone = record.phone.trim();
  if (record.address?.trim()) values.address = record.address.trim();
  if (record.classroomName?.trim())
    values.classroomName = record.classroomName.trim();

  return { values };
}
