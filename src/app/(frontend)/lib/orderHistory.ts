export type OrderItem = {
  cartItemId?: string;
  productId?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  discountPercent?: number;
  productType?: "dyremat" | "tilbehor";
  weightValue?: number;
  weightUnit?: "kg" | "g";
};

export type Order = {
  orderNumber?: string;
  createdAt: string;
  status: string;
  totalPrice: number;
  items: OrderItem[];
};

function getOrdersKey(userId: string) {
  return `petmate-orders-${userId}`;
}

export function readOrders(userId: string): Order[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(getOrdersKey(userId));
    const parsed = JSON.parse(saved || "[]");

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

export function saveOrders(userId: string, orders: Order[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(getOrdersKey(userId), JSON.stringify(orders));
}

export function createShortOrderNumber() {
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.random().toString(36).slice(2, 4).toUpperCase();

  return `PM${timePart}${randomPart}`;
}

export function getOrderNumber(order: Order, index: number) {
  if (order.orderNumber && order.orderNumber.trim()) {
    return order.orderNumber;
  }

  const createdPart = order.createdAt
    ? new Date(order.createdAt).getTime().toString().slice(-6)
    : String(index + 1).padStart(6, "0");

  const fallbackPart = String(index + 1).padStart(2, "0");

  return `PM${createdPart}${fallbackPart}`;
}

export function getOrderDate(order: Order) {
  if (!order.createdAt) return "Ukjent dato";

  return new Date(order.createdAt).toLocaleString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOrderTotalQuantity(order: Order) {
  if (!Array.isArray(order.items)) return 0;

  return order.items.reduce((total, item) => {
    return total + (item.quantity || 0);
  }, 0);
}

export function formatOrderPrice(value: number) {
  return value.toFixed(2).replace(".", ",");
}