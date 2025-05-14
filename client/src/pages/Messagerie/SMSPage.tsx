import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
// Le layout principal est déjà inclus via App.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, MessageSquare, Send, Users, Inbox, Mail, Bell, Trash2, Printer, AlertTriangle, Paperclip, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { departmentsByRegion } from "@/lib/constants";

// Types pour les messages
interface Message {
  id: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    role: "admin" | "agent" | "hunter" | "guide-chasse";
  };
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    role: "admin" | "agent" | "hunter" | "guide-chasse";
  };
  content: string;
  isRead: boolean;
  createdAt: string;
  type?: "standard" | "urgent" | "information";
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
}

export default function SMSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageType, setMessageType] = useState("individual");
  const [recipient, setRecipient] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  
  // Gestion spéciale du messageType pour l'admin
  useEffect(() => {
    if (user?.role === 'admin') {
      // Pour admin, utilisez un type qui n'est pas 'group' ou 'individual'
      setMessageType('direct');
    }
  }, [user?.role]);
  const [region, setRegion] = useState("toutes");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  // États pour la sélection du destinataire individuel
  const [individualRecipientType, setIndividualRecipientType] = useState("admin");
  const [agentZone, setAgentZone] = useState("");
  const [guideLocation, setGuideLocation] = useState("");
  const [guideAvailable, setGuideAvailable] = useState("oui");
  
  // État pour la sélection du destinataire groupé (pour les agents)
  const [groupRecipientType, setGroupRecipientType] = useState("agents");
  
  // État pour les messages reçus (pour l'administrateur, agent et sous-agent)
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  // États pour l'interface SMS des agents secteur
  const [sendToAllWithActivePermit, setSendToAllWithActivePermit] = useState(false);
  const [sendToExpiringPermits, setSendToExpiringPermits] = useState(false);
  const [sendToActiveGuides, setSendToActiveGuides] = useState(false);

  const regions = [
    "TOUTES", "DAKAR", "THIÈS", "SAINT-LOUIS", "LOUGA", "FATICK", "KAOLACK", 
    "KAFFRINE", "MATAM", "TAMBACOUNDA", "KÉDOUGOU", "KOLDA", "SÉDHIOU", "ZIGUINCHOR", "DIOURBEL"
  ];
  
  const predefinedMessages = [
    "Rappel: La saison de chasse est maintenant ouverte. N'oubliez pas de renouveler votre permis.",
    "Rappel: La chasse est interdite dans les zones protégées. Respectez la réglementation.",
    "Alerte: Contrôle des permis prévu dans votre région cette semaine.",
    "Information: Une formation sur les techniques de chasse responsable aura lieu prochainement.",
    "Votre permis de chasse arrive à expiration. Veuillez le renouveler dès que possible.",
    "Bienvenue sur SCoDePP_Ch! Votre nom d'utilisateur: {username} et mot de passe: {password}. Veuillez vous connecter et modifier votre mot de passe dès que possible."
  ];

  // Exemple de données pour les messages reçus (simulé)
  useEffect(() => {
    // Simuler des messages reçus selon le rôle
    if (user?.role === 'admin') {
      // Messages reçus pour l'administrateur
      const mockReceivedMessages: Message[] = [
        {
          id: 1,
          sender: {
            id: 101,
            firstName: "Jean",
            lastName: "Diop",
            role: "agent"
          },
          content: "Bonjour Monsieur le Directeur, nous avons constaté une augmentation des activités de braconnage dans la région de Kédougou. Nous sollicitons des renforts pour intensifier les contrôles.",
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 heures avant
        },
        {
          id: 2,
          sender: {
            id: 102,
            firstName: "Amadou",
            lastName: "Sall",
            role: "guide-chasse"
          },
          content: "Monsieur le Directeur, je vous informe que plusieurs espèces protégées ont été observées dans le parc national de Niokolo Koba. Il serait pertinent de rappeler aux chasseurs la liste des espèces interdites de chasse pour cette saison.",
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 jours avant
        },
        {
          id: 3,
          sender: {
            id: 103,
            firstName: "Marie",
            lastName: "Sène",
            role: "agent"
          },
          content: "Urgent: Nous avons besoin d'une intervention dans la zone de Fatick. Des chasseurs sans permis ont été signalés par les villageois. Pourriez-vous nous autoriser à organiser une opération de contrôle spéciale?",
          isRead: false,
          type: "urgent",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes avant
        },
        {
          id: 4,
          sender: {
            id: 104,
            firstName: "Moussa",
            lastName: "Gueye",
            role: "guide-chasse"
          },
          content: "Information: Les conditions climatiques dans la région de Tambacounda sont favorables pour l'observation des phacochères. Les chasseurs de la région semblent satisfaits des quotas actuels.",
          isRead: false,
          type: "information",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 heures avant
        }
      ];
      
      setReceivedMessages(mockReceivedMessages);
    } 
    else if (user?.role === 'agent' || user?.role === 'sub-agent') {
      // Messages reçus pour l'agent ou sous-agent
      const mockAgentMessages: Message[] = [
        {
          id: 1,
          sender: {
            id: 201,
            firstName: "Directeur",
            lastName: "National",
            role: "admin"
          },
          content: "À tous les agents: Suite à la réunion du conseil de direction, nous vous informons que de nouvelles directives concernant la gestion des permis seront mises en place à partir du mois prochain.",
          isRead: false,
          type: "information",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 heures avant
        },
        {
          id: 2,
          sender: {
            id: 202,
            firstName: "Mamadou",
            lastName: "Ndiaye",
            role: "guide-chasse"
          },
          content: "Bonjour M. l'Agent, je souhaite vous signaler que j'ai observé des traces de braconnage près de la zone protégée de Niokolo. Des pièges semblent avoir été posés récemment.",
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 jour avant
        },
        {
          id: 3,
          sender: {
            id: 203,
            firstName: "Ibrahima",
            lastName: "Fall",
            role: "agent"
          },
          content: "Rapport hebdomadaire: 3 permis délivrés, 2 contrôles effectués, 1 infraction constatée. La campagne de sensibilisation dans les villages se poursuit comme prévu.",
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 heures avant
        },
        {
          id: 4,
          sender: {
            id: 204,
            firstName: "Directeur",
            lastName: "National",
            role: "admin"
          },
          content: "URGENT: À l'agent de la région de Thiès - Veuillez organiser un contrôle exceptionnel suite aux signalements de chasse illégale dans le secteur nord. Des moyens supplémentaires sont mis à votre disposition.",
          isRead: false,
          type: "urgent",
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutes avant
        },
        {
          id: 5,
          sender: {
            id: 205,
            firstName: "Omar",
            lastName: "Diallo",
            role: "hunter"
          },
          content: "Alerte: J'ai aperçu ce qui semble être des braconniers dans la zone de Mbour hier soir. Ils avaient des lampes puissantes et j'ai entendu plusieurs coups de feu.",
          isRead: false,
          type: "urgent",
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 heures avant
        }
      ];
      
      setReceivedMessages(mockAgentMessages);
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

    // Vérification de la taille du fichier joint (max 5 Mo)
    if (attachment && attachment.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale acceptée est de 5 Mo",
        variant: "destructive",
      });
      return;
    }

    // Pour l'administrateur, le type de message est soit "group" (normal) soit "urgent"
    // Pour les autres utilisateurs, le type est soit "individual" soit "group"
    const isUrgentMessage = user?.role === 'admin' && messageType === 'urgent';

    // Vérifications spécifiques selon le type de destinataire individuel
    if (messageType === "individual" || messageType === "group" && user?.role !== 'admin') {
      if (individualRecipientType === "agent" && !agentZone.trim()) {
        toast({
          title: "Information manquante",
          description: "Veuillez préciser la zone pour l'agent sous-compte",
          variant: "destructive",
        });
        return;
      }
      
      if (individualRecipientType === "guide" && !guideLocation.trim()) {
        toast({
          title: "Information manquante",
          description: "Veuillez préciser le lieu concerné pour le guide de chasse",
          variant: "destructive",
        });
        return;
      }
      
      if (individualRecipientType === "hunter" && !recipient.trim()) {
        toast({
          title: "Information manquante",
          description: "Veuillez indiquer l'identifiant du chasseur",
          variant: "destructive",
        });
        return;
      }
    }

    setSending(true);
    // Simuler l'envoi
    setTimeout(() => {
      setSending(false);
      setMessage("");
      // Réinitialiser la pièce jointe
      if (attachment) {
        if (attachmentPreview) {
          URL.revokeObjectURL(attachmentPreview);
          setAttachmentPreview(null);
        }
        setAttachment(null);
      }
      
      if (messageType === "individual") {
        let successMessage = "";
        switch (individualRecipientType) {
          case "admin":
            successMessage = "Le message a été envoyé à l'administrateur.";
            break;
          case "agent":
            successMessage = `Le message a été envoyé à l'agent sous-compte de la zone: ${agentZone}.`;
            break;
          case "guide":
            successMessage = `Le message a été envoyé au guide de chasse ${guideAvailable === "oui" ? "disponible" : "non disponible"} dans le lieu: ${guideLocation}.`;
            break;
          case "hunter":
            successMessage = `Le message a été envoyé au chasseur (ID: ${recipient}).`;
            break;
        }
        
        toast({
          title: "Message envoyé",
          description: successMessage
        });
      } else {
        let recipientTypeText = "";
        
        if (user?.role === 'admin') {
          if (recipientType === "all_users") {
            recipientTypeText = "utilisateurs (Agents, Guides et Chasseurs)";
          } else {
            recipientTypeText = recipientType === "agents" ? "agents" : recipientType === "guides" ? "guides de chasse" : "chasseurs";
          }
          
          // Ajouter une indication si c'est un message urgent
          const messageStatus = isUrgentMessage ? "(URGENT)" : "";
          
          toast({
            title: `Message ${isUrgentMessage ? "urgent" : ""} envoyé`,
            description: `Le message ${messageStatus} a été envoyé à tous les ${recipientTypeText} de la région: ${region === "toutes" ? "TOUTES LES RÉGIONS" : region}`,
            variant: isUrgentMessage ? "destructive" : "default",
          });
        } else if (user?.role === 'agent') {
          recipientTypeText = groupRecipientType === "agents" ? "agents secteur" : 
                             groupRecipientType === "guides" ? "guides de chasse" : "chasseurs";
                             
          toast({
            title: "Message envoyé",
            description: `Le message a été envoyé à tous les ${recipientTypeText} de la région: ${region === "toutes" ? "TOUTES LES RÉGIONS" : region}`,
          });
        } else if (user?.role === 'sub-agent') {
          // Message spécifique pour les agents secteur
          let specialOptions = [];
          
          if (sendToAllWithActivePermit) {
            specialOptions.push("tous les chasseurs avec permis actif");
          }
          
          if (sendToExpiringPermits) {
            specialOptions.push("chasseurs avec permis expirant bientôt");
          }
          
          if (sendToActiveGuides) {
            specialOptions.push("guides de chasse actifs dans le secteur");
          }
          
          if (specialOptions.length > 0) {
            toast({
              title: "Message envoyé",
              description: `Le message a été envoyé à ${specialOptions.join(", ")} dans votre secteur`,
            });
          } else {
            recipientTypeText = groupRecipientType === "guides" ? "guides de chasse" : "chasseurs";
            toast({
              title: "Message envoyé",
              description: `Le message a été envoyé à tous les ${recipientTypeText} de votre secteur`,
            });
          }
        }
      }
    }, 1500);
  };

  const handleReply = () => {
    if (!replyContent.trim() || !selectedMessage) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir une réponse avant d'envoyer",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    // Simuler l'envoi de la réponse
    setTimeout(() => {
      setSending(false);
      setReplyContent("");
      setSelectedMessage(null);
      toast({
        title: "Réponse envoyée",
        description: `Votre réponse a été envoyée à ${selectedMessage.sender.firstName} ${selectedMessage.sender.lastName}`,
      });
    }, 1500);
  };

  const usePredefinedMessage = (msg: string) => {
    setMessage(msg);
  };

  // Fonction pour marquer un message comme lu
  const markAsRead = (messageId: number) => {
    setReceivedMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };
  
  // Fonction pour supprimer un message
  const deleteMessage = (messageId: number) => {
    // Vérifier si le message a été lu avant suppression
    const messageToDelete = receivedMessages.find(msg => msg.id === messageId);
    
    if (!messageToDelete) {
      toast({
        title: "Erreur",
        description: "Message introuvable",
        variant: "destructive",
      });
      return;
    }
    
    if (!messageToDelete.isRead) {
      toast({
        title: "Message non lu",
        description: "Vous devez d'abord ouvrir le message avant de pouvoir le supprimer",
        variant: "destructive",
      });
      return;
    }
    
    // Pour les administrateurs, proposer l'impression avant la suppression
    if (user?.role === 'admin') {
      // Afficher une boîte de dialogue de confirmation spécifique qui mentionne l'impression
      const adminConfirm = window.confirm(
        "Attention : Ce message sera définitivement supprimé.\n\n" +
        "Voulez-vous l'imprimer avant de le supprimer ?\n" +
        "- Cliquez sur 'OK' pour imprimer avant de confirmer la suppression\n" +
        "- Cliquez sur 'Annuler' pour revenir (vous pourrez utiliser le bouton d'impression séparé)"
      );
      
      if (adminConfirm) {
        // Imprimer le message avant la suppression
        const printContent = `
          <html>
            <head>
              <title>Message de ${messageToDelete.sender.firstName} ${messageToDelete.sender.lastName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { margin-bottom: 20px; }
                .sender { font-weight: bold; }
                .date { color: #666; font-size: 0.9em; margin-top: 5px; }
                .content { margin-top: 20px; white-space: pre-line; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="sender">De: ${messageToDelete.sender.firstName} ${messageToDelete.sender.lastName}</div>
                <div class="date">Envoyé le: ${new Date(messageToDelete.createdAt).toLocaleString('fr-FR')}</div>
              </div>
              <div class="content">${messageToDelete.content}</div>
            </body>
          </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.print();
          
          // Après l'impression, demander la confirmation finale de suppression
          const finalConfirm = window.confirm(
            "L'impression a été envoyée. Confirmez-vous la suppression du message ?\n\n" +
            "Cliquez sur 'OK' pour confirmer la suppression, ou 'Annuler' pour conserver le message."
          );
          
          // Fermer la fenêtre d'impression
          setTimeout(() => printWindow.close(), 500);
          
          if (!finalConfirm) {
            // Si l'utilisateur annule après l'impression
            return;
          }
        } else {
          // Si l'ouverture de la fenêtre d'impression a échoué
          const proceedAnyway = window.confirm(
            "Impossible d'ouvrir la fenêtre d'impression. Voulez-vous quand même supprimer le message ?"
          );
          
          if (!proceedAnyway) {
            return;
          }
        }
      } else {
        // L'utilisateur a refusé l'impression, demander s'il veut quand même supprimer
        const deleteAnyway = window.confirm(
          "Voulez-vous supprimer ce message sans l'imprimer ?\n\n" +
          "Cliquez sur 'OK' pour supprimer sans imprimer, ou 'Annuler' pour conserver le message."
        );
        
        if (!deleteAnyway) {
          return;
        }
      }
    } else {
      // Pour les non-administrateurs, demander une simple confirmation
      const confirmDelete = window.confirm(
        "Attention : Souhaitez-vous réellement supprimer ce message ?\n" +
        "Cette action est irréversible."
      );
      
      if (!confirmDelete) {
        return;
      }
    }
    

    
    // Simule une requête API de suppression
    setSending(true);
    
    setTimeout(() => {
      // Retire le message de la liste locale
      setReceivedMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== messageId)
      );
      
      // Si le message supprimé était sélectionné, désélectionner
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      setSending(false);
      
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès. Notez que le message sera définitivement perdu uniquement si l'expéditeur le supprime également."
      });
    }, 500);
  };
  
  // Fonction pour que l'admin supprime tous les messages
  const deleteAllMessages = () => {
    if (user?.role !== 'admin') return;
    
    // Vérifier si tous les messages ont été lus
    const unreadMessages = receivedMessages.filter(msg => !msg.isRead);
    if (unreadMessages.length > 0) {
      toast({
        title: "Messages non lus",
        description: `Vous avez ${unreadMessages.length} message(s) non lu(s). Veuillez les ouvrir avant de pouvoir tous les supprimer.`,
        variant: "destructive",
      });
      return;
    }
    
    // Demander confirmation et proposer l'impression
    const shouldDelete = window.confirm(
      `Voulez-vous imprimer tous les messages (${receivedMessages.length}) avant de les supprimer? Les messages supprimés sont définitivement perdus.\n\n` +
      "Cliquez sur 'OK' pour imprimer puis supprimer, ou 'Annuler' pour abandonner la suppression."
    );
    
    if (!shouldDelete) {
      return;
    }
    
    // Imprimer tous les messages
    const printContent = `
      <html>
        <head>
          <title>Messages SCoDePP_Ch</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
            .message { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; page-break-inside: avoid; }
            .message-header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
            .message-content { margin-bottom: 15px; }
            .footer { border-top: 1px solid #ddd; padding-top: 10px; font-size: 0.8em; margin-top: 30px; }
            .urgent { border-left: 4px solid #e11d48; }
            .information { border-left: 4px solid #3b82f6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport des messages SCoDePP_Ch</h1>
            <p>Date d'impression: ${new Date().toLocaleString()}</p>
            <p>Nombre de messages: ${receivedMessages.length}</p>
          </div>
          
          ${receivedMessages.map(msg => `
            <div class="message ${msg.type ? msg.type : ''}">
              <div class="message-header">
                <h3>Message #${msg.id}</h3>
                <p>De: ${msg.sender.firstName} ${msg.sender.lastName} (${msg.sender.role})</p>
                <p>Date: ${new Date(msg.createdAt).toLocaleString()}</p>
                ${msg.type ? `<p>Type: ${msg.type}</p>` : ''}
              </div>
              <div class="message-content">
                <p>${msg.content}</p>
              </div>
            </div>
          `).join('')}
          
          <div class="footer">
            <p>Ces messages ont été imprimés avant suppression le ${new Date().toLocaleString()}</p>
            <p>SCoDePP_Ch - Système de Contrôle de Demande de Permis et de Prélèvements de chasse</p>
          </div>
        </body>
      </html>
    `;
    
    // Ouvrir une fenêtre d'impression
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      // Fermer la fenêtre après l'impression
      setTimeout(() => printWindow.close(), 500);
    }
    
    // Supprimer tous les messages
    setSending(true);
    
    setTimeout(() => {
      setReceivedMessages([]);
      setSelectedMessage(null);
      setSending(false);
      
      toast({
        title: "Messages supprimés",
        description: "Tous les messages ont été supprimés avec succès. Notez que les messages supprimés sont définitivement perdus."
      });
    }, 1000);
  };

  // Obtenir le style selon le rôle de l'expéditeur
  const getSenderRoleStyle = (role: string) => {
    switch (role) {
      case 'agent':
        return 'bg-green-100 border-green-200'; // Vert pour les agents
      case 'guide-chasse':
        return 'bg-yellow-50 border-yellow-100'; // Jaune clair pour les guides de chasse
      case 'admin':
        return 'bg-blue-50 border-blue-100'; // Bleu clair pour l'administrateur
      case 'hunter':
        return 'bg-orange-50 border-orange-100'; // Orange clair pour les chasseurs
      default:
        return 'bg-gray-50 border-gray-100'; // Couleur par défaut
    }
  };

  // Obtenir le style selon le type de message
  const getMessageTypeStyle = (type?: string) => {
    switch (type) {
      case 'urgent':
        return 'border-l-4 border-l-red-500';
      case 'information':
        return 'border-l-4 border-l-blue-500';
      default:
        return '';
    }
  };

  return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Messagerie SMS
          </h2>
        </div>

        <Tabs defaultValue={(user?.role === 'admin' || user?.role === 'agent' || user?.role === 'sub-agent') ? "inbox" : "nouveau"} className="space-y-4">
          <TabsList>
            {(user?.role === 'admin' || user?.role === 'agent' || user?.role === 'sub-agent') && (
              <TabsTrigger value="inbox"><Inbox className="h-4 w-4 mr-2" /> Boîte de réception</TabsTrigger>
            )}
            <TabsTrigger value="nouveau"><MessageSquare className="h-4 w-4 mr-2" /> Nouveau message</TabsTrigger>
            <TabsTrigger value="predefined"><Check className="h-4 w-4 mr-2" /> Messages prédéfinis</TabsTrigger>
            <TabsTrigger value="history"><Users className="h-4 w-4 mr-2" /> Historique</TabsTrigger>
          </TabsList>
          
          {/* Boîte de réception pour l'administrateur, l'agent ou le sous-agent */}
          {(user?.role === 'admin' || user?.role === 'agent' || user?.role === 'sub-agent') && (
            <TabsContent value="inbox" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Liste des messages */}
                <div className="md:col-span-1 border rounded-md overflow-hidden">
                  <div className="bg-muted p-3 border-b flex items-center justify-between">
                    <h3 className="font-medium">Messages reçus</h3>
                    <div className="flex items-center gap-2">
                      {user?.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={deleteAllMessages}
                          disabled={receivedMessages.length === 0 || sending}
                          className="h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Tout supprimer
                        </Button>
                      )}
                      <Badge variant="outline">{receivedMessages.filter(m => !m.isRead).length} non lus</Badge>
                    </div>
                  </div>
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {receivedMessages.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucun message reçu
                      </div>
                    ) : (
                      receivedMessages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`p-3 hover:bg-accent/20 cursor-pointer ${!msg.isRead ? 'bg-blue-50' : ''} ${selectedMessage?.id === msg.id ? 'bg-accent/30' : ''} ${getMessageTypeStyle(msg.type)}`}
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (!msg.isRead) markAsRead(msg.id);
                          }}
                        >
                          <div className="flex items-start gap-2 relative group">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={
                                msg.sender.role === 'agent' ? 'bg-green-100 text-green-700' : 
                                msg.sender.role === 'guide-chasse' ? 'bg-yellow-50 text-yellow-700' :
                                msg.sender.role === 'admin' ? 'bg-blue-50 text-blue-700' :
                                'bg-orange-50 text-orange-700'
                              }>
                                {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">
                                  {msg.sender.firstName} {msg.sender.lastName}
                                </p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <Badge 
                                  variant="outline"
                                  className={
                                    msg.sender.role === 'agent' ? 'border-green-300 text-green-700 bg-green-50' : 
                                    msg.sender.role === 'guide-chasse' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                                    msg.sender.role === 'admin' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                                    'border-orange-300 text-orange-700 bg-orange-50'
                                  }
                                >
                                  {msg.sender.role === 'agent' ? 'Agent' : 
                                   msg.sender.role === 'guide-chasse' ? 'Guide de chasse' :
                                   msg.sender.role === 'admin' ? 'Administrateur' : 'Chasseur'}
                                </Badge>
                                {msg.type === 'urgent' && (
                                  <Badge variant="destructive" className="ml-1">Urgent</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {msg.content.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Détail du message sélectionné - Hauteur augmentée */}
                <div className="md:col-span-2 border rounded-md flex flex-col h-[650px]">
                  {selectedMessage ? (
                    <>
                      <div className={`p-4 ${getSenderRoleStyle(selectedMessage.sender.role)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={
                                selectedMessage.sender.role === 'agent' ? 'bg-green-200 text-green-800' : 
                                selectedMessage.sender.role === 'guide-chasse' ? 'bg-yellow-100 text-yellow-800' :
                                selectedMessage.sender.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                'bg-orange-100 text-orange-800'
                              }>
                                {selectedMessage.sender.firstName[0]}{selectedMessage.sender.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{selectedMessage.sender.firstName} {selectedMessage.sender.lastName}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge 
                                  variant="outline"
                                  className={
                                    selectedMessage.sender.role === 'agent' ? 'border-green-300 text-green-700 bg-green-50' : 
                                    selectedMessage.sender.role === 'guide-chasse' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                                    selectedMessage.sender.role === 'admin' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                                    'border-orange-300 text-orange-700 bg-orange-50'
                                  }
                                >
                                  {selectedMessage.sender.role === 'agent' ? 'Agent' : 
                                   selectedMessage.sender.role === 'guide-chasse' ? 'Guide de chasse' :
                                   selectedMessage.sender.role === 'admin' ? 'Administrateur' : 'Chasseur'}
                                </Badge>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(selectedMessage.createdAt), { addSuffix: true, locale: fr })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedMessage.type === 'urgent' && (
                              <Badge variant="destructive">Urgent</Badge>
                            )}
                            
                            {/* Boutons pour supprimer et imprimer le message */}
                            {(user?.role === 'admin' || user?.role === 'agent' || user?.role === 'sub-agent') && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7"
                                  onClick={() => deleteMessage(selectedMessage.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7"
                                  onClick={() => {
                                    // Imprimer directement sans confirmation
                                    const printContent = `
                                      <html>
                                        <head>
                                          <title>Message de ${selectedMessage.sender.firstName} ${selectedMessage.sender.lastName}</title>
                                          <style>
                                            body { font-family: Arial, sans-serif; padding: 20px; }
                                            .header { margin-bottom: 20px; }
                                            .sender { font-weight: bold; }
                                            .date { color: #666; font-size: 0.9em; margin-top: 5px; }
                                            .content { margin-top: 20px; white-space: pre-line; }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="header">
                                            <div class="sender">De: ${selectedMessage.sender.firstName} ${selectedMessage.sender.lastName}</div>
                                            <div class="date">Envoyé le: ${new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}</div>
                                          </div>
                                          <div class="content">${selectedMessage.content}</div>
                                        </body>
                                      </html>
                                    `;
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                      printWindow.document.write(printContent);
                                      printWindow.document.close();
                                      printWindow.print();
                                    }
                                  }}
                                >
                                  <Printer className="h-4 w-4 mr-1" />
                                  Imprimer
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 overflow-y-auto flex-grow">
                        <p className="whitespace-pre-line text-sm leading-relaxed">{selectedMessage.content}</p>
                      </div>
                      
                      <div className="p-4 border-t mt-auto">
                        <h4 className="font-medium mb-2">Répondre</h4>
                        <div className="space-y-3">
                          <Textarea 
                            placeholder="Saisissez votre réponse..."
                            rows={3}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                          />
                          <div className="flex justify-end">
                            <Button onClick={handleReply} disabled={sending}>
                              {sending ? "Envoi en cours..." : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Répondre
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
                      <Mail className="h-12 w-12 mb-3 text-muted-foreground/50" />
                      <h3 className="font-medium mb-1">Aucun message sélectionné</h3>
                      <p className="text-sm">Sélectionnez un message dans la liste pour le lire</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="nouveau" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nouveau message SMS</CardTitle>
                <CardDescription>
                  {user?.role === 'admin' 
                    ? 'Envoyez des messages aux agents, guides de chasse ou chasseurs'
                    : 'Envoyez des SMS aux chasseurs de votre région'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Section "Type de message" seulement pour les non-administrateurs */}
                  {user?.role !== 'admin' && (
                    <div>
                      <Label htmlFor="messageType" className="text-base font-medium">Type de message</Label>
                      <RadioGroup 
                        value={messageType} 
                        onValueChange={setMessageType}
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual" className="cursor-pointer">Message individuel</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="group" id="group" />
                          <Label htmlFor="group" className="cursor-pointer">Message groupé</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Pour les administrateurs, forcer le type de message à "direct" */}

                  {messageType === "individual" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="individualRecipientType">Type de destinataire</Label>
                        <Select 
                          value={individualRecipientType} 
                          onValueChange={setIndividualRecipientType}
                        >
                          <SelectTrigger id="individualRecipientType">
                            <SelectValue placeholder="Sélectionner le type de destinataire" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="agent">Agent Secteur</SelectItem>
                            <SelectItem value="guide">Guide de chasse</SelectItem>
                            <SelectItem value="hunter">Chasseur de la Région</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {individualRecipientType === "agent" && (
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="agentZone">Secteur</Label>
                          <Select 
                            value={agentZone} 
                            onValueChange={setAgentZone}
                          >
                            <SelectTrigger id="agentZone">
                              <SelectValue placeholder="Sélectionner un secteur" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                // Déterminer la région de l'agent connecté
                                let regionKey = "dakar"; // Dakar par défaut

                                if (user) {
                                  if (user.region) {
                                    regionKey = user.region.toLowerCase();
                                  } else if (user.hunter?.region) {
                                    regionKey = user.hunter.region.toLowerCase();
                                  }
                                }

                                // S'assurer que la région existe dans notre mapping
                                if (!departmentsByRegion[regionKey as keyof typeof departmentsByRegion]) {
                                  regionKey = "dakar"; // Fallback sur Dakar
                                }

                                // Récupérer les secteurs de la région
                                const sectors = departmentsByRegion[regionKey as keyof typeof departmentsByRegion];
                                
                                // Retourner les éléments de la liste déroulante
                                return sectors.map(sector => (
                                  <SelectItem key={sector.value} value={sector.value}>
                                    {sector.label}
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Les secteurs correspondent aux départements de votre région</p>
                        </div>
                      )}

                      {individualRecipientType === "guide" && (
                        <>
                          <div className="space-y-2 mt-4">
                            <Label htmlFor="guideAvailable">Un guide est-il disponible dans la zone?</Label>
                            <Select 
                              value={guideAvailable} 
                              onValueChange={setGuideAvailable}
                            >
                              <SelectTrigger id="guideAvailable">
                                <SelectValue placeholder="Guide disponible?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="oui">Oui, un guide est disponible</SelectItem>
                                <SelectItem value="non">Non, aucun guide disponible</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 mt-4">
                            <Label htmlFor="guideLocation">Lieu concerné</Label>
                            <Input 
                              id="guideLocation"
                              placeholder="Préciser le lieu concerné"
                              value={guideLocation}
                              onChange={(e) => setGuideLocation(e.target.value)}
                            />
                          </div>
                        </>
                      )}

                      {individualRecipientType === "hunter" && (
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="recipient">Identifiant du chasseur</Label>
                          <Input 
                            id="recipient"
                            placeholder="Numéro de téléphone ou ID du chasseur"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {user?.role === 'admin' && (
                        <div className="space-y-2">
                          <Label htmlFor="recipientType">Type de destinataire</Label>
                          <Select 
                            value={recipientType} 
                            onValueChange={setRecipientType}
                          >
                            <SelectTrigger id="recipientType">
                              <SelectValue placeholder="Sélectionner le type de destinataire" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous les chasseurs</SelectItem>
                              <SelectItem value="agents">Agents forestiers</SelectItem>
                              <SelectItem value="guides">Guides de chasse</SelectItem>
                              <SelectItem value="all_users">Tous les utilisateurs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {user?.role === 'agent' && (
                        <div className="space-y-2">
                          <Label htmlFor="groupRecipientType">Type de destinataire</Label>
                          <Select 
                            value={groupRecipientType} 
                            onValueChange={setGroupRecipientType}
                          >
                            <SelectTrigger id="groupRecipientType">
                              <SelectValue placeholder="Sélectionner le type de destinataire" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agents">Agents Secteur (de la Région)</SelectItem>
                              <SelectItem value="guides">Guides de chasse (de la Région)</SelectItem>
                              <SelectItem value="hunters">Chasseurs présents dans la Région</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {user?.role === 'sub-agent' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="subAgentGroupRecipientType">Type de destinataire</Label>
                            <Select 
                              value={groupRecipientType} 
                              onValueChange={setGroupRecipientType}
                            >
                              <SelectTrigger id="subAgentGroupRecipientType">
                                <SelectValue placeholder="Sélectionner le type de destinataire" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="guides">Guides de chasse (du Secteur)</SelectItem>
                                <SelectItem value="hunters">Chasseurs présents dans le Secteur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                              <Bell className="h-4 w-4 mr-2" />
                              Options spéciales pour les Agents Secteur
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="sendToAll" 
                                  checked={sendToAllWithActivePermit}
                                  onCheckedChange={(checked) => {
                                    setSendToAllWithActivePermit(checked === true);
                                  }}
                                />
                                <Label htmlFor="sendToAll" className="text-sm">
                                  Envoyer à tous les chasseurs ayant un permis actif
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="sendToExpiring" 
                                  checked={sendToExpiringPermits}
                                  onCheckedChange={(checked) => {
                                    setSendToExpiringPermits(checked === true);
                                  }}
                                />
                                <Label htmlFor="sendToExpiring" className="text-sm">
                                  Envoyer aux chasseurs dont le permis expire bientôt
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="sendToGuides" 
                                  checked={sendToActiveGuides}
                                  onCheckedChange={(checked) => {
                                    setSendToActiveGuides(checked === true);
                                  }}
                                />
                                <Label htmlFor="sendToGuides" className="text-sm">
                                  Envoyer à tous les guides de chasse actifs dans le secteur
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="region">Région cible</Label>
                        <Select 
                          value={region} 
                          onValueChange={setRegion}
                        >
                          <SelectTrigger id="region">
                            <SelectValue placeholder="Sélectionner une région" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map(region => (
                              <SelectItem 
                                key={region} 
                                value={region.toLowerCase()}
                              >
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Option de message urgent pour les administrateurs */}
                  {user?.role === 'admin' && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="messageIsUrgent"
                          checked={messageType === "urgent"}
                          onCheckedChange={(checked) => {
                            setMessageType(checked ? "urgent" : "direct");
                          }}
                        />
                        <Label
                          htmlFor="messageIsUrgent"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Marquer comme message urgent
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">Les messages urgents sont affichés avec une priorité élevée pour tous les destinataires</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message"
                      placeholder="Saisissez votre message..."
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>160 caractères maximum par SMS</span>
                      <span>{message.length} / 160</span>
                    </div>
                  </div>
                  
                  {/* Ajout de pièce jointe (uniquement pour l'administrateur) */}
                  {user?.role === 'admin' && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="attachment">Pièce jointe (optionnel)</Label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="file" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAttachment(file);
                              // Créer une URL pour l'aperçu
                              const fileUrl = URL.createObjectURL(file);
                              setAttachmentPreview(fileUrl);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 relative">
                          <Input 
                            placeholder="Aucun fichier sélectionné"
                            value={attachment ? attachment.name : ""}
                            readOnly
                            className="pr-10"
                          />
                          {attachment && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
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
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {attachmentPreview && (
                        <div className="mt-2">
                          <div className="border rounded p-2 bg-gray-50">
                            <div className="text-sm font-medium mb-1">Aperçu: {attachment?.name}</div>
                            {attachment?.type.startsWith('image/') ? (
                              <img 
                                src={attachmentPreview} 
                                alt="Aperçu" 
                                className="max-w-full h-auto max-h-40 rounded" 
                              />
                            ) : (
                              <div className="flex items-center text-sm text-gray-500">
                                <div className="p-4 bg-gray-100 rounded">
                                  Fichier: {attachment?.name} ({Math.round(attachment?.size / 1024)} Ko)
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Formats acceptés: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max 5 Mo)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSendMessage} disabled={sending}>
                  {sending ? (
                    <>Envoi en cours...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="predefined" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Messages prédéfinis</CardTitle>
                <CardDescription>
                  Utilisez des modèles de messages préparés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {predefinedMessages.map((msg, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-gray-50" onClick={() => usePredefinedMessage(msg)}>
                      <CardContent className="p-4">
                        <p>{msg}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end p-4 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            usePredefinedMessage(msg);
                          }}
                        >
                          Utiliser
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des messages</CardTitle>
                <CardDescription>
                  Tous les messages envoyés récemment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <p>Aucun message envoyé récemment</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}