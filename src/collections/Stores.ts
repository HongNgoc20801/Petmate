import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;
  if (user.role === "admin") return true;

  return false;
};

export const Stores: CollectionConfig = {
  slug: "stores",

  labels: {
    singular: "Store",
    plural: "Stores",
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
      label: "Store name",
      type: "text",
      required: true,
    },

    {
      name: "address",
      label: "Address",
      type: "text",
      required: true,
    },

    {
      name: "postalCode",
      label: "Postal code",
      type: "text",
      required: true,
    },

    {
      name: "city",
      label: "City",
      type: "text",
      required: true,
    },

    {
      name: "phone",
      label: "Phone",
      type: "text",
      required: false,
    },

    {
      name: "openingHours",
      label: "Opening hours",
      type: "text",
      required: false,
    },

    {
      name: "distanceText",
      label: "Distance text",
      type: "text",
      required: false,
      admin: {
        description:
          "Example: 1.2 km away. You can write this manually for now.",
      },
    },

    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
};