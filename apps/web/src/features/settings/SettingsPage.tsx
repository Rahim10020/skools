import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../components/ui/toast";

interface Establishment {
  id: string;
  name: string;
  slug: string;
  type: "PRIMARY" | "COLLEGE" | "LYCEE" | "MIXED" | null;
  logoUrl: string | null;
}

const TYPE_OPTIONS = [
  { label: "Primaire", value: "PRIMARY" },
  { label: "Collège", value: "COLLEGE" },
  { label: "Lycée", value: "LYCEE" },
  { label: "Mixte", value: "MIXED" },
];

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function SettingsForm({ establishment }: { establishment: Establishment }) {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const canWrite = role === "DIRECTOR" || role === "ADMIN";

  const [name, setName] = useState(establishment.name);
  const [slug, setSlug] = useState(establishment.slug);
  const [type, setType] = useState(establishment.type ?? "");
  const [logoUrl, setLogoUrl] = useState(establishment.logoUrl ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; type?: string; logoUrl?: string }) =>
      (await api.patch(`/establishments/${establishment.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["establishment", establishment.id] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setFormError(null);
      toast.success("Paramètres enregistrés");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    if (slug.trim().length < 2 || !SLUG_PATTERN.test(slug.trim())) {
      setFormError("Identifiant invalide : minuscules, chiffres et tirets uniquement.");
      return;
    }
    setFormError(null);
    updateMutation.mutate({
      name: name.trim(),
      slug: slug.trim(),
      ...(type ? { type } : {}),
      ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
    });
  };

  return (
    <Card className="p-p6">
      {!canWrite && (
        <p className="text-r14 text-(--skools-text-muted) mb-p4">
          Lecture seule : les modifications sont réservées au directeur et à l&apos;administration.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-p4" noValidate>
        <div className="flex flex-col gap-p1">
          <span className="text-m12 text-(--skools-text-primary)">Nom de l&apos;établissement</span>
          <Input label="Nom" value={name} onChange={setName} disabled={!canWrite} />
        </div>
        <div className="flex flex-col gap-p1">
          <span className="text-m12 text-(--skools-text-primary)">Identifiant (slug)</span>
          <Input label="Slug" value={slug} onChange={setSlug} disabled={!canWrite} />
        </div>
        <div className="flex flex-col gap-p1">
          <span className="text-m12 text-(--skools-text-primary)">Type</span>
          <Select
            label="Type"
            value={type}
            onChange={setType}
            disableSearch
            disabled={!canWrite}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="flex flex-col gap-p1">
          <span className="text-m12 text-(--skools-text-primary)">Logo (URL, optionnel)</span>
          <Input label="https://…" value={logoUrl} onChange={setLogoUrl} disabled={!canWrite} />
        </div>
        {formError && (
          <p role="alert" className="text-r14 text-(--common-red)">
            {formError}
          </p>
        )}
        {canWrite && (
          <div>
            <Button
              type="submit"
              fullWidth={false}
              variant={updateMutation.isPending ? "loading" : "primary"}
              disabled={updateMutation.isPending}
            >
              Enregistrer
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const establishmentId = useAuthStore((s) => s.establishmentId);

  const establishmentQuery = useQuery({
    queryKey: ["establishment", establishmentId],
    queryFn: async () => {
      if (!establishmentId) return null;
      return (await api.get<Establishment>(`/establishments/${establishmentId}`)).data;
    },
    enabled: !!establishmentId,
  });

  return (
    <div>
      <PageHeader
        title="Paramètres de l'établissement"
        description="Identité et informations générales."
      />

      {!establishmentId ? (
        <EmptyState
          title="Aucun établissement"
          description="Créez d'abord votre établissement pour accéder aux paramètres."
        />
      ) : establishmentQuery.isError ? (
        <ErrorState
          message={getErrorMessage(establishmentQuery.error)}
          onRetry={() => {
            void establishmentQuery.refetch();
          }}
        />
      ) : establishmentQuery.isPending || !establishmentQuery.data ? (
        <Skeleton className="h-[320px] rounded-r2" />
      ) : (
        <SettingsForm key={establishmentQuery.data.id} establishment={establishmentQuery.data} />
      )}
    </div>
  );
}
