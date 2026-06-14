import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;
  if (user.role === "admin") return true;

  return false;
};

export const MatTypes: CollectionConfig = {
  slug: "mat-types",

  admin: {
    useAsTitle: "name",
  },

  access: {
    read: () => true,

    create: ({ req: { user } }) => isAdmin(user),

    update: ({ req: { user } }) => isAdmin(user),

    delete: ({ req: { user } }) => isAdmin(user),
  },

  fields: [
    {
      name: "name",
      label: "Mat type",
      type: "text",
      required: true,
    },
  ],
};