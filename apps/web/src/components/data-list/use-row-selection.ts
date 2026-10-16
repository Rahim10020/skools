import { useCallback, useMemo, useState } from "react";

/**
 * Sélection de lignes façon Gmail (page visible uniquement).
 * La sélection est réinitialisée par l'appelant quand la page change.
 */
export function useRowSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectMany = useCallback((ids: string[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(
    () =>
      setSelected((prev) => (prev.size === 0 ? prev : new Set<string>())),
    [],
  );

  const has = useCallback((id: string) => selected.has(id), [selected]);

  const selectedIds = useMemo(() => [...selected], [selected]);

  // Identité stable entre rendus (sinon les callbacks consommateurs recréés
  // à chaque passe refont tourner les effets qui en dépendent en boucle).
  return useMemo(
    () => ({
      selected,
      selectedIds,
      selectedCount: selected.size,
      toggle,
      selectMany,
      clear,
      has,
    }),
    [selected, selectedIds, toggle, selectMany, clear, has],
  );
}

export type RowSelection = ReturnType<typeof useRowSelection>;
