import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;
  if (user.role === "admin") return true;

  return false;
};

export const TilbehorTypes: CollectionConfig = {
  slug: "tilbehor-types",
  labels: {
    singular: "Tilbehor Type",
    plural: "Tilbehor Types",
  },

  admin: {
    useAsTitle: "name",
  },

  access: {
    read: () => true,

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
      label: "Type name",
      type: "text",
      required: true,
    },
  ],
};