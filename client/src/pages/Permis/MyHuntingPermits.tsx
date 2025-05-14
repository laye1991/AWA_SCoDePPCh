import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FilePlus, Loader2, Target, Info, FileBadge, MapPin, User, CheckCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import { Value } from "@radix-ui/react-select";

// Schéma de validation
const permitRequestSchema = z.object({
  permitType: z.enum(["sportif-petite-chasse", "grande-chasse", "special-gibier-eau"], {
    required_error: "Veuillez sélectionner un type de permis",
  }),
  pickupRegion: z.string({
    required_error: "Veuillez sélectionner une région",
  }),
  hunterCategory: z.enum(["resident", "coutumier", "touristique"], {
    required_error: "Catégorie de chasseur non définie",
  }),
  duration: z.enum(["1-week", "2-weeks", "1-month"]).optional(),
  weaponType: z.string({ required_error: "Veuillez sélectionner un type d'arme" }),
  weaponBrand: z.string().optional(),
  customWeaponBrand: z.string().optional(),
  weaponReference: z.string({ required_error: "Veuillez indiquer la référence de l'arme" }).optional(),
  weaponCaliber: z.string({ required_error: "Veuillez sélectionner un calibre" }).optional(),
  weaponOtherDetails: z.string().optional(),
}).refine(
  (data) => {
    if (data.hunterCategory === "touristique" && !data.duration) {
      return false;
    }
    return true;
  },
  { message: "Veuillez sélectionner une durée pour le permis touristique", path: ["duration"] }
).refine(
  (data) => {
    if ((data.weaponType === "fusil" || data.weaponType === "carabine") && !data.weaponBrand) {
      return false;
    }
    return true;
  },
  { message: "Veuillez sélectionner une marque pour l'arme", path: ["weaponBrand"] }
).refine(
  (data) => {
    if ((data.weaponType === "fusil" || data.weaponType === "carabine") && data.weaponBrand === "AUTRE" && !data.customWeaponBrand) {
      return false;
    }
    return true;
  },
  { message: "Veuillez préciser la marque de l'arme", path: ["customWeaponBrand"] }
).refine(
  (data) => {
    if ((data.weaponType === "fusil" || data.weaponType === "carabine") && !data.weaponReference) {
      return false;
    }
    return true;
  },
  { message: "Veuillez indiquer la référence de l'arme", path: ["weaponReference"] }
).refine(
  (data) => {
    if ((data.weaponType === "fusil" || data.weaponType === "carabine") && !data.weaponCaliber) {
      return false;
    }
    return true;
  },
  { message: "Veuillez sélectionner un calibre", path: ["weaponCaliber"] }
).refine(
  (data) => {
    // If weaponBrand is "AUTRE" or weaponCaliber is "AUTRE-CALIBRE", weaponOtherDetails is mandatory
    if ((data.weaponBrand === "AUTRE" || data.weaponCaliber === "AUTRE-CALIBRE") && !data.weaponOtherDetails) {
      return false;
    }
    return true;
  },
  { message: "Veuillez fournir des détails supplémentaires sur l'arme", path: ["weaponOtherDetails"] }
);

type FormValues = z.infer<typeof permitRequestSchema>;

// Données pour les types d'armes (sans "Autre")
const weaponTypes = [
  { value: "fusil", label: "Fusil" },
  { value: "carabine", label: "Carabine" },
  { value: "arbalete", label: "Arbalète" },
  { value: "arc", label: "Arc" },
  { value: "lance-pierre", label: "Lance-pierre" },
];

