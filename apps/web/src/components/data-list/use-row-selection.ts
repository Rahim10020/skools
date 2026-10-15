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

  const clear = useCallback(() => setSelected(new Set()), []);

  const has = useCallback((id: string) => selected.has(id), [selected]);

  const selectedIds = useMemo(() => [...selected], [selected]);

  return { selected, selectedIds, selectedCount: selected.size, toggle, selectMany, clear, has };
}

export type RowSelection = ReturnType<typeof useRowSelection>;
