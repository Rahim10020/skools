import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store";
import { requestServerLogout } from "../../lib/api";
import { ROUTES } from "../../lib/routes";
import { ROLES } from "../../lib/roles";
import { roleLabel } from "../../lib/permissions";
import { cx } from "../../lib/cx";
import { Avatar } from "../ui/avatar";
import { IconButton } from "../ui/icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ThemeToggle } from "../ThemeToggle";
import { NotificationsBell } from "../../features/notifications/NotificationsBell";
import { LogOutIcon } from "../icons/LogOutIcon";

/**
 * Pied de sidebar : utilisateur, cloche, thème, déconnexion
 * (version large + version icône en mode replié).
 */
export function SidebarFooter({
  collapsed,
  onCloseMobile,
}: {
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const { user, role, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Utilisateur";

  const handleLogout = async () => {
    await requestServerLogout(refreshToken ?? undefined);
    logout();
    onCloseMobile();
    navigate(ROUTES.login);
  };

  return (
    <div className="border-t border-(--skools-border-subtle) p-p4">
      <div
        className={cx(
          "flex items-center gap-p2",
          collapsed && "lg:flex-col lg:justify-center",
        )}
      >
        <Avatar alt={fullName} />
        <div className={cx("flex-1 min-w-0", collapsed && "lg:hidden")}>
          <p className="text-m12 text-(--skools-text-primary) truncate">
            {fullName}
          </p>
          {role && (
            <p className="text-r11 text-(--skools-text-muted) truncate">
              {roleLabel(role)}
            </p>
          )}
        </div>
        <span className="hidden lg:flex lg:justify-center">
          <ThemeToggle />
        </span>
        {role !== ROLES.SUPER_ADMIN && (
          <span className="hidden lg:flex lg:justify-center">
            <NotificationsBell collapsed={collapsed} onOpen={onCloseMobile} />
          </span>
        )}
      </div>
      <span className={cx(collapsed && "lg:hidden")}>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-p6 cursor-pointer flex w-full items-center gap-p2 rounded-r2 px-p2 h-9 text-m12 text-(--skools-text-muted) hover:bg-(--skools-interactive-hover-bg) hover:text-(--common-red) transition-colors"
        >
          <LogOutIcon className="size-[20px] shrink-0" />
          <span>Déconnexion</span>
        </button>
      </span>
      {collapsed && (
        <span className="hidden lg:mt-p3 lg:flex lg:justify-center">
          <Tooltip>
            <TooltipTrigger>
              <IconButton onClick={handleLogout} aria-label="Déconnexion">
                <LogOutIcon className="size-[20px]" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right">Déconnexion</TooltipContent>
          </Tooltip>
        </span>
      )}
    </div>
  );
}
