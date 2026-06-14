import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  if (user.collection === "users") return true;

  if (user.role === "admin") return true;

  return false;
};
const getRelationId = (value: unknown): string | number | undefined => {
  if (!value) return undefined;

  // Nếu Payload trả thẳng id dạng string hoặc number
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  // Nếu Payload trả array thì lấy phần tử đầu tiên
  if (Array.isArray(value)) {
    return getRelationId(value[0]);
  }

  // Nếu Payload trả object
  if (typeof value === "object") {
    const obj = value as {
      id?: unknown;
      value?: unknown;
      doc?: unknown;
    };

    // Trường hợp object có id
    if (typeof obj.id === "string" || typeof obj.id === "number") {
      return obj.id;
    }

    // Trường hợp object có value
    if (typeof obj.value === "string" || typeof obj.value === "number") {
      return obj.value;
    }

    // Trường hợp value lại là object
    if (obj.value && typeof obj.value === "object") {
      return getRelationId(obj.value);
    }

    // Trường hợp Payload để document trong doc
    if (obj.doc) {
      return getRelationId(obj.doc);
    }
  }

  return undefined;
};

export const Omplassering: CollectionConfig = {
  slug: "omplassering",

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
        name: "breed",
        label: "Breed",
        type: "relationship",
        relationTo: "breeds" as any,
        required: false,

        /* filterOptions: ({ data, siblingData }) => {
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
        }, */
    },

    {
      name: "age",
      type: "number",
      required: true,
    },

    {
      name: "ageUnit",
      label: "Age Unit",
      type: "select",
      required: true,
      defaultValue: "years",
      options: [
        { label: "Months", value: "months" },
        { label: "Years", value: "years" },
      ],
    },

    {
      name: "gender",
      type: "select",
      required: true,
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },

    {
      name: "personality",
      type: "text",
      required: false,
    },

    {
      name: "description",
      type: "textarea",
      required: false,
    },

    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "available",
      options: [
        { label: "Available", value: "available" },
        { label: "Adopted", value: "adopted" },
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