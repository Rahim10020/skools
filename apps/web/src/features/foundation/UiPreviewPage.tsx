import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  Pagination,
  Select,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableCellPrimary,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Toaster,
  toast,
  useModal,
} from "../../components/ui/index";
import SearchIcon from "../../components/icons/SearchIcon";
import { TrashIcon } from "../../components/icons/TrashIcon";
import PlusIcon from "../../components/icons/PlusIcon";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-p4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="mt-p4 flex flex-col gap-p4">{children}</div>
    </Card>
  );
}

/**
 * Page temporaire de validation visuelle Phase 2.
 * Sera supprimée en Phase 3 lors de la mise en place du shell définitif.
 */
export default function UiPreviewPage() {
  const [selectValue, setSelectValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [page, setPage] = useState(2);
  const modal = useModal();

  return (
    <div className="min-h-screen bg-(--skools-app-bg) text-(--skools-text-primary)">
      <Toaster />
      <div className="mx-auto max-w-[1280px] px-p4 pt-p13 sm:px-p10 pb-p10">
        <h1 className="text-sb32">Primitives UI</h1>
        <p className="text-r14 text-(--skools-text-muted)">
          Port EPL — boutons, champs, table, modale, toast, états
        </p>

        <div className="mt-p8 flex flex-col gap-p6">
          <Section title="Boutons">
            <div className="flex flex-wrap gap-p3">
              <Button fullWidth={false}>Primaire</Button>
              <Button fullWidth={false} variant="secondary">Secondaire</Button>
              <Button fullWidth={false} variant="outline">Contour</Button>
              <Button fullWidth={false} variant="loading">Chargement</Button>
              <Button fullWidth={false} disabled>Désactivé</Button>
              <Button fullWidth={false} icon={<PlusIcon className="size-full" />}>Avec icône</Button>
            </div>
          </Section>

          <Section title="Champs">
            <Input label="Nom de l'établissement" onChange={() => undefined} />
            <Input variant="texted" label="Nom" helperText="Texte d'aide sous le champ" onChange={() => undefined} />
            <Input
              variant="iconed"
              label="Rechercher un élève…"
              leftIcon={<SearchIcon className="size-full" />}
              onChange={() => undefined}
            />
            <Input variant="password" label="Mot de passe" onChange={() => undefined} />
            <Input variant="date" label="Date de naissance" onChange={() => undefined} />
            <Input label="Champ en erreur" error helperText="Ce champ est requis" onChange={() => undefined} />
            <Select
              label="Classe"
              value={selectValue}
              onChange={setSelectValue}
              options={[
                { label: "6ème A", value: "6a" },
                { label: "6ème B", value: "6b" },
                { label: "5ème A", value: "5a" },
              ]}
            />
            <Textarea label="Description" helperText="Maximum 500 caractères" onChange={() => undefined} />
            <Checkbox checked={checked} onChange={setChecked} label="Publier l'examen" />
          </Section>

          <Section title="Badges">
            <div className="flex flex-wrap gap-p2">
              <Badge>info</Badge>
              <Badge variant="success">Présent</Badge>
              <Badge variant="destructive">Absent</Badge>
              <Badge variant="warning">Retard</Badge>
              <Badge variant="neutral">Brouillon</Badge>
              <Badge variant="ghost">Discret</Badge>
            </div>
          </Section>

          <Section title="Table + pagination">
            <TableContainer>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Élève</TableHeaderCell>
                    <TableHeaderCell>Matricule</TableHeaderCell>
                    <TableHeaderCell>Statut</TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCellPrimary>Aminata Diallo</TableCellPrimary>
                    <TableCell>SK-001</TableCell>
                    <TableCell><Badge variant="success">Présent</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCellPrimary>Moussa Barry</TableCellPrimary>
                    <TableCell>SK-002</TableCell>
                    <TableCell><Badge variant="warning">Retard</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination page={page} totalPages={5} hasPrevious={page > 1} hasNext={page < 5} onPageChange={setPage} />
          </Section>

          <Section title="Modale + toast">
            <div className="flex flex-wrap gap-p3">
              <Modal.Root open={modal.isOpen} onOpenChange={modal.setIsOpen}>
                <Modal.Trigger>
                  <Button fullWidth={false}>Ouvrir la modale</Button>
                </Modal.Trigger>
                <Modal.Content labelledBy="ui-preview-modal-title">
                  <Modal.Header>
                    <Modal.Title id="ui-preview-modal-title">Confirmer la suppression</Modal.Title>
                    <Modal.Description>Cette action est irréversible.</Modal.Description>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-r14">Voulez-vous vraiment supprimer cet élément ?</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Modal.Close>
                      <Button variant="secondary" fullWidth={false}>Annuler</Button>
                    </Modal.Close>
                    <Button fullWidth={false} variant="primary">Supprimer</Button>
                  </Modal.Footer>
                </Modal.Content>
              </Modal.Root>
              <Button fullWidth={false} variant="secondary" onClick={() => toast.success("Enregistré avec succès")}>
                Toast succès
              </Button>
              <Button fullWidth={false} variant="secondary" onClick={() => toast.error("Échec de l'enregistrement")}>
                Toast erreur
              </Button>
            </div>
          </Section>

          <Section title="Divers">
            <div className="flex items-center gap-p4">
              <Avatar alt="Aminata Diallo" />
              <Avatar alt="Moussa Barry" info={false} />
              <IconButton aria-label="Supprimer">
                <TrashIcon className="size-4" />
              </IconButton>
              <Tooltip>
                <TooltipTrigger>
                  <Button fullWidth={false} variant="secondary">Survolez-moi</Button>
                </TooltipTrigger>
                <TooltipContent>Info-bulle accessible au clavier</TooltipContent>
              </Tooltip>
            </div>
            <Separator />
            <Skeleton className="h-(--size-s10) rounded-r2" count={2} />
          </Section>

          <Section title="États vides / erreur">
            <EmptyState
              title="Aucun élève inscrit"
              description="Inscrivez des élèves dans cette classe pour commencer l'appel."
            />
            <ErrorState onRetry={() => toast.info("Nouvelle tentative…")} />
          </Section>
        </div>
      </div>
    </div>
  );
}