// Marques pour fusils et carabines
const fusils = [
  { value: "ARMED", label: "ARMED" },
  { value: "ATA", label: "ATA Arms" },
  { value: "BAIKAL", label: "BAIKAL" },
  { value: "BERETTA", label: "BERETTA" },
  { value: "BROWNING", label: "BROWNING" },
  { value: "CROMATA", label: "CROMATA" },
  { value: "ESCORT", label: "ESCORT" },
  { value: "FABARM", label: "FABARM" },
  { value: "FRANCHI", label: "FRANCHI" },
  { value: "HUGLU", label: "HUGLU" },
  { value: "IDEAL", label: "IDEAL" },
  { value: "IZHMECH", label: "IZHMECH" },
  { value: "MANUFRANCE", label: "MANUFRANCE" },
  { value: "MOSSBERG", label: "MOSSBERG" },
  { value: "OPTIMA", label: "OPTIMA" },
  { value: "PRANDELLI", label: "PRANDELLI" },
  { value: "ROBUST", label: "ROBUST" },
  { value: "ROSSI", label: "ROSSI" },
  { value: "SAVAGE", label: "SAVAGE" },
  { value: "SKB", label: "SKB" },
  { value: "STOEGER", label: "STOEGER" },
  { value: "YILDIZ", label: "YILDIZ" },
  { value: "AUTRE", label: "Autre" },
];

const carabines = [
  { value: "BAR", label: "Browning BAR" },
  { value: "BAIKAL", label: "BAIKAL" },
  { value: "BERGARA", label: "BERGARA" },
  { value: "BERETTA", label: "BERETTA" },
  { value: "BROWNING", label: "BROWNING" },
  { value: "CZ", label: "CZ (Česká Zbrojovka)" },
  { value: "HOWA", label: "HOWA" },
  { value: "MANUFRANCE", label: "MANUFRANCE" },
  { value: "MARLIN", label: "MARLIN" },
  { value: "MOSSBERG", label: "MOSSBERG" },
  { value: "RUGER", label: "RUGER" },
  { value: "ROSSI", label: "ROSSI" },
  { value: "SAVAGE", label: "SAVAGE" },
  { value: "SAUER", label: "SAUER" },
  { value: "TANFOGLIO", label: "TANFOGLIO" },
  { value: "TIKKA", label: "TIKKA" },
  { value: "WINCHESTER", label: "WINCHESTER" },
  { value: "WINCHESTER-70XTM", label: "WINCHESTER 70 XTM" },
  { value: "ZASTAVA", label: "ZASTAVA" },
  { value: "AUTRE", label: "Autre" },
];

// Calibres pour grande chasse (>= 8x68)
const largeCalibers = [
  { value: "243Win", label: ".243 Winchester" },
  { value: "7x57", label: "7x57 Mauser" },
  { value: "7x64", label: "7x64 Brenneke" },
  { value: "308Win", label: ".308 Winchester" },
  { value: "30-06", label: ".30-06 Springfield" },
  { value: "300WinMag", label: ".300 Winchester Magnum" },
  { value: "8x57", label: "8x57 JS Mauser" },
  { value: "8x68", label: "8x68 S Magnum" },
  { value: "9.3x62", label: "9.3x62 Mauser" },
  { value: "9.3x74R", label: "9.3x74R" },
  { value: "375HH", label: ".375 H&H Magnum" },
  { value: "416Rigby", label: ".416 Rigby" },
  { value: "458WinMag", label: ".458 Winchester Magnum" },
  { value: "470NE", label: ".470 Nitro Express" },
  { value: "500NE", label: ".500 Nitro Express" },
  { value: "505Gibbs", label: ".505 Gibbs" },
  { value: "AUTRE-CALIBRE", label: "Autre calibre" },
];

