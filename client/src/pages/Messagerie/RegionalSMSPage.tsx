import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Inbox, MessageSquareIcon, SendIcon, Paperclip, CheckCircle, Users, User, Info, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { departmentsByRegion } from "@/lib/constants";

interface Message {
  id: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function RegionalSMSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"recu" | "nouveau" | "envoye">("recu");
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedRecipientType, setSelectedRecipientType] = useState("individual");
  const [individualRecipientRole, setIndividualRecipientRole] = useState<"admin" | "hunter" | "agent">("admin");
  const [recipient, setRecipient] = useState("");
  const [agentZone, setAgentZone] = useState("");
  const [sendToAgents, setSendToAgents] = useState(false);
  const [sendToActivePermits, setSendToActivePermits] = useState(false);
  const [sendToExpiringPermits, setSendToExpiringPermits] = useState(false);
  const [sendToActiveGuides, setSendToActiveGuides] = useState(false);
  const [isInfoMessage, setIsInfoMessage] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Simuler des données pour les messages reçus
  useEffect(() => {
    // Dans une vraie application, cela proviendrait d'une API
    setReceivedMessages([]);
    setSentMessages([]);
  }, []);

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir un message avant d'envoyer",
        variant: "destructive",
      });
      return;
    }

    if (messageText.length > 160) {
      toast({
        title: "Erreur",
        description: "Le message dépasse 160 caractères.",
        variant: "destructive",
      });
      return;
    }

    if (attachment && attachment.size > 2 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "La pièce jointe ne doit pas dépasser 2 Mo.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRecipientType === "individual") {
      if (individualRecipientRole === "hunter" && !recipient) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir un ID chasseur.",
          variant: "destructive",
        });
        return;
      }
      if (individualRecipientRole === "agent" && !agentZone) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une zone.",
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedRecipientType === "group" && !sendToAgents && !sendToActivePermits && !sendToExpiringPermits && !sendToActiveGuides) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un groupe de destinataires.",
        variant: "destructive",
      });
      return;
    }

    // Logique d'envoi de message
    toast({
      title: "Message envoyé",
      description: "Votre message a été envoyé avec succès",
    });

    // Réinitialiser le formulaire
    setMessageText("");
    setSendToAgents(false);
    setSendToActivePermits(false);
    setSendToExpiringPermits(false);
    setSendToActiveGuides(false);
    setIsInfoMessage(false);
    setIndividualRecipientRole("admin");
    setRecipient("");
    setAgentZone("");
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedRecipients = [
    sendToAgents && "Agents de secteur",
    sendToActivePermits && "Chasseurs avec permis actif",
    sendToExpiringPermits && "Permis expirant dans l’année",
    sendToActiveGuides && "Guides de chasse actifs",
  ].filter(Boolean).join(", ") || "Aucun destinataire sélectionné";

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card className="w-full border-none shadow-none">
        <CardHeader className="pb-1">
          <CardTitle className="text-xl text-center">Messagerie SMS</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "recu" | "nouveau" | "envoye")}
            className="w-full"
          >
            {/* Barre d'onglets */}
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 rounded-md overflow-hidden">
              <TabsTrigger
                value="recu"
                className="data-[state=active]:bg-white data-[state=active]:shadow-none py-3 rounded-none border-r border-gray-200"
              >
                <div className="flex items-center justify-center">
                  <Inbox className="mr-2 h-4 w-4" />
                  Reçus
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="nouveau"
                className="data-[state=active]:bg-white data-[state=active]:shadow-none py-3 rounded-none border-r border-gray-200"
              >
                <div className="flex items-center justify-center">
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  Nouveau
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="envoye"
                className="data-[state=active]:bg-white data-[state=active]:shadow-none py-3 rounded-none"
              >
                <div className="flex items-center justify-center">
                  <SendIcon className="mr-2 h-4 w-4" />
                  Envoyés
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets */}
            {/* 1. Onglet Messages reçus */}
            <TabsContent value="recu" className="pt-4">
              <h2 className="text-lg font-medium mb-4">Messages reçus</h2>
              <div className="flex flex-col min-h-[400px] items-center justify-center bg-white rounded-md border border-gray-200 p-4">
                {receivedMessages.length > 0 ? (
                  <div className="space-y-4 w-full">
                    {/* Liste des messages reçus */}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <MessageSquareIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500">Aucun message reçu</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 2. Onglet Nouveau message */}
            <TabsContent value="nouveau" className="flex-1 flex flex-col mt-0">
              <Card className="flex-1 flex flex-col border border-gray-200 rounded-lg shadow-sm">
                <CardHeader className="border-b border-gray-200 py-4">
                  <h2 className="text-lg font-semibold text-gray-800">Nouveau message</h2>
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Type de message</Label>
                        <div className="flex items-center space-x-4">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedRecipientType("individual")}
                            className="flex items-center space-x-1"
                          >
                            <User
                              className={`h-5 w-5 ${
                                selectedRecipientType === "individual" ? "text-blue-500" : "text-gray-500"
                              }`}
                            />
                            {selectedRecipientType === "individual" && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedRecipientType("group")}
                            className="flex items-center space-x-1"
                          >
                            <Users
                              className={`h-5 w-5 ${selectedRecipientType === "group" ? "text-blue-500" : "text-gray-500"}`}
                            />
                            {selectedRecipientType === "group" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Button>
                        </div>
                      </div>

                      {selectedRecipientType === "individual" ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Destinataire</Label>
                            <Select value={individualRecipientRole} onValueChange={(value) => setIndividualRecipientRole(value as "admin" | "hunter" | "agent")}>
                              <SelectTrigger className="border-gray-300 rounded-md">
                                <SelectValue placeholder="Sélectionner un destinataire" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="hunter">Chasseur</SelectItem>
                                <SelectItem value="agent">Agent de secteur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {individualRecipientRole === "hunter" && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">ID Chasseur</Label>
                              <Input
                                placeholder="Ex: CH-1234"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="border-gray-300 rounded-md"
                              />
                            </div>
                          )}
                          {individualRecipientRole === "agent" && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Zone</Label>
                              <Select value={agentZone} onValueChange={setAgentZone}>
                                <SelectTrigger className="border-gray-300 rounded-md">
                                  <SelectValue placeholder="Sélectionner une zone" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departmentsByRegion[user?.region.toLowerCase() || "dakar"].map((sector) => (
                                    <SelectItem key={sector.value} value={sector.value}>
                                      {sector.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Type de message</Label>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsInfoMessage(!isInfoMessage)}
                                className="flex items-center space-x-1"
                              >
                                <Info
                                  className={`h-5 w-5 ${isInfoMessage ? "text-blue-500" : "text-gray-500"}`}
                                />
                                {isInfoMessage && <CheckCircle className="h-4 w-4 text-green-500" />}
                                <span className="text-sm">INFO</span>
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Destinataires</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setSendToAgents(!sendToAgents)}
                                >
                                  <Users
                                    className={`h-5 w-5 ${sendToAgents ? "text-blue-500" : "text-gray-500"}`}
                                  />
                                  {sendToAgents && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </Button>
                                <Label className="cursor-pointer text-sm text-gray-600">
                                  Agents de secteur
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setSendToActivePermits(!sendToActivePermits)}
                                >
                                  <Users
                                    className={`h-5 w-5 ${sendToActivePermits ? "text-blue-500" : "text-gray-500"}`}
                                  />
                                  {sendToActivePermits && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </Button>
                                <Label className="cursor-pointer text-sm text-gray-600">
                                  Chasseurs avec permis actif
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setSendToExpiringPermits(!sendToExpiringPermits)}
                                >
                                  <Users
                                    className={`h-5 w-5 ${sendToExpiringPermits ? "text-blue-500" : "text-gray-500"}`}
                                  />
                                  {sendToExpiringPermits && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </Button>
                                <Label className="cursor-pointer text-sm text-gray-600">
                                  Permis expirant dans l’année
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setSendToActiveGuides(!sendToActiveGuides)}
                                >
                                  <Users
                                    className={`h-5 w-5 ${sendToActiveGuides ? "text-blue-500" : "text-gray-500"}`}
                                  />
                                  {sendToActiveGuides && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </Button>
                                <Label className="cursor-pointer text-sm text-gray-600">
                                  Guides de chasse actifs
                                </Label>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">Destinataires : {selectedRecipients}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2 relative">
                        <Label className="text-sm font-medium text-gray-700">Message</Label>
                        <Textarea
                          placeholder="Écrivez votre message (160 caractères max)..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          maxLength={160}
                          className="border-gray-300 rounded-md px-4 py-3 min-h-[80px] w-full pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-3 right-3 text-gray-500"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          accept=".pdf,.jpg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachment(file);
                              setAttachmentPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{messageText.length} / 160</span>
                          <span>2 Mo max pour les pièces jointes</span>
                        </div>
                        {attachmentPreview && (
                          <div className="mt-2 p-2 bg-gray-50 border rounded-md">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{attachment?.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setAttachment(null);
                                  if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
                                  setAttachmentPreview(null);
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        onClick={handleSendMessage}
                        disabled={sending}
                        className="h-9 px-4 rounded-md bg-blue-600 text-white"
                      >
                        {sending ? "Envoi..." : "Envoyer"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. Onglet Messages envoyés */}
            <TabsContent value="envoye" className="pt-4">
              <h2 className="text-lg font-medium mb-4">Messages envoyés</h2>
              <div className="flex flex-col min-h-[400px] items-center justify-center bg-white rounded-md border border-gray-200 p-4">
                {sentMessages.length > 0 ? (
                  <div className="space-y-4 w-full">
                    {/* Liste des messages envoyés */}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <MessageSquareIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500">Aucun message envoyé</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}