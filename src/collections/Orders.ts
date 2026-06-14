import type { CollectionConfig } from "payload";

function isAdmin(user: any) {
  if (!user) return false;

  if (user.collection === "users") return true;

  if (user.role === "admin") return true;

  return false;
}

function isCustomer(user: any) {
  if (!user) return false;

  return user.collection === "customers";
}

function createOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `PM-${datePart}-${randomPart}`;
}

export const Orders: CollectionConfig = {
  slug: "orders",

  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: [
      "orderNumber",
      "customerEmail",
      "status",
      "paymentStatus",
      "total",
      "createdAt",
    ],
  },

  access: {
    create: () => {
      return true;
    },

    read: ({ req: { user } }) => {
      if (!user) return false;

      if (isAdmin(user)) return true;

      if (isCustomer(user)) {
        return {
          customer: {
            equals: user.id,
          },
        };
      }

      return false;
    },

    update: ({ req: { user } }) => {
      if (!user) return false;

      return isAdmin(user);
    },

    delete: ({ req: { user } }) => {
      if (!user) return false;

      return isAdmin(user);
    },
  },

  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        const user = req.user as any;

        if (!data) return data;

        if (operation === "create") {
          if (user && isCustomer(user) && !data.customer) {
            data.customer = user.id;
          }

          if (user && !data.customerEmail) {
            data.customerEmail = user.email || "";
          }

          if (!data.orderNumber) {
            data.orderNumber = createOrderNumber();
          }

          if (!data.status) {
            data.status = "new";
          }

          if (!data.paymentStatus) {
            data.paymentStatus = "pending";
          }

          if (!data.currency) {
            data.currency = "NOK";
          }

          if (!data.createdFrom) {
            data.createdFrom = "website";
          }
        }

        return data;
      },
    ],
  },

  fields: [
    {
      name: "orderNumber",
      label: "Ordrenummer",
      type: "text",
      required: true,
      admin: {
        readOnly: true,
      },
    },

    {
      name: "customer",
      label: "Kunde",
      type: "relationship",
      relationTo: "customers",
      required: false,
      admin: {
        position: "sidebar",
      },
    },

    {
      name: "customerEmail",
      label: "Kunde e-post",
      type: "email",
      required: false,
    },

    {
      name: "customerName",
      label: "Kunde navn",
      type: "text",
      required: false,
    },

    {
      name: "status",
      label: "Ordrestatus",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        {
          label: "Ny",
          value: "new",
        },
        {
          label: "Under behandling",
          value: "processing",
        },
        {
          label: "Sendt",
          value: "shipped",
        },
        {
          label: "Levert",
          value: "delivered",
        },
        {
          label: "Kansellert",
          value: "cancelled",
        },
      ],
      admin: {
        position: "sidebar",
      },
    },

    {
      name: "paymentStatus",
      label: "Betalingsstatus",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        {
          label: "Venter",
          value: "pending",
        },
        {
          label: "Betalt",
          value: "paid",
        },
        {
          label: "Feilet",
          value: "failed",
        },
        {
          label: "Refundert",
          value: "refunded",
        },
      ],
      admin: {
        position: "sidebar",
      },
    },

    {
      name: "items",
      label: "Produkter",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "productName",
          label: "Produktnavn",
          type: "text",
          required: true,
        },

        {
          name: "productType",
          label: "Produkttype",
          type: "select",
          required: true,
          options: [
            {
              label: "Dyremat",
              value: "dyremat",
            },
            {
              label: "Tilbehør",
              value: "tilbehor",
            },
          ],
        },

        {
          name: "productId",
          label: "Produkt ID",
          type: "text",
          required: false,
        },

        {
          name: "imageUrl",
          label: "Bilde URL",
          type: "text",
          required: false,
        },

        {
          name: "quantity",
          label: "Antall",
          type: "number",
          required: true,
          min: 1,
        },

        {
          name: "price",
          label: "Pris",
          type: "number",
          required: true,
          min: 0,
        },

        {
          name: "originalPrice",
          label: "Originalpris",
          type: "number",
          required: false,
          min: 0,
        },

        {
          name: "lineTotal",
          label: "Linjesum",
          type: "number",
          required: true,
          min: 0,
        },
      ],
    },

    {
      name: "subtotal",
      label: "Delsum",
      type: "number",
      required: true,
      min: 0,
    },

    {
      name: "shipping",
      label: "Frakt",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
    },

    {
      name: "discount",
      label: "Rabatt",
      type: "number",
      required: false,
      min: 0,
      defaultValue: 0,
    },

    {
      name: "total",
      label: "Total",
      type: "number",
      required: true,
      min: 0,
    },

    {
      name: "currency",
      label: "Valuta",
      type: "text",
      required: true,
      defaultValue: "NOK",
    },

    {
      name: "deliveryAddress",
      label: "Leveringsadresse",
      type: "group",
      fields: [
        {
          name: "fullName",
          label: "Fullt navn",
          type: "text",
          required: false,
        },

        {
          name: "phone",
          label: "Telefon",
          type: "text",
          required: false,
        },

        {
          name: "address",
          label: "Adresse",
          type: "text",
          required: false,
        },

        {
          name: "postalCode",
          label: "Postnummer",
          type: "text",
          required: false,
        },

        {
          name: "city",
          label: "By",
          type: "text",
          required: false,
        },
      ],
    },

    {
      name: "note",
      label: "Notat",
      type: "textarea",
      required: false,
    },

    {
      name: "createdFrom",
      label: "Opprettet fra",
      type: "select",
      defaultValue: "website",
      options: [
        {
          label: "Website",
          value: "website",
        },
        {
          label: "Admin",
          value: "admin",
        },
      ],
      admin: {
        position: "sidebar",
      },
    },
  ],
};