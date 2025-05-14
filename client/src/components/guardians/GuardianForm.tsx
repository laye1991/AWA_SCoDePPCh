import React from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuardianSchema, type Guardian } from "@shared/schema";
import { z } from "zod";
import { Spinner } from "@/components/ui/spinner";

type GuardianFormValues = z.infer<typeof insertGuardianSchema>;

type GuardianFormProps = {
  onSubmit: (data: GuardianFormValues) => void;
  defaultValues?: Partial<GuardianFormValues>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

// Validation schema étendu pour les formulaires de tuteurs
const guardianFormSchema = insertGuardianSchema.extend({
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  idNumber: z.string().min(4, "Le numéro de pièce d'identité doit contenir au moins 4 caractères"),
  relationship: z.string().min(3, "La relation avec le mineur doit être spécifiée"),
  phone: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres").optional(),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères").optional(),
});

export function GuardianForm({
  onSubmit,
  defaultValues = {},
  isSubmitting = false,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  onCancel,
}: GuardianFormProps) {
  const form = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianFormSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      idNumber: "",
      relationship: "",
      phone: "",
      address: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: GuardianFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Nom du tuteur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Prénom du tuteur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de pièce d'identité</FormLabel>
                <FormControl>
                  <Input placeholder="Numéro de CNI, passeport, etc." className="text-center" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relation avec le mineur</FormLabel>
                <FormControl>
                  <Input placeholder="Père, Mère, Tuteur légal, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Numéro de téléphone du tuteur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input placeholder="Adresse du tuteur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
