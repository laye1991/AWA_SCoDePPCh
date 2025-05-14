import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, ChevronDown, ChevronUp, User, MapPin, AlertTriangle, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Alert {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  isDeletionRequest?: boolean;
  concernedHunters?: { id: number; name: string }[];
  sender: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export function AlertsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedAlerts, setExpandedAlerts] = useState<number[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertType, setAlertType] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [sentAlerts, setSentAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<"inbox" | "outbox">("inbox");

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ["/api/alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Les données simulées (mockReceivedAlerts) ont été supprimées.
      // Retourne un tableau vide pour la boîte de réception jusqu'à ce qu'une API réelle soit implémentée.
      return [] as Alert[];
    },
    enabled: !!user,
  });

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  useEffect(() => {
    document.title = "Alertes | SCoDePP_Ch";
  }, []);

  const toggleExpand = (alertId: number) => {
    setExpandedAlerts((prev) =>
      prev.includes(alertId) ? prev.filter((id) => id !== alertId) : [...prev, alertId]
    );
  };

  const markAsRead = async (alertId: number) => {
    try {
      const updatedAlerts = alerts.map((alert) =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      );
      queryClient.setQueryData(["/api/alerts", user?.id], updatedAlerts);
      toast({
        title: "Alerte marquée comme lue",
        description: "L'alerte a été marquée comme lue avec succès.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const updatedAlerts = alerts.map((alert) => ({ ...alert, isRead: true }));
      queryClient.setQueryData(["/api/alerts", user?.id], updatedAlerts);
      toast({
        title: "Toutes les alertes marquées comme lues",
        description: "Toutes vos alertes ont été marquées comme lues.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
      });
    }
  };

  const deleteAlert = async (alertId: number) => {
    try {
      const updatedAlerts = alerts.filter((alert) => alert.id !== alertId);
      queryClient.setQueryData(["/api/alerts", user?.id], updatedAlerts);
      setSentAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      toast({
        title: "Alerte supprimée",
        description: "L'alerte a été supprimée définitivement.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression.",
      });
    }
  };

  const getAlertTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          badge: "bg-green-500",
          icon: <CheckCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />,
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          badge: "bg-yellow-500",
          icon: <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />,
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          badge: "bg-red-500",
          icon: <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />,
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          badge: "bg-blue-500",
          icon: <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />,
        };
    }
  };

  const getUrgencyTag = (type: string) => {
    switch (type) {
      case "error":
        return <Badge className="bg-red-500 text-white text-xs sm:text-sm">Urgent</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 text-white text-xs sm:text-sm">Moyen</Badge>;
      default:
        return <Badge className="bg-green-500 text-white text-xs sm:text-sm">Faible</Badge>;
    }
  };

  const getSenderRoleStyle = (alert: Alert) => {
    if (alert.isDeletionRequest) {
      return "bg-red-50";
    }
    switch (alert.sender.role) {
      case "agent":
        return "bg-green-50";
      case "guide-chasse":
        return "bg-yellow-50";
      default:
        return "bg-blue-50";
    }
  };

  const getProvenanceLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "agent":
        return "Agent Forestier";
      case "guide-chasse":
        return "GuideETHER de chasse";
      default:
        return "Chasseur";
    }
  };

  const handleGetLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoadingLocation(false);
          toast({
            title: "Position obtenue",
            description: "Votre position géographique a été capturée avec succès.",
          });
        },
        (error) => {
          setIsLoadingLocation(false);
          toast({
            variant: "destructive",
            title: "Erreur de géolocalisation",
            description: "Impossible d'obtenir votre position. Veuillez activer la géolocalisation.",
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        variant: "destructive",
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
      });
    }
  };

  const handleSendAlert = async () => {
    if (!user || !alertType || !location) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un type d'alerte et obtenir votre position.",
      });
      return;
    }

    const predefinedMessages: { [key: string]: string } = {
      poaching: "Braconnage détecté dans la zone. Intervention urgente requise.",
      illegal_logging: "Trafic de bois illégal observé. Veuillez envoyer une équipe d'inspection.",
      other: customMessage || "Alerte personnalisée. Veuillez vérifier la situation.",
    };

    const newAlert = {
      id: Math.max(...alerts.map((a) => a.id), ...sentAlerts.map((a) => a.id), 0) + 1,
      title: `Alerte: ${alertType === "poaching" ? "Braconnage" : alertType === "illegal_logging" ? "Trafic de bois" : "Autre"}`,
      message: predefinedMessages[alertType],
      type: "error" as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      location,
    };

    try {
      setSentAlerts((prev) => [...prev, newAlert]);
      setShowAlertForm(false);
      setAlertType("");
      setCustomMessage("");
      setLocation(null);
      toast({
        title: "Alerte envoyée",
        description: "Votre alerte a été envoyée aux administrateurs et agents concernés.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi de l'alerte.",
      });
    }
  };

  const canSendAlerts = user && ["hunter", "guide-chasse", "agent"].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="w-full flex-1 flex items-start justify-center py-4 sm:py-6 lg:py-8">
        <div className="w-full bg-white rounded-lg shadow-md flex flex-col">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Messagerie</h1>
              {unreadCount > 0 && activeTab === "inbox" && (
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors rounded-lg text-xs sm:text-sm"
                  onClick={markAllAsRead}
                >
                  Marquer tout comme lu
                </Button>
              )}
            </div>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                className={`flex-1 py-2 text-center font-semibold text-sm sm:text-base ${
                  activeTab === "inbox"
                    ? "bg-white text-gray-800 border-r border-gray-200"
                    : "bg-gray-100 text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("inbox")}
              >
                Boîte de Réception
              </button>
              <button
                className={`flex-1 py-2 text-center font-semibold text-sm sm:text-base ${
                  activeTab === "outbox"
                    ? "bg-white text-gray-800"
                    : "bg-gray-100 text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("outbox")}
              >
                Boîte d'Envoi
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === "inbox" && (
              <>
                {unreadCount > 0 && (
                  <div className="mb-3 sm:mb-4 bg-blue-50 border-blue-200 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-blue-800 font-semibold text-sm sm:text-base">
                      Vous avez {unreadCount} nouvelle(s) alerte(s)
                    </p>
                  </div>
                )}
                {alerts.length === 0 ? (
                  <div className="text-center text-gray-600 mt-8 sm:mt-10">
                    <p className="text-sm sm:text-base">Aucun message dans votre boîte de réception.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <MessageBubble
                      key={alert.id}
                      alert={alert}
                      isExpanded={expandedAlerts.includes(alert.id)}
                      toggleExpand={toggleExpand}
                      markAsRead={markAsRead}
                      deleteAlert={deleteAlert}
                      getAlertTypeStyles={getAlertTypeStyles}
                      getUrgencyTag={getUrgencyTag}
                      getSenderRoleStyle={getSenderRoleStyle}
                      getProvenanceLabel={getProvenanceLabel}
                      isSent={false}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === "outbox" && (
              <>
                {sentAlerts.length === 0 ? (
                  <div className="text-center text-gray-600 mt-8 sm:mt-10">
                    <p className="text-sm sm:text-base">Aucun message dans votre boîte d'envoi.</p>
                  </div>
                ) : (
                  sentAlerts.map((alert) => (
                    <MessageBubble
                      key={alert.id}
                      alert={alert}
                      isExpanded={expandedAlerts.includes(alert.id)}
                      toggleExpand={toggleExpand}
                      markAsRead={markAsRead}
                      deleteAlert={deleteAlert}
                      getAlertTypeStyles={getAlertTypeStyles}
                      getUrgencyTag={getUrgencyTag}
                      getSenderRoleStyle={getSenderRoleStyle}
                      getProvenanceLabel={getProvenanceLabel}
                      isSent={true}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showAlertForm && canSendAlerts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <Card className="bg-white border-blue-200 shadow-xl rounded-xl w-[90%] sm:w-full max-w-md mx-4">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl text-blue-800 font-bold">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Créer une Nouvelle Alerte
              </CardTitle>
              <CardDescription className="text-blue-600 text-sm sm:text-lg">
                Envoyer une alerte urgente avec votre position géographique (obligatoire).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Type d'Alerte</label>
                <Select onValueChange={setAlertType} value={alertType}>
                  <SelectTrigger className="border-blue-300 focus:ring-blue-500 bg-white rounded-lg text-sm sm:text-base">
                    <SelectValue placeholder="Sélectionner le type d'alerte" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-blue-200">
                    <SelectItem value="poaching">Braconnage</SelectItem>
                    <SelectItem value="illegal_logging">Trafic de bois</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {alertType === "other" && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Message Personnalisé</label>
                  <Input
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Décrivez l'incident..."
                    className="border-blue-300 focus:ring-blue-500 bg-white rounded-lg text-sm sm:text-base"
                  />
                </div>
              )}
              <div>
                <Button
                  onClick={handleGetLocation}
                  disabled={isLoadingLocation}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 text-sm sm:text-base"
                >
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  {isLoadingLocation ? "Obtention de la position..." : "Obtenir ma position"}
                </Button>
                {location && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 font-medium">
                    Position: Lat {location.latitude.toFixed(4)}, Lon {location.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAlertForm(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs sm:text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendAlert}
                disabled={!alertType || !location}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 text-xs sm:text-sm"
              >
                Envoyer
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {canSendAlerts && (
        <Button
          onClick={() => setShowAlertForm(true)}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 z-10"
        >
          <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  alert: Alert;
  isExpanded: boolean;
  toggleExpand: (id: number) => void;
  markAsRead: (id: number) => Promise<void>;
  deleteAlert: (id: number) => Promise<void>;
  getAlertTypeStyles: (type: string) => { bg: string; border: string; badge: string; icon: JSX.Element };
  getUrgencyTag: (type: string) => JSX.Element;
  getSenderRoleStyle: (alert: Alert) => string;
  getProvenanceLabel: (role: string) => string;
  isSent: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  alert,
  isExpanded,
  toggleExpand,
  markAsRead,
  deleteAlert,
  getAlertTypeStyles,
  getUrgencyTag,
  getSenderRoleStyle,
  getProvenanceLabel,
  isSent,
}) => {
  const styles = getAlertTypeStyles(alert.type);
  const senderRoleStyle = getSenderRoleStyle(alert);
  const createdAt = new Date(alert.createdAt);
  const formattedDateTime = format(createdAt, "dd/MM/yyyy à HH:mm", { locale: fr });

  return (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"} mb-3 sm:mb-4`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] md:max-w-[60%] p-3 sm:p-4 rounded-2xl shadow-md transition-all duration-300 ${
          isSent ? "bg-blue-100 text-gray-800" : "bg-gray-200 text-gray-800"
        } ${senderRoleStyle}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {styles.icon}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-lg">{alert.title}</h3>
                {getUrgencyTag(alert.type)}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-semibold">
                  {isSent ? "Envoyé par : " : "Reçu de : "} {alert.sender.firstName} {alert.sender.lastName} ({getProvenanceLabel(alert.sender.role)})
                </span>
              </div>
              <div className="text-sm sm:text-base text-gray-500 font-medium">
                <span>{formatDistanceToNow(createdAt, { addSuffix: true, locale: fr })}</span>
                <span className="ml-2">({formattedDateTime})</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleExpand(alert.id)}
            className="hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
          </Button>
        </div>

        {isExpanded && (
          <>
            <Separator className="my-2 sm:my-3 bg-gray-300" />
            <div className="text-gray-700 text-xs sm:text-sm">
              <p className="whitespace-pre-line leading-relaxed">{alert.message}</p>
              {alert.location && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
                  Position: Lat {alert.location.latitude.toFixed(4)}, Lon {alert.location.longitude.toFixed(4)}
                </p>
              )}
              {alert.isDeletionRequest && alert.concernedHunters && alert.concernedHunters.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Chasseurs concernés:</h4>
                  <div className="space-y-2">
                    {alert.concernedHunters.map((hunter) => (
                      <div
                        key={hunter.id}
                        className="p-2 rounded-lg bg-red-50 border border-red-200 flex justify-between items-center text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                          <span className="text-gray-800 font-medium">{hunter.name}</span>
                        </div>
                        <Badge variant="outline" className="border-red-300 text-red-600">
                          ID: {hunter.id}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                <span className="font-medium">Provenance:</span> {getProvenanceLabel(alert.sender.role)}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-2 sm:mt-3">
              {alert.isDeletionRequest && !isSent && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="hover:bg-red-700 transition-colors rounded-lg text-xs sm:text-sm"
                  >
                    Approuver la suppression
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors rounded-lg text-xs sm:text-sm"
                  >
                    Rejeter
                  </Button>
                </>
              )}
              {!alert.isRead && !isSent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead(alert.id)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors rounded-lg text-xs sm:text-sm"
                >
                  Marquer comme lu
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteAlert(alert.id)}
                className="border-red-300 text-red-600 hover:bg-red-50 transition-colors rounded-lg text-xs sm:text-sm"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Supprimer
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
