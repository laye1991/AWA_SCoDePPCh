import { format } from "date-fns";
// Importation statique remplacée par des URLs directes pour éviter les problèmes d'import
import { Permit, Hunter } from "@shared/schema";

interface PermitCardProps {
  permit: Permit;
  hunter: Hunter;
}

export default function PermitCard({ permit, hunter }: PermitCardProps) {
  // URLs directes des images pour éviter les problèmes d'import
  const senegalFlag = "https://upload.wikimedia.org/wikipedia/commons/f/fd/Flag_of_Senegal.svg";
  const eauxForetsLogo = "https://www.eaux-forets.sn/wp-content/uploads/2019/09/logo-eaux-forets.png";
  
  // Format les données du QR de manière plus lisible (une information par ligne)
  const qrData = 
    `N° Permis: ${permit.permitNumber}\n` +
    `Nom: ${hunter.lastName}\n` +
    `Prénom: ${hunter.firstName}\n` +
    `Téléphone: ${hunter.phone}\n` +
    `N° Pièce d'identité: ${hunter.idNumber}\n` +
    `Type de Permis: ${permit.type === 'petite-chasse' ? 'Petite Chasse' : 
                      permit.type === 'grande-chasse' ? 'Grande Chasse' : 
                      permit.type === 'gibier-eau' ? 'Gibier d\'Eau' : permit.type}\n` +
    `Catégorie: ${hunter.category}\n` + 
    `Montant: ${Number(permit.price).toLocaleString()} FCFA\n` +
    `Date d'expiration: ${format(new Date(permit.expiryDate), "dd/MM/yyyy")}`;

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md p-6 print:shadow-none">
      {/* Entête */}
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <div className="flex items-center">
          <img src={senegalFlag} alt="Drapeau du Sénégal" className="h-10 mr-3" />
          <div>
            <div className="font-bold text-green-800">RÉPUBLIQUE DU SÉNÉGAL</div>
            <div className="text-sm text-green-700">Ministère de l'Environnement et de la Transition Écologique</div>
          </div>
        </div>

        <div className="text-right">
          <img src={eauxForetsLogo} alt="Logo Eaux et Forêts" className="h-16" />
        </div>
      </div>

      {/* Titre */}
      <div className="text-center my-4">
        <h1 className="text-2xl font-bold uppercase text-green-900">PERMIS DE CHASSE</h1>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="mb-4">
            <div className="text-sm text-gray-600">N° de Permis:</div>
            <div className="font-bold">{permit.permitNumber}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600">Titulaire:</div>
            <div className="font-bold">{hunter.firstName} {hunter.lastName}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600">Type de Permis:</div>
            <div className="font-bold">
              {permit.type === 'petite-chasse' ? 'Petite Chasse' : 
               permit.type === 'grande-chasse' ? 'Grande Chasse' : 
               permit.type === 'gibier-eau' ? 'Gibier d\'Eau' : 
               permit.type}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600">Montant Payé:</div>
            <div className="font-bold">{Number(permit.price).toLocaleString()} FCFA</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600">N° Quittance Permis:</div>
            <div className="font-bold">{permit.receiptNumber || 'Non défini'}</div>
          </div>
        </div>

        <div className="flex flex-col justify-between">          
          <div className="mb-4">
            <div className="text-sm text-gray-600">N° Pièce d'identité:</div>
            <div className="font-bold">{hunter.idNumber}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600">Fin de validité:</div>
            <div className="font-bold">{format(new Date(permit.expiryDate), "dd/MM/yyyy")}</div>
          </div>
          
          <div className="mb-0 mt-auto flex flex-col items-center">
            <div className="qrcode-wrapper" id="qrcode-container">
              {/* Le QR code sera généré via QRCode.js */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`} 
                alt="QR Code du Permis" 
                className="w-24 h-24 mx-auto mb-1" 
              />
              <div className="text-xs text-center text-gray-500">Scannez pour vérifier</div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature et pied de page */}
      <div className="border-t pt-4 mt-4 flex justify-between">
        <div>
          <div className="text-sm text-gray-600 mb-1">Signature de l'autorité</div>
          <div className="border border-gray-300 w-40 h-16"></div>
        </div>

        <div className="text-right text-xs text-gray-600">
          <p>Direction des Eaux et Forêts, Chasse et de la Conservation des Sols</p>
          <p className="mt-1 italic">Document officiel - Le titulaire doit présenter ce permis sur demande des autorités.</p>
        </div>
      </div>
    </div>
  );
}