// Calibres pour petite chasse et gibier d'eau (< 8x68)
const smallCalibers = [
  { value: "12Gauge", label: "Calibre 12 (12 Gauge - Non Auto)" },
  { value: "16Gauge", label: "Calibre 16 (16 Gauge - Non Auto)" },
  { value: "20Gauge", label: "Calibre 20 (20 Gauge)" },
  { value: "28Gauge", label: "Calibre 28 (28 Gauge)" },
  { value: "32Gauge", label: "Calibre 32 (32 Gauge - Non Auto)" },
  { value: "410Bore", label: ".410 Bore (Calibre 36)" },
  { value: "17HMR", label: ".17 HMR (Hornady Magnum Rimfire)" },
  { value: "22LR", label: ".22 LR (Long Rifle)" },
  { value: "22WMR", label: ".22 WMR (Winchester Magnum Rimfire)" },
  { value: "22Hornet", label: ".22 Hornet" },
  { value: "204Ruger", label: ".204 Ruger" },
  { value: "222Rem", label: ".222 Remington" },
  { value: "223Rem", label: ".223 Remington" },
  { value: "243Win", label: ".243 Winchester" },
  { value: "6mm", label: "6 mm Remington" },
  { value: "AUTRE-CALIBRE", label: "Autre calibre" },
];

// Régions sénégalaises
const regionEnum = [
  { value: "dakar", label: "Dakar" },
  { value: "thies", label: "Thiès" },
  { value: "diourbel", label: "Diourbel" },
  { value: "fatick", label: "Fatick" },
  { value: "kaolack", label: "Kaolack" },
  { value: "kaffrine", label: "Kaffrine" },
  { value: "kolda", label: "Kolda" },
  { value: "kedougou", label: "Kédougou" },
  { value: "louga", label: "Louga" },
  { value: "matam", label: "Matam" },
  { value: "saint-louis", label: "Saint-Louis" },
  { value: "sedhiou", label: "Sédhiou" },
  { value: "tambacounda", label: "Tambacounda" },
  { value: "ziguinchor", label: "Ziguinchor" },
];

// Durées pour les permis touristiques
const durations = [
  { value: "1-week", label: "1 Semaine" },
  { value: "2-weeks", label: "2 Semaines" },
  { value: "1-month", label: "1 Mois" },
];

