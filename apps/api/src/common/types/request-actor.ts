/** Acteur minimal extrait du JWT (req.user) pour les contrôles de périmètre. */
export interface RequestActor {
  id: string;
  role?: string;
}
