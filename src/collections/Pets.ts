import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;
  if (user.collection === "users") return true;
  if (user.role === "admin") return true;

  return false;
};

export const Pets: CollectionConfig = {
  slug: "pets",

  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "petType", "breed", "owner", "createdAt"],
  },

  access: {
    create: ({ req: { user } }) => Boolean(user),

    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdmin(user)) return true;

      return {
        owner: {
          equals: user.id,
        },
      };
    },

    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdmin(user)) return true;

      return {
        owner: {
          equals: user.id,
        },
      };
    },

    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdmin(user)) return true;

      return {
        owner: {
          equals: user.id,
        },
      };
    },
  },

  hooks: {
    beforeChange: [
      ({ data, req }) => {
        const user = req.user as any;

        if (!user) return data;

        if (!isAdmin(user)) {
          data.owner = user.id;
        }

        return data;
      },
    ],
  },

  fields: [
    {
      name: "owner",
      label: "Owner",
      type: "relationship",
      relationTo: "customers",
      required: true,
      admin: {
        position: "sidebar",
      },
    },

    {
      name: "name",
      label: "Navn",
      type: "text",
      required: true,
    },

    {
      name: "petType",
      label: "Type",
      type: "select",
      required: true,
      options: [
        {
          label: "Hund",
          value: "dog",
        },
        {
          label: "Katt",
          value: "cat",
        },
        {
          label: "Smådyr",
          value: "smallAnimal",
        },
      ],
    },

    {
      name: "breed",
      label: "Rase",
      type: "text",
      required: false,
    },

    {
      name: "image",
      label: "Bilde",
      type: "upload",
      relationTo: "media",
      required: false,
    },

    {
      name: "gender",
      label: "Kjønn",
      type: "select",
      required: false,
      options: [
        {
          label: "Han",
          value: "male",
        },
        {
          label: "Hun",
          value: "female",
        },
      ],
    },

    {
      name: "sterilized",
      label: "Sterilisert",
      type: "select",
      required: false,
      options: [
        {
          label: "Ikke sterilisert",
          value: "notSterilized",
        },
        {
          label: "Sterilisert",
          value: "sterilized",
        },
      ],
    },

    {
      name: "origin",
      label: "Er kjæledyret ditt",
      type: "select",
      required: false,
      options: [
        {
          label: "Fra oppdretter",
          value: "breeder",
        },
        {
          label: "Adoptert",
          value: "adopted",
        },
      ],
    },

    {
      name: "birthDate",
      label: "Fødselsdato",
      type: "text",
      required: false,
      admin: {
        placeholder: "DD.MM.ÅÅÅÅ",
      },
    },

    {
      name: "description",
      label: "Beskrivelse",
      type: "textarea",
      required: false,
    },
  ],
};