export default function PermitRequestPage() {
  const [step, setStep] = useState<number>(1);
  const [totalSteps] = useState<number>(3);
  const [permitFee, setPermitFee] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  // Simuler une campagne active
  const isActive = true;
  const startDate = "2025-04-01";
  const endDate = "2025-06-25";
  const year = "2025";

  // Obtenir les informations du profil du chasseur connecté
  const { user } = useAuth();
  const { data: hunterProfile, isLoading: profileLoading } = useQuery<{
    id: number;
    firstName: string;
    lastName: string;
    category: string;
    region: string;
    // autres champs du profil
  }>({
    queryKey: ["/api/hunters/me"],
    enabled: !!user,
  });

  // Formulaire avec validation Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(permitRequestSchema),
    defaultValues: {
      permitType: undefined,
      pickupRegion: "",
      hunterCategory: (hunterProfile?.category || "resident") as "resident" | "coutumier" | "touristique",
      duration: undefined,
      weaponType: "",
      weaponBrand: "",
      customWeaponBrand: "",
      weaponReference: "",
      weaponCaliber: "",
      weaponOtherDetails: "",
    },
  });
  
  // Mettre à jour la catégorie quand le profil est chargé
  useEffect(() => {
    if (hunterProfile) {
      form.setValue("hunterCategory", hunterProfile.category as "resident" | "coutumier" | "touristique");
    }
  }, [hunterProfile, form]);

  // Calculer le tarif
  const calculateFee = (permitType: string, hunterCategory: string, duration?: string) => {
    let fee = 0;
    if (hunterCategory === "coutumier") {
      if (permitType === "sportif-petite-chasse") {
        fee = 3000;
      }
    } else if (hunterCategory === "resident") {
      if (permitType === "sportif-petite-chasse") {
        fee = 15000;
      } else if (permitType === "grande-chasse") {
        fee = 45000;
      } else if (permitType === "special-gibier-eau") {
        fee = 30000;
      }
    } else if (hunterCategory === "touristique") {
      if (permitType === "sportif-petite-chasse") {
        if (duration === "1-week") fee = 15000;
        else if (duration === "2-weeks") fee = 25000;
        else if (duration === "1-month") fee = 45000;
      } else if (permitType === "grande-chasse") {
        if (duration === "1-week") fee = 30000;
        else if (duration === "2-weeks") fee = 50000;
        else if (duration === "1-month") fee = 90000;
      } else if (permitType === "special-gibier-eau") {
        if (duration === "1-week") fee = 15000;
        else if (duration === "1-month") fee = 45000;
      }
    }
    setPermitFee(fee);
  };

  // Observer les changements pour calculer le tarif
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "permitType" || name === "hunterCategory" || name === "duration") {
        if (value.permitType && value.hunterCategory) {
          calculateFee(value.permitType, value.hunterCategory, value.duration);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Soumission du formulaire
  const onSubmit = (data: FormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setShowConfirmationDialog(true);
      console.log("Demande soumise avec succès: Votre demande de permis a été enregistrée et sera traitée par un agent.");
    }, 1500);
    console.log("Form submission data:", data);
  };

  // Gérer les étapes du formulaire
  const nextStep = () => {
    const currentFields =
      step === 1
        ? ["permitType", "pickupRegion", "hunterCategory", "duration"]
        : step === 2
        ? ["weaponType", "weaponBrand", "customWeaponBrand", "weaponReference", "weaponCaliber", "weaponOtherDetails"]
        : [];

    // Explicit validation for pickupRegion in Step 1
    if (step === 1) {
      const pickupRegionValue = form.getValues("pickupRegion");
      if (!pickupRegionValue) {
        form.setError("pickupRegion", {
          type: "manual",
          message: "Veuillez sélectionner une région",
        });
        return;
      }
    }

    form.trigger(currentFields as any).then((isValid) => {
      if (isValid) setStep((prev) => Math.min(prev + 1, totalSteps));
    });
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Formater le type de permis
  const formatPermitType = (type: string) => {
    switch (type) {
      case "sportif-petite-chasse": return "Permis sportif de petite chasse";
      case "grande-chasse": return "Permis de grande chasse";
      case "special-gibier-eau": return "Permis spécial gibier d'eau";
      default: return type;
    }
  };

  // Formater la catégorie du chasseur
  const formatHunterCategory = (category: string) => {
    switch (category) {
      case "resident": return "Résident";
      case "coutumier": return "Coutumier";
      case "touristique": return "Touristique";
      default: return category;
    }
  };

  // Icône pour la catégorie du chasseur
  const getHunterCategoryIcon = (category: string) => {
    switch (category) {
      case "resident": return <User className="h-6 w-6 text-blue-600" />;
      case "coutumier": return <User className="h-6 w-6 text-green-600" />;
      case "touristique": return <User className="h-6 w-6 text-orange-600" />;
      default: return <User className="h-6 w-6 text-gray-600" />;
    }
  };

  // Formater la durée
  const formatDuration = (duration?: string) => {
    if (!duration) return "Non applicable";
    switch (duration) {
      case "1-week": return "1 Semaine";
      case "2-weeks": return "2 Semaines";
      case "1-month": return "1 Mois";
      default: return duration;
    }
  };

  // Gérer les changements dans les sélections d'équipement
  const handleEquipmentSelectChange = (name: string, value: string) => {
    if (name === "weaponType") {
      form.setValue("weaponBrand", "");
      form.setValue("customWeaponBrand", "");
      form.setValue("weaponReference", "");
      form.setValue("weaponCaliber", "");
      form.setValue("weaponOtherDetails", "");
      form.setValue(name as keyof FormValues, value);
    } else if (name === "weaponBrand") {
      form.setValue("customWeaponBrand", "");
      form.setValue("weaponOtherDetails", "");
      form.setValue(name as keyof FormValues, value);
    } else if (name === "weaponCaliber") {
      form.setValue("weaponOtherDetails", "");
      form.setValue(name as keyof FormValues, value);
    } else {
      form.setValue(name as keyof FormValues, value);
    }
  };

  // Filtrer les types d'armes
  const getAvailableWeaponTypes = (permitType?: string) => {
    if (permitType === "grande-chasse") {
      return weaponTypes.filter((type) => type.value !== "lance-pierre");
    }
    return weaponTypes.filter((type) => type.value !== "arbalete" && type.value !== "arc");
  };

  // Filtrer les calibres
  const getAvailableCalibers = (permitType?: string) => {
    if (permitType === "grande-chasse") {
      return largeCalibers;
    }
    return smallCalibers;
  };

  // Gérer l'impression en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    const headerText = "Ensemble pour une Gestion durable de la Faune au Sénégal";
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(headerText);
    const xPosition = (pageWidth - textWidth) / 2;
    doc.text(headerText, xPosition, 20);
    doc.setFontSize(14);
    doc.text("Récapitulatif de la demande de permis de chasse", 20, 40);
    doc.setFontSize(12);
    let y = 50;

    const addLine = (label: string, value: string) => {
      doc.text(`${label}: ${value}`, 20, y);
      y += 10;
    };

    const hunterCategory = form.getValues("hunterCategory") || "";
    const permitType = form.getValues("permitType") || "";
    const duration = form.getValues("duration");
    const pickupRegion = form.getValues("pickupRegion") || "";
    const weaponType = form.getValues("weaponType") || "";
    
    addLine("Catégorie de chasseur", formatHunterCategory(hunterCategory));
    addLine("Type de permis", formatPermitType(permitType));
    if (hunterCategory === "touristique" && duration) {
      addLine("Durée", formatDuration(duration));
    }
    addLine("Région de récupération", regionEnum.find((r) => r.value === pickupRegion)?.label || pickupRegion);
    if (weaponType) {
      addLine("Type d'arme", weaponTypes.find((t) => t.value === weaponType)?.label || weaponType);
    }
    const weaponBrand = form.getValues("weaponBrand") || "";
    const customWeaponBrand = form.getValues("customWeaponBrand") || "";
    const weaponReference = form.getValues("weaponReference") || "";
    const weaponCaliber = form.getValues("weaponCaliber") || "";
    const weaponOtherDetails = form.getValues("weaponOtherDetails") || "";

    if ((weaponType === "fusil" || weaponType === "carabine") && weaponBrand) {
      addLine("Marque", weaponBrand === "AUTRE" ? (customWeaponBrand || "Autre") : weaponBrand);
    }
    if ((weaponType === "fusil" || weaponType === "carabine") && weaponReference) {
      addLine("Référence", weaponReference);
    }
    if ((weaponType === "fusil" || weaponType === "carabine") && weaponCaliber) {
      addLine("Calibre", getAvailableCalibers(permitType).find((c) => c.value === weaponCaliber)?.label || weaponCaliber);
    }
    if (weaponOtherDetails) {
      addLine("Autres détails", weaponOtherDetails);
    }
    addLine("Tarif estimé", `${permitFee?.toString()} FCFA`);

    // Ajouter le texte requis
    doc.setFillColor(254, 243, 199); // Couleur ambre-50
    doc.rect(20, y, 170, 30, "F");
    doc.setTextColor(120, 113, 108); // Couleur ambre-800
    doc.setFontSize(10);
    doc.text(
      "En soumettant cette demande, vous certifiez que les informations fournies sont exactes. Après traitement par un agent, vous recevrez une notification concernant l'approbation ou le rejet de votre demande.",
      25,
      y + 10,
      { maxWidth: 160 }
    );

    doc.save("recapitulatif_demande_permis.pdf");
  };

  // Réinitialiser pour une nouvelle demande
  const handleNewRequest = () => {
    form.reset();
    setStep(1);
    setIsSubmitted(false);
    setPermitFee(null);
  };

  // Gérer la confirmation du dialogue
  const handleDialogConfirm = () => {
    setShowConfirmationDialog(false);
    setStep(totalSteps); // Compléter la barre de progression
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileBadge className="h-6 w-6 text-blue-600" />
          Demande de permis de chasse
        </h1>
      </div>

      <Card className="border border-gray-200 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b py-6">
          <CardTitle className="text-xl md:text-2xl text-blue-800">Formulaire de demande de permis</CardTitle>
          <CardDescription className="text-blue-700 mt-2">
            Veuillez remplir ce formulaire pour demander un nouveau permis de chasse.
            {isActive && (
              <span className="block mt-3 text-sm bg-blue-200/50 p-2 rounded-md border border-blue-200 inline-flex items-center">
                Campagne de chasse en cours: <strong className="mx-1">{year}</strong> (
                {format(new Date(startDate), "d MMM yyyy", { locale: fr })} au{" "}
                {format(new Date(endDate), "d MMM yyyy", { locale: fr })})
              </span>
            )}
          </CardDescription>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-sm font-medium", step >= 1 ? "text-blue-700" : "text-gray-500")}>
                Informations générales
              </span>
              <span className={cn("text-sm font-medium", step >= 2 ? "text-blue-700" : "text-gray-500")}>
                Équipement
              </span>
              <span className={cn("text-sm font-medium", step >= 3 ? "text-blue-700" : "text-gray-500")}>
                {isSubmitted ? "Demande terminée" : "Récapitulatif"}
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center mt-1">
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                step >= 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              )}>
                1
              </div>
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                step >= 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              )}>
                2
              </div>
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                step >= 3 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              )}>
                3
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="hunterCategory"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          {getHunterCategoryIcon(field.value)}
                          Catégorie de chasseur
                          {field.value && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </FormLabel>
                        <FormControl>
                          <div className="text-center text-gray-800 font-medium py-2 px-4 bg-gray-100 border border-gray-200 rounded-md text-lg">
                            {formatHunterCategory(field.value)}
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500 text-center">
                        </FormDescription>
                        <FormMessage className="text-red-500 text-center" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          <FileBadge className="h-5 w-5 text-blue-600" />
                          Type de permis
                          {field.value && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("weaponType", "");
                          form.setValue("weaponBrand", "");
                          form.setValue("customWeaponBrand", "");
                          form.setValue("weaponReference", "");
                          form.setValue("weaponCaliber", "");
                          form.setValue("weaponOtherDetails", "");
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                              <SelectValue placeholder="Sélectionner un type de permis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.getValues("hunterCategory") === "coutumier" ? (
                              <SelectItem value="sportif-petite-chasse">Permis sportif de petite chasse</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="sportif-petite-chasse">Permis sportif de petite chasse</SelectItem>
                                <SelectItem value="grande-chasse">Permis de grande chasse</SelectItem>
                                <SelectItem value="special-gibier-eau">Permis spécial gibier d'eau</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-gray-500">
                          Choisissez le type de permis correspondant à votre activité de chasse.
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  {form.getValues("hunterCategory") === "touristique" && (
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                            <FileBadge className="h-5 w-5 text-blue-600" />
                            Durée du permis
                            {field.value && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                <SelectValue placeholder="Sélectionner une durée" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {durations.map((duration) => (
                                <SelectItem key={duration.value} value={duration.value}>
                                  {duration.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-gray-500">
                            Sélectionnez la durée de validité de votre permis.
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="pickupRegion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          Dans quelle région souhaitez-vous récupérer votre permis ?
                          {field.value && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                              <SelectValue placeholder="Sélectionner une région" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regionEnum.map((region) => (
                              <SelectItem key={region.value} value={region.value}>
                                {region.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-gray-500">
                          Sélectionnez la région où vous souhaitez récupérer votre permis après approbation.
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  {permitFee !== null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <h4 className="text-sm font-medium text-blue-600">Frais de permis estimés:</h4>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-lg font-bold text-blue-700">{permitFee.toLocaleString("fr-FR")} FCFA</p>
                          <p className="text-sm text-blue-600">
                            {formatPermitType(form.getValues("permitType"))}
                            {form.getValues("hunterCategory") === "touristique" && (
                              <span> - {formatDuration(form.getValues("duration"))}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg text-gray-800 flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Équipement de Chasse
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                      <h4 className="col-span-2 font-medium pb-2 border-b mb-2 text-blue-700 flex items-center gap-2">
                        <FileBadge className="h-4 w-4" />
                        Arme principale
                      </h4>
                      <FormField
                        control={form.control}
                        name="weaponType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Type d'arme <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => handleEquipmentSelectChange("weaponType", value)}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                  <SelectValue placeholder="Sélectionner un type d'arme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getAvailableWeaponTypes(form.getValues("permitType")).map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      {form.getValues("weaponType") && (form.getValues("weaponType") === "fusil" || form.getValues("weaponType") === "carabine") && (
                        <>
                          <FormField
                            control={form.control}
                            name="weaponBrand"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Marque <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => handleEquipmentSelectChange("weaponBrand", value)}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                      <SelectValue placeholder="Sélectionner une marque" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {form.getValues("weaponType") === "fusil"
                                      ? fusils.map((marque) => (
                                          <SelectItem key={marque.value} value={marque.value}>
                                            {marque.label}
                                          </SelectItem>
                                        ))
                                      : carabines.map((marque) => (
                                          <SelectItem key={marque.value} value={marque.value}>
                                            {marque.label}
                                          </SelectItem>
                                        ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-gray-500">
                                  Sélectionnez la marque de votre arme (obligatoire pour fusil ou carabine).
                                </FormDescription>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                          {form.getValues("weaponBrand") === "AUTRE" && (
                            <FormField
                              control={form.control}
                              name="customWeaponBrand"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700">Préciser la marque</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Précisez la marque de l'arme"
                                      className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-red-500" />
                                </FormItem>
                              )}
                            />
                          )}
                          <FormField
                            control={form.control}
                            name="weaponReference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">Référence</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Référence de l'arme"
                                    className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="weaponCaliber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Calibre <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => handleEquipmentSelectChange("weaponCaliber", value)}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                      <SelectValue placeholder="Sélectionner un calibre" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getAvailableCalibers(form.getValues("permitType")).map((caliber) => (
                                      <SelectItem key={caliber.value} value={caliber.value}>
                                        {caliber.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-gray-500">
                                  Sélectionnez le calibre de votre arme (obligatoire pour fusil ou carabine).
                                </FormDescription>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      <FormField
                        control={form.control}
                        name="weaponOtherDetails"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-gray-700">
                              Autres détails {(form.getValues("weaponBrand") === "AUTRE" || form.getValues("weaponCaliber") === "AUTRE-CALIBRE") && <span className="text-red-500">*</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Détails supplémentaires sur l'arme"
                                className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-5 space-y-4 border border-blue-200 shadow-inner">
                    <h3 className="font-medium text-lg text-blue-800 flex items-center gap-2">
                      <FileBadge className="h-5 w-5" />
                      Récapitulatif de votre demande
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                        <h4 className="text-sm font-medium text-blue-600">Catégorie de chasseur</h4>
                        <p className="mt-1 font-medium">{formatHunterCategory(form.getValues("hunterCategory"))}</p>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                        <h4 className="text-sm font-medium text-blue-600">Type de permis</h4>
                        <p className="mt-1 font-medium">{formatPermitType(form.getValues("permitType"))}</p>
                      </div>
                      {form.getValues("hunterCategory") === "touristique" && (
                        <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                          <h4 className="text-sm font-medium text-blue-600">Durée</h4>
                          <p className="mt-1 font-medium">{formatDuration(form.getValues("duration"))}</p>
                        </div>
                      )}
                      <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                        <h4 className="text-sm font-medium text-blue-600">Région de récupération</h4>
                        <p className="mt-1 font-medium">
                          {regionEnum.find((r) => r.value === form.getValues("pickupRegion"))?.label || form.getValues("pickupRegion")}
                        </p>
                      </div>
                      {form.getValues("weaponType") && (
                        <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm col-span-1 sm:col-span-2">
                          <h4 className="text-sm font-medium text-blue-600">Type d'arme</h4>
                          <p className="mt-1">
                            {weaponTypes.find((t) => t.value === form.getValues("weaponType"))?.label || form.getValues("weaponType")}
                          </p>
                        </div>
                      )}
                      {(form.getValues("weaponType") === "fusil" || form.getValues("weaponType") === "carabine") && form.getValues("weaponBrand") && (
                        <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                          <h4 className="text-sm font-medium text-blue-600">Marque</h4>
                          <p className="mt-1">
                            {form.getValues("weaponBrand") === "AUTRE"
                              ? `${form.getValues("customWeaponBrand") || "Autre"}`
                              : form.getValues("weaponBrand") || "Non renseigné"}
                          </p>
                        </div>
                      )}
                      {(form.getValues("weaponType") === "fusil" || form.getValues("weaponType") === "carabine") && form.getValues("weaponReference") && (
                        <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                          <h4 className="text-sm font-medium text-blue-600">Référence</h4>
                          <p className="mt-1">{form.getValues("weaponReference")}</p>
                        </div>
                      )}
                      {(form.getValues("weaponType") === "fusil" || form.getValues("weaponType") === "carabine") && form.getValues("weaponCaliber") && (
                        <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                          <h4 className="text-sm font-medium text-blue-600">Calibre</h4>
                          <p className="mt-1">
                            {getAvailableCalibers(form.getValues("permitType")).find((c) => c.value === form.getValues("weaponCaliber"))?.label || form.getValues("weaponCaliber")}
                          </p>
                        </div>
                      )}
                      {form.getValues("weaponOtherDetails") && (
                        <div className="bg-white p-3 rounded-md border border-blue-100 shadow-sm col-span-1 sm:col-span-2">
                          <h4 className="text-sm font-medium text-blue-600">Autres détails</h4>
                          <p className="mt-1">{form.getValues("weaponOtherDetails")}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h4 className="text-sm font-medium text-blue-600">Tarif estimé</h4>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{permitFee?.toLocaleString("fr-FR")} FCFA</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 shadow-inner">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-amber-200 mt-0.5">
                        <Info className="h-4 w-4 text-amber-700" />
                      </div>
                      <div className="text-sm text-amber-800">
                        <p>
                          En soumettant cette demande, vous certifiez que les informations fournies sont exactes. 
                          Après traitement par un agent, vous recevrez une notification concernant l'approbation ou le rejet de votre demande.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isSubmitted && (
                <div className="flex flex-col items-center space-y-4 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800">Demande soumise avec succès !</h3>
                  <p className="text-center text-green-700">
                    Votre demande de permis a été enregistrée et sera traitée par un agent.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full justify-center mt-4">
                    <Button type="button" variant="outline" onClick={handleExportPDF}>
                      Télécharger le récapitulatif (PDF)
                    </Button>
                    <Button type="button" variant="outline" onClick={handleNewRequest}>
                      Faire une nouvelle demande
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 py-6 px-6 bg-gray-50 border-t">
          {!isSubmitted && step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="w-full sm:w-auto gap-2 bg-white hover:bg-gray-100 text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Précédent
            </Button>
          )}
          <div className="flex-grow"></div>
          {!isSubmitted && step < 3 && (
            <Button 
              type="button"
              onClick={nextStep}
              className="w-full sm:w-auto flex gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Suivant
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          )}
          {!isSubmitted && step === 3 && (
            <Button 
              type="submit" 
              form="form"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="w-full sm:w-auto flex gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>Soumettre ma demande</>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Demande envoyée
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Votre demande de permis a été soumise avec succès. Vous recevrez une notification lorsqu'elle sera traitée par un agent.</p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={handleDialogConfirm} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}