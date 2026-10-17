import api from "./api";
import { API } from "./api-endpoints";
import type { SelectOption } from "../components/ui/select";

interface LookupMember {
  id: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

const memberLabel = (member: LookupMember) =>
  `${member.user.lastName} ${member.user.firstName} · ${member.user.email}`;

/**
 * Charge les comptes membres éligibles pour un sélecteur de liaison dossier.
 * `role` = rôle attendu du compte, `value` = liaison courante (toujours incluse).
 */
async function loadMemberOptions(
  role: string,
  search: string,
  value: string,
): Promise<SelectOption[]> {
  const params = new URLSearchParams({ role, excludeLinked: "true" });
  if (search) params.set("search", search);
  if (value) params.set("includeUserId", value);
  const raw = (
    await api.get<LookupMember[]>(
      `${API.userEstablishments}/lookup?${params.toString()}`,
    )
  ).data;
  return raw.map((member) => ({
    value: member.user.id,
    label: memberLabel(member),
  }));
}

export const loadStudentAccountOptions = (
  search: string,
  value: string,
): Promise<SelectOption[]> => loadMemberOptions("STUDENT", search, value);

export const loadTeacherAccountOptions = (
  search: string,
  value: string,
): Promise<SelectOption[]> => loadMemberOptions("TEACHER", search, value);

export const loadParentAccountOptions = (
  search: string,
  value: string,
): Promise<SelectOption[]> => loadMemberOptions("PARENT", search, value);
