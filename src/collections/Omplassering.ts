import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;

  if (user.role === "admin") return true;

  return false;
};

const getRelationId = (value: unknown): string | number | undefined => {
  if (!value) return undefined;

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return getRelationId(value[0]);
  }

  if (typeof value === "object") {
    const obj = value as {
      id?: unknown;
      value?: unknown;
      doc?: unknown;
    };

    if (typeof obj.id === "string" || typeof obj.id === "number") {
      return obj.id;
    }

    if (typeof obj.value === "string" || typeof obj.value === "number") {
      return obj.value;
    }

    if (obj.value && typeof obj.value === "object") {
      return getRelationId(obj.value);
    }

    if (obj.doc) {
      return getRelationId(obj.doc);
    }
  }

  return undefined;
};

export const Omplassering: CollectionConfig = {
  slug: "omplassering",

  labels: {
    singular: "Omplassering pet",
    plural: "Omplassering pets",
  },

  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "petType", "breed", "age", "gender", "status"],
  },

  access: {
    read: () => {
      return true;
    },

    create: ({ req: { user } }) => {
      return isAdmin(user);
    },

    update: ({ req: { user } }) => {
      return isAdmin(user);
    },

    delete: ({ req: { user } }) => {
      return isAdmin(user);
    },
  },

  fields: [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },

    {
      name: "petType",
      label: "Pet type",
      type: "relationship",
      relationTo: "pet-types" as any,
      required: true,
      admin: {
        description: "Choose the pet type first, for example Hund or Katt.",
      },
    },

    {
      name: "breed",
      label: "Breed",
      type: "relationship",
      relationTo: "breeds" as any,
      required: false,
      filterOptions: ({ data, siblingData }) => {
        const currentData = data as {
          petType?: unknown;
        };

        const currentSiblingData = siblingData as {
          petType?: unknown;
        };

        const petTypeId = getRelationId(
          currentSiblingData?.petType || currentData?.petType
        );

        if (!petTypeId) {
          return false;
        }

        return {
          petType: {
            equals: petTypeId,
          },
        };
      },
      admin: {
        description:
          "Only breeds connected to the selected pet type will be shown.",
      },
    },

    {
      name: "age",
      label: "Age",
      type: "number",
      required: true,
      min: 0,
    },

    {
      name: "ageUnit",
      label: "Age unit",
      type: "select",
      required: true,
      defaultValue: "years",
      options: [
        {
          label: "Months",
          value: "months",
        },
        {
          label: "Years",
          value: "years",
        },
      ],
    },

    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        {
          label: "Male",
          value: "male",
        },
        {
          label: "Female",
          value: "female",
        },
      ],
    },

    {
      name: "personality",
      label: "Personality",
      type: "text",
      required: false,
    },

    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },

    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: "available",
      options: [
        {
          label: "Available",
          value: "available",
        },
        {
          label: "Adopted",
          value: "adopted",
        },
      ],
    },

    {
      name: "image",
      label: "Image",
      type: "upload",
      relationTo: "media",
      required: false,
    },
  ],
};