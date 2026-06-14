import type { CollectionConfig } from "payload";

const isAdmin = (user: any) => {
  if (!user) return false;

  // Admin mặc định của Payload, thường là collection "users"
  if (user.collection === "users") return true;

  // Customer nhưng có role admin
  if (user.role === "admin") return true;

  return false;
};

export const Customers: CollectionConfig = {
  slug: "customers",

  auth: true,

  admin: {
    useAsTitle: "email",
    defaultColumns: ["firstName", "lastName", "email", "role"],
  },

  access: {
    // Cho phép người chưa đăng nhập tạo tài khoản
    create: () => true,

    // Admin xem được tất cả customers
    // Customer thường chỉ xem được chính mình
    read: ({ req: { user } }) => {
      if (!user) return false;

      if (isAdmin(user)) return true;

      return {
        id: {
          equals: user.id,
        },
      };
    },

    // Admin sửa được tất cả
    // Customer thường chỉ sửa được chính mình
    update: ({ req: { user } }) => {
      if (!user) return false;

      if (isAdmin(user)) return true;

      return {
        id: {
          equals: user.id,
        },
      };
    },

    // Chỉ admin mới được xóa customer
    delete: ({ req: { user } }) => {
      return isAdmin(user);
    },
  },

  fields: [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      required: true,
    },

    {
      name: "lastName",
      label: "Last Name",
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
      name: "address",
      label: "Address",
      type: "text",
      required: false,
    },

    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: false,
      options: [
        {
          label: "Female",
          value: "female",
        },
        {
          label: "Male",
          value: "male",
        },
        {
          label: "Other",
          value: "other",
        },
      ],
    },

    {
      name: "avatar",
      label: "Avatar",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Profile image for the customer.",
      },
    },

    // Không cần tự thêm email ở đây nếu auth: true
    // Payload tự quản lý email + password cho auth collection

    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      defaultValue: "customer",
      options: [
        {
          label: "Customer",
          value: "customer",
        },
        {
          label: "Admin",
          value: "admin",
        },
      ],
    },
  ],
};