import { z } from "zod";
import { CrudPage } from "../../components/crud/CrudPage";
import { omitEmptyStrings } from "../../components/crud/crud-helpers";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  profession: string | null;
  address: string | null;
}

const schema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  profession: z.string().optional(),
  address: z.string().optional(),
});

const fullName = (parent: Parent) => `${parent.lastName} ${parent.firstName}`;

export default function ParentsPage() {
  return (
    <CrudPage<Parent>
      title="Parents"
      description="Les parents et tuteurs, à lier aux élèves depuis la page dédiée."
      itemLabel="parent"
      createLabel="Nouveau parent"
      queryKey={["parents"]}
      endpoint="/parents"
      columns={[
        { header: "Parent", primary: true, render: fullName },
        { header: "Téléphone", render: (parent) => parent.phone || "—" },
        { header: "Email", render: (parent) => parent.email || "—" },
        { header: "Profession", render: (parent) => parent.profession || "—" },
      ]}
      fields={[
        { name: "firstName", label: "Prénom", type: "text", required: true },
        { name: "lastName", label: "Nom", type: "text", required: true },
        { name: "phone", label: "Téléphone", type: "text" },
        { name: "email", label: "Email", type: "text" },
        { name: "profession", label: "Profession", type: "text" },
        { name: "address", label: "Adresse", type: "text" },
      ]}
      schema={schema}
      toDefaults={(parent) => ({
        firstName: parent?.firstName ?? "",
        lastName: parent?.lastName ?? "",
        phone: parent?.phone ?? "",
        email: parent?.email ?? "",
        profession: parent?.profession ?? "",
        address: parent?.address ?? "",
      })}
      toSubmit={(values) =>
        omitEmptyStrings({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          email: values.email,
          profession: values.profession,
          address: values.address,
        })
      }
      nameOf={fullName}
    />
  );
}
