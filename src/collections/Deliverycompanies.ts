import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;
  if (user.role === "admin") return true;

  return false;
};

export const DeliveryCompanies: CollectionConfig = {
  slug: "delivery-companies",

  labels: {
    singular: "Delivery Company",
    plural: "Delivery Companies",
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
      label: "Company name",
      type: "text",
      required: true,
    },

    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },

    {
      name: "price",
      label: "Delivery price",
      type: "number",
      required: true,
    },

    {
      name: "deliveryTime",
      label: "Delivery time",
      type: "text",
      required: false,
      admin: {
        description: "Example: 1-3 business days",
      },
    },

    {
      name: "logo",
      label: "Logo",
      type: "upload",
      relationTo: "media",
      required: false,
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