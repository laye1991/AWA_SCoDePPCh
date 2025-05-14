import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SimpleSMSPage() {
  const [activeTab, setActiveTab] = useState("reçus");
  const [recipient, setRecipient] = useState("Tous les chasseurs");
  const [region, setRegion] = useState("TOUTES");
  const [message, setMessage] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isInfo, setIsInfo] = useState(true); // INFO activé par défaut
  const [attachmentName, setAttachmentName] = useState("");

  const handleSendMessage = () => {
    console.log({
      recipient,
      region,
      message,
      isUrgent,
      isInfo,
      hasAttachment: !!attachmentName,
      attachmentName
    });
    // TODO: Implémenter l'envoi de message
    
    // Réinitialiser le formulaire après l'envoi
    setMessage("");
    setAttachmentName("");
    // INFO reste activé
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Messagerie SMS</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-gray-100">
          <TabsTrigger className="flex items-center justify-center py-3" value="reçus">
            <span className="material-icons mr-2 text-sm">mail</span>
            Reçus
          </TabsTrigger>
          <TabsTrigger className="flex items-center justify-center py-3" value="nouveau">
            <span className="material-icons mr-2 text-sm">edit</span>
            Nouveau
          </TabsTrigger>
          <TabsTrigger className="flex items-center justify-center py-3" value="envoyés">
            <span className="material-icons mr-2 text-sm">send</span>
            Envoyés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reçus" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              <div className="text-gray-400 flex flex-col items-center">
                <div className="text-gray-400 mb-4">
                  <span className="material-icons text-6xl">chat</span>
                </div>
                <p>Aucun message reçu</p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              <div className="text-gray-400 flex flex-col items-center">
                <div className="text-gray-400 mb-4">
                  <span className="material-icons text-6xl">chat</span>
                </div>
                <p>Aucun message sélectionné</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nouveau" className="mt-6">
          <Card className="p-6">
            <h3 className="font-medium text-lg mb-4">Nouveau message</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Type de destinataire</Label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger id="recipient" className="w-full">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tous les chasseurs">Tous les chasseurs</SelectItem>
                      <SelectItem value="Agents">Agents</SelectItem>
                      <SelectItem value="Guides">Guides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region">Région cible</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region" className="w-full">
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOUTES">TOUTES</SelectItem>
                      <SelectItem value="DAKAR">DAKAR</SelectItem>
                      <SelectItem value="THIES">THIES</SelectItem>
                      <SelectItem value="SAINT-LOUIS">SAINT-LOUIS</SelectItem>
                      <SelectItem value="ZIGUINCHOR">ZIGUINCHOR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-4">
                  <div 
                    className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${isUrgent ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500'}`}
                    onClick={() => {
                      setIsUrgent(!isUrgent);
                      if (!isUrgent) setIsInfo(false); // Désactive INFO si on active Urgent
                    }}
                  >
                    Urgent
                    {!isUrgent && <span className="text-xs ml-2">Cliquer pour activer</span>}
                  </div>
                  
                  <div 
                    className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${isInfo ? 'bg-green-500 text-white' : 'bg-green-100 text-green-500'}`}
                    onClick={() => {
                      setIsInfo(!isInfo);
                      if (!isInfo) setIsUrgent(false); // Désactive Urgent si on active INFO
                    }}
                  >
                    INFO
                    {!isInfo && <span className="text-xs ml-2">Cliquer pour activer</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Message</Label>
                  <div className="relative">
                    <Textarea 
                      id="message" 
                      placeholder="Écrivez votre message (160 caractères max)..." 
                      className="resize-none h-40"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={160}
                    />
                    <div className="absolute bottom-3 right-3">
                      <label htmlFor="file-upload" className="cursor-pointer p-1 rounded-full hover:bg-gray-200 flex items-center justify-center">
                        <span className="material-icons text-gray-500">attach_file</span>
                      </label>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachmentName(file.name);
                          }
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      />
                    </div>
                  </div>
                  {attachmentName && (
                    <div className="mt-2 text-sm flex items-center bg-gray-100 p-2 rounded">
                      <span className="material-icons text-gray-600 mr-1 text-sm">insert_drive_file</span>
                      {attachmentName}
                      <button 
                        onClick={() => setAttachmentName('')}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <div>160 caractères maximum par SMS</div>
                    <div>{message.length} / 160</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Formats acceptés: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max 5 Mo)
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={handleSendMessage}
                  >
                    Envoyer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="envoyés" className="mt-6">
          <Card className="p-6 flex flex-col items-center justify-center min-h-[200px]">
            <div className="text-gray-400 flex flex-col items-center">
              <div className="text-gray-400 mb-4">
                <span className="material-icons text-6xl">chat</span>
              </div>
              <p>Aucun message envoyé</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
