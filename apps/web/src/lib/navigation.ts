/**
 * Navigation impérative hors composants (ex. intercepteur axios).
 * Enregistré par une route interne au <BrowserRouter> (voir routes/index.tsx).
 * Repli sur window.location si appelé avant l'enregistrement.
 */
let navigator: ((to: string) => void) | null = null;

export function setNavigator(fn: (to: string) => void) {
  navigator = fn;
}

export function navigateTo(to: string) {
  if (navigator) navigator(to);
  else window.location.href = to;
}
