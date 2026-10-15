/** Concatène des classes en ignorant les segments vides/faux. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
