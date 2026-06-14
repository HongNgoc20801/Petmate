import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;
  if (user.role === "admin") return true;

  return false;
};

export const Tilbehor: CollectionConfig = {
  slug: "tilbehor",

  labels: {
    singular: "Tilbehor",
    plural: "Tilbehors",
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

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;

        const vatPercent = 25;
        const vatMultiplier = 1 + vatPercent / 100;

        const purchasePrice = Number(data.purchasePrice || 0);
        const purchasePriceIncludesTax = Boolean(data.purchasePriceIncludesTax);

        let profitPercent = Number(data.profitPercent || 0);

        if (profitPercent < 0) {
          profitPercent = 0;
        }

        let discountPercent = Number(data.discountPercent || 0);

        if (discountPercent < 0) {
          discountPercent = 0;
        }

        if (discountPercent > 100) {
          discountPercent = 100;
        }

        data.profitPercent = profitPercent;
        data.discountPercent = discountPercent;

        let costPriceBeforeTax = 0;

        if (purchasePrice > 0) {
          if (purchasePriceIncludesTax) {
            costPriceBeforeTax = purchasePrice / vatMultiplier;
          } else {
            costPriceBeforeTax = purchasePrice;
          }
        }

        data.costPriceBeforeTax = Math.round(costPriceBeforeTax * 100) / 100;

        const sellingPriceBeforeTax =
          costPriceBeforeTax * (1 + profitPercent / 100);

        data.priceBeforeTax = Math.round(sellingPriceBeforeTax * 100) / 100;

        const customerPriceIncludingVat =
          sellingPriceBeforeTax * vatMultiplier;

        data.price = Math.round(customerPriceIncludingVat * 100) / 100;

        if (data.price > 0 && discountPercent > 0) {
          const discountAmount = data.price * (discountPercent / 100);
          const salePrice = data.price - discountAmount;

          data.salePrice = Math.round(salePrice * 100) / 100;
        } else {
          data.salePrice = null;
        }

        return data;
      },
    ],
  },

  fields: [
    {
      name: "name",
      label: "Product name",
      type: "text",
      required: true,
    },

    {
      name: "petType",
      label: "Pet Type",
      type: "relationship",
      relationTo: "pet-types" as any,
      hasMany: true,
      required: true,
    },

    {
      name: "tilbehorType",
      label: "Accessory Type",
      type: "relationship",
      relationTo: "tilbehor-types" as any,
      required: true,
    },

    {
      name: "brand",
      label: "Brand",
      type: "text",
      required: false,
    },

    {
      name: "purchasePrice",
      label: "Purchase price",
      type: "number",
      required: true,
      admin: {
        description:
          "The price the seller paid for this product. Tick the checkbox below if this price already includes 25% VAT.",
      },
    },

    {
      name: "purchasePriceIncludesTax",
      label: "Purchase price already includes 25% VAT",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Tick this if the purchase price already includes VAT. The system will remove VAT before calculating profit and final customer price.",
      },
    },

    {
      name: "costPriceBeforeTax",
      label: "Cost price before VAT",
      type: "number",
      required: false,
      admin: {
        readOnly: true,
        description:
          "Calculated automatically. If purchase price includes VAT, the system removes VAT first.",
      },
    },

    {
      name: "profitPercent",
      label: "Profit percent (%)",
      type: "number",
      required: false,
      defaultValue: 0,
      min: 0,
      admin: {
        description:
          "The profit percentage the seller wants to add before calculating the final customer price.",
      },
    },

    {
      name: "priceBeforeTax",
      label: "Selling price before VAT",
      type: "number",
      required: false,
      admin: {
        readOnly: true,
        description:
          "Calculated automatically from cost price before VAT and profit percent.",
      },
    },

    {
      name: "price",
      label: "Customer price including 25% VAT",
      type: "number",
      required: false,
      admin: {
        readOnly: true,
        description:
          "Final customer price including VAT and profit. This is the price shown to customers.",
      },
    },

    {
      name: "discountPercent",
      label: "Discount percent (%)",
      type: "number",
      required: false,
      defaultValue: 0,
      min: 0,
      max: 100,
    },

    {
      name: "salePrice",
      label: "Sale price",
      type: "number",
      required: false,
      admin: {
        readOnly: true,
        description:
          "Calculated automatically from customer price including VAT and discount percent.",
      },
    },

    {
      name: "material",
      label: "Material",
      type: "text",
      required: false,
    },

    {
      name: "color",
      label: "Color",
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
        { label: "Available", value: "available" },
        { label: "Sold out", value: "sold-out" },
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