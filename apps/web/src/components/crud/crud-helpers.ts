import { z } from "zod";

/** Champ numérique optionnel saisi en texte ("", "3", jamais NaN vers l'API). */
export const optionalNumberString = () =>
  z
    .string()
    .trim()
    .optional()
    .refine((v) => v === undefined || v === "" || !Number.isNaN(Number(v)), {
      message: "Nombre invalide",
    });

/** "" | undefined → undefined, sinon Number(v). */
export function toOptionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  return Number(value);
}

/** Champ UUID optionnel saisi en texte ("" = non renseigné, sinon UUID v4). */
export const optionalUuidString = () =>
  z
    .string()
    .trim()
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        v === "" ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
      { message: "UUID invalide" },
    );

/** Supprime les chaînes vides (champs optionnels non renseignés). */
export function omitEmptyStrings<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== "") result[key] = value;
  }
  return result as Partial<T>;
}

/** "2026-09-01T00:00:00.000Z" → "01/09/2026", robuste aux valeurs absentes. */
export function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

/** "2026-09-01T00:00:00.000Z" → "2026-09-01" (input date). */
export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
