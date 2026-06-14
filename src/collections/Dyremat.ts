import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;

  if (user.role === "admin") return true;

  return false;
};

export const Dyremat: CollectionConfig = {
  slug: "dyremat",

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

        if (Array.isArray(data.sizes)) {
          data.sizes = data.sizes.map((size: any) => {
            const purchasePrice = Number(size.purchasePrice || 0);
            const purchasePriceIncludesTax = Boolean(
              size.purchasePriceIncludesTax
            );

            let profitPercent = Number(size.profitPercent || 0);

            if (profitPercent < 0) {
              profitPercent = 0;
            }

            let discountPercent = Number(size.discountPercent || 0);

            if (discountPercent < 0) {
              discountPercent = 0;
            }

            if (discountPercent > 100) {
              discountPercent = 100;
            }

            let costPriceBeforeTax = 0;

            if (purchasePrice > 0) {
              if (purchasePriceIncludesTax) {
                costPriceBeforeTax = purchasePrice / vatMultiplier;
              } else {
                costPriceBeforeTax = purchasePrice;
              }
            }

            const roundedCostPriceBeforeTax =
              Math.round(costPriceBeforeTax * 100) / 100;

            const sellingPriceBeforeTax =
              costPriceBeforeTax * (1 + profitPercent / 100);

            const roundedSellingPriceBeforeTax =
              Math.round(sellingPriceBeforeTax * 100) / 100;

            const customerPriceIncludingVat =
              sellingPriceBeforeTax * vatMultiplier;

            const price = Math.round(customerPriceIncludingVat * 100) / 100;

            let salePrice = null;

            if (price > 0 && discountPercent > 0) {
              const discountAmount = price * (discountPercent / 100);
              const calculatedSalePrice = price - discountAmount;

              salePrice = Math.round(calculatedSalePrice * 100) / 100;
            }

            return {
              ...size,
              profitPercent,
              discountPercent,
              costPriceBeforeTax: roundedCostPriceBeforeTax,
              priceBeforeTax: roundedSellingPriceBeforeTax,
              price,
              salePrice,
            };
          });
        }

        return data;
      },
    ],
  },

  fields: [
    {
      name: "name",
      label: "Food name",
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

    {
      name: "matType",
      label: "Mat Type",
      type: "relationship",
      relationTo: "mat-types" as any,
      required: true,
    },

    {
      name: "brand",
      label: "Brand",
      type: "text",
      required: false,
    },

    {
      name: "sizes",
      label: "Sizes / Package options",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "weightValue",
          label: "Weight",
          type: "number",
          required: true,
        },

        {
          name: "weightUnit",
          label: "Unit",
          type: "select",
          required: true,
          defaultValue: "kg",
          options: [
            { label: "kg", value: "kg" },
            { label: "g", value: "g" },
          ],
        },

        {
          name: "purchasePrice",
          label: "Purchase price",
          type: "number",
          required: true,
          admin: {
            description:
              "The price the seller paid for this size. Tick the checkbox below if this price already includes 25% VAT.",
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
              "The profit percentage the seller wants to add for this size before calculating the final customer price.",
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
              "This price is calculated automatically from customer price including VAT and discount percent for this size.",
          },
        },
      ],
    },

    {
      name: "price",
      label: "Old price",
      type: "number",
      required: false,
      admin: {
        hidden: true,
      },
    },

    {
      name: "weightValue",
      label: "Old weight",
      type: "number",
      required: false,
      admin: {
        hidden: true,
      },
    },

    {
      name: "weightUnit",
      label: "Old weight unit",
      type: "select",
      required: false,
      options: [
        { label: "kg", value: "kg" },
        { label: "g", value: "g" },
      ],
      admin: {
        hidden: true,
      },
    },

    {
      name: "countryOfOrigin",
      label: "Country of origin",
      type: "text",
      required: false,
    },

    {
      name: "ingredients",
      label: "Ingredients",
      type: "textarea",
      required: false,
    },

    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },

    {
      name: "feedingGuide",
      label: "Feeding guide",
      type: "array",
      required: false,
      fields: [
        {
          name: "weightFrom",
          label: "Weight from",
          type: "number",
          required: true,
        },

        {
          name: "weightTo",
          label: "Weight to",
          type: "number",
          required: true,
        },

        {
          name: "amount",
          label: "Food amount",
          type: "text",
          required: true,
        },
      ],
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