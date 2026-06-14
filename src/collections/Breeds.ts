import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;
  if (user.role === "admin") return true;

  return false;
};

export const Breeds: CollectionConfig = {
  slug: "breeds",

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
      label: "Breed name",
      type: "text",
      required: true,
    },

    {
      name: "petType",
      label: "Pet Type",
      type: "relationship",
      relationTo: "pet-types" as any,
      required: true,
    },
  ],
};