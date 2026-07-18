import { useState } from "react";
import { Bell, AlertTriangle, AlertCircle, Info, ExternalLink, CheckCheck, Archive, Sparkles } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { usePersistedNotifications, useUnreadNotificationCount, useNotificationActions } from "@/hooks/useNotificationCenter";
import { CATEGORY_META, PRIORITY_META } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationBellProps {
  collapsed?: boolean;
}

export function NotificationBell({ collapsed }: NotificationBellProps) {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: persisted = [] } = usePersistedNotifications({ limit: 20 });
  const { data: persistedUnread = 0 } = useUnreadNotificationCount();
  const { markRead, markAllRead, archive } = useNotificationActions();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const errorCount = notifications.filter((n) => n.severity === "error").length
    + persisted.filter((p) => !p.is_read && (p.priority === "urgent" || p.priority === "critical")).length;
  const warningCount = notifications.filter((n) => n.severity === "warning").length
    + persisted.filter((p) => !p.is_read && p.priority === "warning").length;
  const totalCount = notifications.length + persistedUnread;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const getSeverityIcon = (severity: Notification["severity"]) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityBg = (severity: Notification["severity"]) => {
    switch (severity) {
      case "error":
        return "bg-red-500/10 border-red-500/20 hover:bg-red-500/20";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20";
      default:
        return "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={totalCount > 0 ? `Notifications (${totalCount} non lues)` : "Notifications"}
          className={cn(
            "relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group w-full",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center"
          )}
        >
          <div className="relative flex-shrink-0">
            <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
            {totalCount > 0 && (
              <span
                className={cn(
                  "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full",
                  errorCount > 0
                    ? "bg-red-500 text-white"
                    : warningCount > 0
                    ? "bg-yellow-500 text-black"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-sm font-medium truncate">Notifications</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-sm md:w-80 p-0 bg-popover border-border"
        side="bottom"
        align="center"
        sideOffset={8}
        collisionPadding={16}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Notifications</h3>
          </div>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          )}
        </div>

        <div className="max-h-[50vh] md:max-h-[420px] overflow-y-auto scrollbar-stable">
          {isLoading && notifications.length === 0 && persisted.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 && persisted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {persisted.map((p) => (
                <div
                  key={`p-${p.id}`}
                  className={cn(
                    "w-full p-3 text-left transition-colors border-l-2",
                    p.is_read ? "border-l-border bg-transparent" : "border-l-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {p.source === "ai"
                        ? <Sparkles className="w-4 h-4 text-violet-400" />
                        : <Bell className={cn("w-4 h-4", PRIORITY_META[p.priority].color)} />}
                    </div>
                    <button
                      onClick={() => {
                        if (!p.is_read) markRead.mutate(p.id);
                        if (p.link) { navigate(p.link); setOpen(false); }
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{CATEGORY_META[p.category].label}</Badge>
                      </div>
                      {p.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.message}</p>}
                    </button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => archive.mutate(p.id)} aria-label="Archiver">
                      <Archive className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-3 text-left transition-colors border-l-2",
                    getSeverityBg(notification.severity),
                    notification.link && "cursor-pointer"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    {notification.link && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>


        {(notifications.length > 0 || persisted.length > 0) && (
          <div className="p-3 border-t border-border bg-secondary/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {errorCount} urgent{errorCount > 1 ? "s" : ""}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    {warningCount} avertissement{warningCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {persistedUnread > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => markAllRead.mutate()}>
                    <CheckCheck className="w-3 h-3 mr-1" /> Tout lu
                  </Button>
                )}
                <button
                  onClick={() => { navigate("/notifications"); setOpen(false); }}
                  className="text-xs text-primary hover:underline"
                >
                  Voir tout
                </button>
              </div>
            </div>
          </div>
        )}

      </PopoverContent>
    </Popover>
  );
}
