import { API, apiPath } from "../../lib/api-endpoints";
import { KEYS } from "../../lib/query-keys";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { isKnownRoute } from "../../lib/routes";
import { BellIcon } from "../../components/icons/BellIcon";
import { IconButton } from "../../components/ui/icon-button";
import { EmptyState } from "../../components/ui/empty-state";

export type NotificationType =
  "NOTE" | "ABSENCE" | "DISCIPLINE" | "INSCRIPTION" | "MEMBRE" | "INFO";

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<NotificationType, string> = {
  NOTE: "Note",
  ABSENCE: "Absence",
  DISCIPLINE: "Discipline",
  INSCRIPTION: "Inscription",
  MEMBRE: "Compte",
  INFO: "Info",
};

/** « il y a 5 min », « hier », etc. */
function timeAgoFr(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

/**
 * Cloche de notifications (matrice : header, tous les rôles sauf SUPER_ADMIN).
 * Sans topbar desktop (idiome EPL) : bouton dans la sidebar + header mobile,
 * panneau ancré au bouton, compteur non-lus, scrutation 60 s.
 */
export function NotificationsBell({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const listQuery = useQuery({
    queryKey: KEYS.notifications,
    queryFn: async () =>
      (await api.get<AppNotification[]>(API.notifications)).data,
    refetchInterval: 60_000,
    enabled: open,
  });
  const countQuery = useQuery({
    queryKey: KEYS.notificationsUnreadCount,
    queryFn: async () =>
      (await api.get<{ count: number }>(API.notificationsUnreadCount)).data,
    refetchInterval: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: KEYS.notifications });
  };

  const readMutation = useMutation({
    mutationFn: async (id: string) =>
      (await api.patch(apiPath.notificationRead(id))).data,
    onSuccess: () => invalidate(),
  });

  const readAllMutation = useMutation({
    mutationFn: async () => (await api.post(API.notificationsReadAll)).data,
    onSuccess: () => invalidate(),
  });

  // Ferme au clic extérieur et à Échap.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const unread = countQuery.data?.count ?? 0;
  const items = listQuery.data ?? [];

  const handleOpen = (item: AppNotification) => {
    if (!item.readAt) readMutation.mutate(item.id);
    setOpen(false);
    // Garde-fou : un lien inconnu ne navigue jamais (pas de 404 silencieuse).
    if (item.link && isKnownRoute(item.link)) navigate(item.link);
  };

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0 ? `Notifications (${unread} non lue(s))` : "Notifications"
        }
        aria-expanded={open}
        title="Notifications"
      >
        <span className="relative block size-6">
          <BellIcon className="size-full" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--common-red) px-0.5 text-[10px] font-semibold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </IconButton>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={[
            "fixed z-50 flex max-h-[70vh] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-r3 border border-(--skools-border-subtle) bg-(--skools-sidebar-bg) shadow-xl",
            collapsed ? "left-14 bottom-4" : "left-4 bottom-4 lg:left-auto",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-p2 border-b border-(--skools-border-subtle) px-p4 py-p3">
            <p className="text-sb14 text-(--skools-text-primary)">
              Notifications
            </p>
            <button
              type="button"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending || unread === 0}
              className="text-r12 font-medium text-(--common-blue) hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Tout marquer lu
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listQuery.isPending ? (
              <p className="px-p4 py-p6 text-center text-r14 text-(--skools-text-muted)">
                Chargement…
              </p>
            ) : listQuery.isError ? (
              <div className="px-p4 py-p6 text-center">
                <p className="text-r14 text-(--common-red)">
                  {getErrorMessage(listQuery.error)}
                </p>
                <button
                  type="button"
                  onClick={() => void listQuery.refetch()}
                  className="mt-p2 text-r12 font-medium text-(--common-blue) hover:underline"
                >
                  Réessayer
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-p4 py-p2">
                <EmptyState
                  title="Aucune notification"
                  description="Les notes, inscriptions et fiches disciplinaires apparaîtront ici."
                />
              </div>
            ) : (
              <ul className="flex flex-col">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleOpen(item)}
                      className="flex w-full items-start gap-p2 px-p4 py-p3 text-left transition-colors hover:bg-(--skools-interactive-hover-bg)"
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          item.readAt ? "bg-transparent" : "bg-(--common-blue)",
                        ].join(" ")}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-p1">
                        <span className="flex items-center justify-between gap-p2">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-(--skools-text-muted)">
                            {TYPE_LABELS[item.type]}
                          </span>
                          <span className="shrink-0 text-r11 text-(--skools-text-muted)">
                            {timeAgoFr(item.createdAt)}
                          </span>
                        </span>
                        <span className="text-m12 text-(--skools-text-primary)">
                          {item.title}
                        </span>
                        {item.message && (
                          <span className="truncate text-r12 text-(--skools-text-muted)">
                            {item.message}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
