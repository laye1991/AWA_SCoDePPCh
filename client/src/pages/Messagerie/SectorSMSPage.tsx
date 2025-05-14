import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, MessageSquare, Trash2, Paperclip, X, ChevronLeft, ChevronRight, Users, CheckCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

// Types pour les messages
interface Message {
  id: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    role: "admin" | "agent" | "hunter" | "sub-agent" | "hunting-guide";
  };
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    role: "admin" | "agent" | "hunter" | "sub-agent" | "hunting-guide";
  };
  content: string;
  isRead: boolean;
  createdAt: string;
  type?: "standard" | "urgent" | "information";
}

// Composant pour afficher un message
const MessageItem = ({
  msg,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
  isSent,
}: {
  msg: Message;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onMarkAsRead?: (id: number) => void;
  onDelete: (id: number) => void;
  isSent?: boolean;
}) => (
  <div
    className={`flex ${isSent ? "items-end ml-auto" : "items-start"} max-w-[85%] cursor-pointer p-2 rounded-lg ${isSelected ? "bg-gray-50" : ""}`}
    onClick={() => onToggleSelect(msg.id)}
  >
    <div className="flex items-start space-x-3 flex-1">
      {!isSent && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-200">
            {msg.sender.firstName.charAt(0) + msg.sender.lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1">
        <div className={`flex items-center ${isSent ? "justify-end" : ""} space-x-2`}>
          <p className="text-sm font-medium text-gray-800">
            {isSent ? "À: Groupe d'utilisateurs" : `${msg.sender.firstName} ${msg.sender.lastName}`}
          </p>
          {!isSent && (
            <Badge variant="outline" className="text-xs border-gray-300">
              {msg.sender.role === "admin" ? "Administrateur" :
               msg.sender.role === "agent" ? "Agent" :
               msg.sender.role === "sub-agent" ? "Agent Secteur" :
               msg.sender.role === "hunting-guide" ? "Guide de chasse" :
               "Chasseur"}
            </Badge>
          )}
          {msg.type === "urgent" && (
            <Badge className="text-xs bg-red-400 text-white">URGENT</Badge>
          )}
        </div>
        <div className="bg-gray-100 rounded-lg p-3 mt-1 text-sm text-gray-800 break-words">
          {msg.content}
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isSent ? "text-right" : ""}`}>
          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
        </p>
        <p className={`text-xs text-gray-400 ${isSent ? "text-right" : ""}`}>
          {format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
        </p>
      </div>
      {isSent && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-200">
            {msg.sender.firstName.charAt(0) + msg.sender.lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
    {isSelected && (
      <div className="flex space-x-2 ml-2">
        {!isSent && !msg.isRead && onMarkAsRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(msg.id);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(msg.id);
          }}
          className="text-gray-500 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
);

// Composant pour la pagination
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex justify-center items-center space-x-2 mt-4 p-4">
    <Button
      variant="outline"
      size="sm"
      onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
      disabled={currentPage === 1}
    >
      <ChevronLeft className="h-4 w-4" />
      Précédent
    </Button>
    <span className="text-sm text-gray-600">
      Page {currentPage} sur {totalPages}
    </span>
    <Button
      variant="outline"
      size="sm"
      onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
      disabled={currentPage === totalPages}
    >
      Suivant
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);

// Composant pour le formulaire de nouveau message
const NewMessageForm = ({
  message,
  setMessage,
  attachment,
  setAttachment,
  attachmentPreview,
  setAttachmentPreview,
  fileInputRef,
  sendToAllWithActivePermit,
  setSendToAllWithActivePermit,
  sendToActiveGuides,
  setSendToActiveGuides,
  sendToRegionalFaunaDivision,
  setSendToRegionalFaunaDivision,
  sendToSystemAdmin,
  setSendToSystemAdmin,
  isUrgent,
  setIsUrgent,
  isExclusiveSelected,
  isNonExclusiveSelected,
  selectedRecipients,
  sending,
  handleSendMessage,
}: {
  message: string;
  setMessage: (value: string) => void;
  attachment: File | null;
  setAttachment: (file: File | null) => void;
  attachmentPreview: string | null;
  setAttachmentPreview: (value: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  sendToAllWithActivePermit: boolean;
  setSendToAllWithActivePermit: (value: boolean) => void;
  sendToActiveGuides: boolean;
  setSendToActiveGuides: (value: boolean) => void;
  sendToRegionalFaunaDivision: boolean;
  setSendToRegionalFaunaDivision: (value: boolean) => void;
  sendToSystemAdmin: boolean;
  setSendToSystemAdmin: (value: boolean) => void;
  isUrgent: boolean;
  setIsUrgent: (value: boolean) => void;
  isExclusiveSelected: boolean;
  isNonExclusiveSelected: boolean;
  selectedRecipients: string;
  sending: boolean;
  handleSendMessage: () => void;
}) => (
  <div className="p-4 border rounded-md">
    <h2 className="text-lg font-medium mb-4">Nouveau message</h2>
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Colonne gauche : Destinataires */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Destinataires</Label>
          <div className="flex items-center space-x-2">
            <span
              onClick={() => setIsUrgent(!isUrgent)}
              className={`inline-block px-3 py-1 text-sm font-medium text-white rounded-md cursor-pointer transition-colors ${isUrgent ? "bg-red-500" : "bg-red-300"}`}
            >
              Urgent
            </span>
            {!isUrgent && <span className="text-xs text-gray-500">Cliquer pour activer</span>}
          </div>
        </div>
        <div className="space-y-3">
          {[
            {
              label: "Chasseurs avec permis actif",
              value: sendToAllWithActivePermit,
              setValue: setSendToAllWithActivePermit,
              disabled: isExclusiveSelected,
            },
            {
              label: "Guides de chasse actifs",
              value: sendToActiveGuides,
              setValue: setSendToActiveGuides,
              disabled: isExclusiveSelected,
            },
            {
              label: "Division régionale de la Faune",
              value: sendToRegionalFaunaDivision,
              setValue: setSendToRegionalFaunaDivision,
              disabled: isNonExclusiveSelected,
            },
            {
              label: "Administrateur Système",
              value: sendToSystemAdmin,
              setValue: setSendToSystemAdmin,
              disabled: isNonExclusiveSelected,
            },
          ].map(({ label, value, setValue, disabled }) => (
            <div key={label} className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue(!value)}
                disabled={disabled}
                className={`flex items-center space-x-1 ${disabled ? "opacity-50" : ""}`}
              >
                {label.includes("Division") || label.includes("Administrateur") ? (
                  <User className={`h-5 w-5 ${value ? "text-blue-500" : "text-gray-500"}`} />
                ) : (
                  <Users className={`h-5 w-5 ${value ? "text-blue-500" : "text-gray-500"}`} />
                )}
                {value && <CheckCircle className="h-4 w-4 text-green-500" />}
              </Button>
              <Label
                onClick={() => setValue(!value)}
                className={`text-sm text-gray-600 ${disabled ? "opacity-50" : "cursor-pointer"}`}
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
        <p className={`text-sm ${selectedRecipients === "Aucun destinataire sélectionné" ? "text-gray-400" : "text-gray-600"}`}>
          Destinataires : {selectedRecipients}
        </p>
      </div>

      {/* Colonne droite : Message et pièce jointe */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">Message</Label>
        <div className="relative">
          <Textarea
            placeholder="Écrivez votre message (50 mots max)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            className="border-gray-300 rounded-md px-4 py-3 min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 w-full"
          />
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAttachment(file);
                setAttachmentPreview(URL.createObjectURL(file));
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 left-3 text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        {attachmentPreview && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {attachment?.type.startsWith("image/") ? (
                  <img src={attachmentPreview} alt="Aperçu" className="max-w-[100px] h-auto rounded-md" />
                ) : (
                  <span>
                    Fichier : {attachment?.name} ({Math.round((attachment?.size || 0) / 1024)} Ko)
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setAttachment(null);
                  if (attachmentPreview) {
                    URL.revokeObjectURL(attachmentPreview);
                    setAttachmentPreview(null);
                  }
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={sending}
            className="h-9 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {sending ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </div>
    </form>
  </div>
);

export default function SectorSMSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("inbox");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [sendToAllWithActivePermit, setSendToAllWithActivePermit] = useState(false);
  const [sendToActiveGuides, setSendToActiveGuides] = useState(false);
  const [sendToRegionalFaunaDivision, setSendToRegionalFaunaDivision] = useState(false);
  const [sendToSystemAdmin, setSendToSystemAdmin] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const messagesPerPage = 5;
  const [receivedPage, setReceivedPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const [selectedReceivedMessages, setSelectedReceivedMessages] = useState<number[]>([]);
  const [selectedSentMessages, setSelectedSentMessages] = useState<number[]>([]);

  const selectedRecipients = [
    sendToAllWithActivePermit && "Chasseurs avec permis actif",
    sendToActiveGuides && "Guides de chasse actifs",
    sendToRegionalFaunaDivision && "Division régional Faune",
    sendToSystemAdmin && "Administrateur Système",
  ].filter(Boolean).join(", ") || "Aucun destinataire sélectionné";

  const isExclusiveSelected = sendToRegionalFaunaDivision || sendToSystemAdmin;
  const isNonExclusiveSelected = sendToAllWithActivePermit || sendToActiveGuides;

  useEffect(() => {
    if (user?.role === "sub-agent") {
      setReceivedMessages([]);
      setSentMessages([]);
    }
  }, [user]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir un message avant d'envoyer",
        variant: "destructive",
      });
      return;
    }
    if (!sendToAllWithActivePermit && !sendToActiveGuides && !sendToRegionalFaunaDivision && !sendToSystemAdmin) {
      toast({
        title: "Groupe de destinataires manquant",
        description: "Veuillez sélectionner au moins un groupe de destinataires",
        variant: "destructive",
      });
      return;
    }
    if (attachment && attachment.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale acceptée est de 5 Mo",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      setMessage("");
      if (attachment) {
        if (attachmentPreview) {
          URL.revokeObjectURL(attachmentPreview);
          setAttachmentPreview(null);
        }
        setAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      const recipientGroups = [
        sendToAllWithActivePermit && "chasseurs avec permis actif",
        sendToActiveGuides && "guides de chasse actifs",
        sendToRegionalFaunaDivision && "division régional Faune",
        sendToSystemAdmin && "administrateur Système",
      ].filter(Boolean);
      toast({
        title: "Message envoyé",
        description: `Le message a été envoyé aux ${recipientGroups.join(", ")} de votre secteur`,
      });

      const newSentMessage: Message = {
        id: Date.now(),
        sender: {
          id: user?.id || 0,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          role: "sub-agent",
        },
        content: message,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: isUrgent ? "urgent" : "standard",
      };

      setSentMessages((prev) => [newSentMessage, ...prev]);
      setSendToAllWithActivePermit(false);
      setSendToActiveGuides(false);
      setSendToRegionalFaunaDivision(false);
      setSendToSystemAdmin(false);
      setIsUrgent(false);
    }, 1500);
  };

  const markAsRead = (messageId: number) => {
    setReceivedMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const deleteMessage = (messageId: number, messageType: "received" | "sent") => {
    if (messageType === "received") {
      setReceivedMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
      setSelectedReceivedMessages((prev) => prev.filter((id) => id !== messageId));
    } else {
      setSentMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
      setSelectedSentMessages((prev) => prev.filter((id) => id !== messageId));
    }
    toast({
      title: "Message supprimé",
      description: "Le message a été supprimé avec succès",
    });
  };

  const toggleSelectReceivedMessage = (messageId: number) => {
    setSelectedReceivedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const toggleSelectSentMessage = (messageId: number) => {
    setSelectedSentMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const totalReceivedPages = Math.ceil(receivedMessages.length / messagesPerPage);
  const paginatedReceivedMessages = receivedMessages.slice(
    (receivedPage - 1) * messagesPerPage,
    receivedPage * messagesPerPage
  );
  const totalSentPages = Math.ceil(sentMessages.length / messagesPerPage);
  const paginatedSentMessages = sentMessages.slice(
    (sentPage - 1) * messagesPerPage,
    sentPage * messagesPerPage
  );

  return (
    <div className="container mx-auto py-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">Messagerie SMS</h1>

      <Tabs
        defaultValue="inbox"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger
            value="inbox"
            className="flex justify-center items-center gap-2"
            onClick={() => navigate("/sector-sms")}
          >
            <span className="material-icons text-sm">inbox</span>
            Reçus
            {receivedMessages.filter((msg) => !msg.isRead).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {receivedMessages.filter((msg) => !msg.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="flex justify-center items-center gap-2"
            onClick={() => navigate("/sector-sms")}
          >
            <span className="material-icons text-sm">add</span>
            Nouveau
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="flex justify-center items-center gap-2"
            onClick={() => navigate("/sector-sms")}
          >
            <span className="material-icons text-sm">send</span>
            Envoyés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-0">
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-medium mb-4">Messages reçus</h2>
            {paginatedReceivedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 mb-4">
                  <MessageSquare className="w-16 h-16 mx-auto opacity-20" />
                </div>
                <p className="text-gray-500">Aucun message reçu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedReceivedMessages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    isSelected={selectedReceivedMessages.includes(msg.id)}
                    onToggleSelect={toggleSelectReceivedMessage}
                    onMarkAsRead={markAsRead}
                    onDelete={(id) => deleteMessage(id, "received")}
                  />
                ))}
              </div>
            )}
            {totalReceivedPages > 1 && (
              <Pagination
                currentPage={receivedPage}
                totalPages={totalReceivedPages}
                onPageChange={setReceivedPage}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-0">
          <NewMessageForm
            message={message}
            setMessage={setMessage}
            attachment={attachment}
            setAttachment={setAttachment}
            attachmentPreview={attachmentPreview}
            setAttachmentPreview={setAttachmentPreview}
            fileInputRef={fileInputRef}
            sendToAllWithActivePermit={sendToAllWithActivePermit}
            setSendToAllWithActivePermit={setSendToAllWithActivePermit}
            sendToActiveGuides={sendToActiveGuides}
            setSendToActiveGuides={setSendToActiveGuides}
            sendToRegionalFaunaDivision={sendToRegionalFaunaDivision}
            setSendToRegionalFaunaDivision={setSendToRegionalFaunaDivision}
            sendToSystemAdmin={sendToSystemAdmin}
            setSendToSystemAdmin={setSendToSystemAdmin}
            isUrgent={isUrgent}
            setIsUrgent={setIsUrgent}
            isExclusiveSelected={isExclusiveSelected}
            isNonExclusiveSelected={isNonExclusiveSelected}
            selectedRecipients={selectedRecipients}
            sending={sending}
            handleSendMessage={handleSendMessage}
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-0">
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-medium mb-4">Messages envoyés</h2>
            {paginatedSentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 mb-4">
                  <MessageSquare className="w-16 h-16 mx-auto opacity-20" />
                </div>
                <p className="text-gray-500">Aucun message envoyé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedSentMessages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    isSelected={selectedSentMessages.includes(msg.id)}
                    onToggleSelect={toggleSelectSentMessage}
                    onDelete={(id) => deleteMessage(id, "sent")}
                    isSent
                  />
                ))}
              </div>
            )}
            {totalSentPages > 1 && (
              <Pagination
                currentPage={sentPage}
                totalPages={totalSentPages}
                onPageChange={setSentPage}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}