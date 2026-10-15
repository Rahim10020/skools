import { useEffect, useState } from "react";

const identityString = String;
const identityParse = <T>(raw: string | null): T | null => raw as T | null;
const flagSerialize = (v: boolean): string => (v ? "1" : "0");
const flagParse = (raw: string | null): boolean | null =>
  raw === null ? null : raw === "1";

/**
 * État persisté en localStorage (stockage indisponible → mémoire de session).
 * Lecture paresseuse une seule fois, écriture à chaque changement.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  serialize: (value: T) => string = identityString,
  parse: (raw: string | null) => T | null = identityParse<T>,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      return parse(localStorage.getItem(key)) ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(value));
    } catch {
      // Stockage indisponible : l'état reste en mémoire de session.
    }
  }, [key, serialize, value]);

  return [value, setValue];
}

/** Variante booléenne (`"1"`/`"0"`), ex. repli de la sidebar. */
export function useLocalStorageFlag(key: string, initial = false): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [value, setValue] = useLocalStorage<boolean>(key, initial, flagSerialize, flagParse);
  return [value, setValue];
}
