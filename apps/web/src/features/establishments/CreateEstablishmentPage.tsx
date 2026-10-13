import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { AuthField, AuthRootError } from "../auth/components/AuthField";

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  slug: z
    .string()
    .min(2, "Minimum 2 caractères")
    .regex(/^[a-z0-9-]+$/, "Uniquement des lettres minuscules, chiffres et tirets"),
  type: z.enum(["PRIMARY", "COLLEGE", "LYCEE", "MIXED"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateEstablishmentResponse {
  id: string;
  name: string;
  slug: string;
  accessToken: string;
  refreshToken: string;
}

const TYPE_OPTIONS = [
  { label: "Primaire", value: "PRIMARY" },
  { label: "Collège", value: "COLLEGE" },
  { label: "Lycée", value: "LYCEE" },
  { label: "Mixte", value: "MIXED" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateEstablishmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", type: undefined },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setError("root", { message: "Session perdue. Veuillez vous reconnecter." });
      return;
    }
    try {
      const response = await api.post<CreateEstablishmentResponse>("/establishments", {
        name: data.name,
        slug: data.slug,
        ...(data.type ? { type: data.type } : {}),
      });
      const { id, accessToken, refreshToken } = response.data;

      // Contrat : la création régénère les tokens (rôle DIRECTOR forcé côté API).
      // Les anciens tokens doivent être remplacés, pas conservés.
      queryClient.clear();
      setAuth({ user, accessToken, refreshToken, establishmentId: id, role: "DIRECTOR" });

      navigate("/dashboard");
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  };

  return (
    <div className="mx-auto max-w-[520px]">
      <Card className="p-p6">
        <div className="flex flex-col gap-p5">
          <div className="text-center">
            <h1 className="text-sb20 text-(--skools-text-primary)">Créer votre établissement</h1>
            <p className="mt-p1 text-r14 text-(--skools-text-muted)">
              Pour commencer à utiliser Skools, créez votre établissement scolaire.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-p4" noValidate>
            <Controller
              name="name"
              control={control}
              render={({ field: { value, onChange, onBlur, name }, fieldState }) => (
                <AuthField label="Nom de l'établissement" error={fieldState.error?.message}>
                  <Input
                    label="Ex : Lycée Moderne de Cocody"
                    name={name}
                    value={value}
                    onBlur={onBlur}
                    onChange={(v) => {
                      onChange(v);
                      if (!slugTouched) setValue("slug", slugify(v), { shouldValidate: false });
                    }}
                    error={!!fieldState.error}
                  />
                </AuthField>
              )}
            />

            <Controller
              name="slug"
              control={control}
              render={({ field: { value, onChange, onBlur, name }, fieldState }) => (
                <AuthField label="Identifiant (slug)" error={fieldState.error?.message}>
                  <Input
                    label="Ex : lycee-moderne-cocody"
                    name={name}
                    value={value}
                    onBlur={onBlur}
                    onChange={(v) => {
                      setSlugTouched(true);
                      onChange(v);
                    }}
                    error={!!fieldState.error}
                    helperText="Utilisé dans les URLs. Minuscules, chiffres et tirets."
                  />
                </AuthField>
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field: { value, onChange }, fieldState }) => (
                <AuthField label="Type d'établissement (optionnel)" error={fieldState.error?.message}>
                  <Select
                    label="Non précisé"
                    options={TYPE_OPTIONS}
                    value={value ?? ""}
                    onChange={(v) => onChange(v === "" ? undefined : (v as FormData["type"]))}
                    disableSearch
                    error={!!fieldState.error}
                  />
                </AuthField>
              )}
            />

            <AuthRootError message={errors.root?.message} />

            <Button type="submit" variant={isSubmitting ? "loading" : "primary"} disabled={isSubmitting}>
              {isSubmitting ? "Création…" : "Créer mon établissement"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
