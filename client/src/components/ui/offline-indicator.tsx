import { useState, useEffect } from "react";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { syncPendingRequests } from "@/lib/pwaUtils";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  // Vérifier le nombre de requêtes en attente
  const checkPendingSyncs = async () => {
    try {
      const db = await window.indexedDB.open('permis-chasse-offline-db', 1);
      db.onsuccess = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        const transaction = database.transaction('pendingSync', 'readonly');
        const store = transaction.objectStore('pendingSync');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
          setPendingSyncs(countRequest.result);
        };
        
        transaction.oncomplete = () => {
          database.close();
        };
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des synchronisations en attente:', error);
    }
  };

  // Mettre à jour l'état en ligne/hors ligne
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShowAlert(true);
      
      // Masquer l'alerte après 5 secondes
      setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      // Si on revient en ligne, vérifier les syncs en attente
      if (navigator.onLine) {
        checkPendingSyncs();
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Vérifier initialement
    checkPendingSyncs();
    
    // Vérifier périodiquement
    const interval = setInterval(checkPendingSyncs, 30000);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  // Si en ligne et pas de syncs en attente, ne rien afficher
  if (isOnline && pendingSyncs === 0) {
    return null;
  }

  // Forcer la synchronisation
  const handleSync = async () => {
    if (navigator.onLine) {
      try {
        await syncPendingRequests();
        await checkPendingSyncs();
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
      }
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-opacity ${showAlert || !isOnline || pendingSyncs > 0 ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <Alert variant={isOnline ? "default" : "destructive"} className="w-80 shadow-lg">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <AlertTitle>Connecté</AlertTitle>
            {pendingSyncs > 0 && (
              <>
                <AlertDescription className="mt-2">
                  {pendingSyncs} modification{pendingSyncs > 1 ? 's' : ''} en attente de synchronisation
                </AlertDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={handleSync}
                >
                  Synchroniser maintenant
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Mode hors ligne</AlertTitle>
            <AlertDescription className="mt-2">
              Vous êtes actuellement hors ligne. Vos modifications seront synchronisées automatiquement lorsque la connexion sera rétablie.
            </AlertDescription>
          </>
        )}
      </Alert>
    </div>
  );
}
