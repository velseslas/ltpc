import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Filter,
  ArrowLeft,
  ExternalLink,
  Clock,
  Wrench,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

type SeverityFilter = "all" | "error" | "warning" | "info";
type TypeFilter = "all" | "overdue_test" | "pending_test" | "calibration_due" | "calibration_overdue";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading, isFetching, refetch } = useNotifications();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (severityFilter !== "all" && n.severity !== severityFilter) return false;
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, severityFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      errors: notifications.filter((n) => n.severity === "error").length,
      warnings: notifications.filter((n) => n.severity === "warning").length,
      info: notifications.filter((n) => n.severity === "info").length,
      overdueTests: notifications.filter((n) => n.type === "overdue_test").length,
      pendingTests: notifications.filter((n) => n.type === "pending_test").length,
      calibrationDue: notifications.filter((n) => n.type === "calibration_due").length,
      calibrationOverdue: notifications.filter((n) => n.type === "calibration_overdue").length,
    };
  }, [notifications]);

  const handleRefresh = async () => {
    // Remove cached data so the UI clears and the query is fully refetched
    queryClient.removeQueries({ queryKey: ["notifications"] });
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["notifications"], type: "active" }),
      queryClient.refetchQueries({ queryKey: ["notif-center"], type: "active" }),
      queryClient.refetchQueries({ queryKey: ["notif-center-unread"], type: "active" }),
      refetch(),
    ]);
  };

  const getSeverityIcon = (severity: Notification["severity"]) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "overdue_test":
      case "pending_test":
        return <FlaskConical className="w-4 h-4" />;
      case "calibration_due":
      case "calibration_overdue":
        return <Wrench className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "overdue_test":
        return "Essai en retard";
      case "pending_test":
        return "Essai en attente";
      case "calibration_due":
        return "Étalonnage à prévoir";
      case "calibration_overdue":
        return "Étalonnage en retard";
      default:
        return type;
    }
  };

  const getSeverityBg = (severity: Notification["severity"]) => {
    switch (severity) {
      case "error":
        return "bg-red-500/10 border-l-4 border-l-red-500";
      case "warning":
        return "bg-yellow-500/10 border-l-4 border-l-yellow-500";
      default:
        return "bg-blue-500/10 border-l-4 border-l-blue-400";
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Notifications" }]} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Centre de <span className="text-primary text-glow">Notifications</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et suivez toutes les alertes du laboratoire
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400">Urgents</p>
                <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400">Avertissements</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.warnings}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">Informations</p>
                <p className="text-2xl font-bold text-blue-400">{stats.info}</p>
              </div>
              <Info className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-muted-foreground mb-2 block">
                Sévérité
              </label>
              <Select
                value={severityFilter}
                onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sévérités</SelectItem>
                  <SelectItem value="error">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Urgents
                    </span>
                  </SelectItem>
                  <SelectItem value="warning">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Avertissements
                    </span>
                  </SelectItem>
                  <SelectItem value="info">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Informations
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-muted-foreground mb-2 block">
                Type
              </label>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as TypeFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="overdue_test">Essais en retard</SelectItem>
                  <SelectItem value="pending_test">Essais en attente</SelectItem>
                  <SelectItem value="calibration_overdue">Étalonnages en retard</SelectItem>
                  <SelectItem value="calibration_due">Étalonnages à prévoir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Notifications ({filteredNotifications.length})
            </CardTitle>
            {(severityFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSeverityFilter("all");
                  setTypeFilter("all");
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">Aucune notification</p>
              <p className="text-sm">
                {notifications.length > 0
                  ? "Essayez de modifier les filtres"
                  : "Tout est en ordre !"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => notification.link && navigate(notification.link)}
                  className={cn(
                    "w-full p-4 text-left transition-colors hover:bg-secondary/50",
                    getSeverityBg(notification.severity),
                    notification.link && "cursor-pointer"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {notification.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          {getTypeIcon(notification.type)}
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    {notification.link && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary by Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Essais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10">
                <span className="text-sm text-foreground">En retard</span>
                <Badge variant="destructive">{stats.overdueTests}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10">
                <span className="text-sm text-foreground">En attente (&gt;7j)</span>
                <Badge className="bg-yellow-500 text-black">{stats.pendingTests}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Étalonnages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10">
                <span className="text-sm text-foreground">En retard</span>
                <Badge variant="destructive">{stats.calibrationOverdue}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10">
                <span className="text-sm text-foreground">À prévoir (30j)</span>
                <Badge className="bg-blue-500">{stats.calibrationDue}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
