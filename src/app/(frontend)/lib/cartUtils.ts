export type CurrentUser = {
  id?: string | number;
  _id?: string | number;
  email?: string;
};

export type CartItem = {
  cartItemId: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  productType: "dyremat" | "tilbehor";
  weightValue?: number;
  weightUnit?: "kg" | "g";
};

const GUEST_CART_KEY = "petmate-guest-cart";

export function getUserId(user: CurrentUser | null) {
  if (!user) return "";

  if (user.id) return String(user.id);

  if (user._id) return String(user._id);

  return "";
}

function getCartKey(userId?: string) {
  if (userId) {
    return `petmate-cart-${userId}`;
  }

  return GUEST_CART_KEY;
}

function getCartStorage(userId?: string) {
  if (typeof window === "undefined") return null;

  if (userId) {
    return window.localStorage;
  }

  return window.sessionStorage;
}

export function readCart(userId?: string) {
  const storage = getCartStorage(userId);

  if (!storage) return [];

  const cartKey = getCartKey(userId);

  try {
    const savedCart = storage.getItem(cartKey);

    if (!savedCart) return [];

    return JSON.parse(savedCart) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(userId: string | undefined, cart: CartItem[]) {
  const storage = getCartStorage(userId);

  if (!storage) return;

  const cartKey = getCartKey(userId);

  storage.setItem(cartKey, JSON.stringify(cart));

  window.dispatchEvent(new Event("petmate-cart-updated"));
}

export function clearCart(userId?: string) {
  const storage = getCartStorage(userId);

  if (!storage) return;

  const cartKey = getCartKey(userId);

  storage.removeItem(cartKey);
}

export function getCartQuantity(cart: CartItem[]) {
  return cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

export function getCartTotal(cart: CartItem[]) {
  return cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

export function formatPrice(price: number) {
  return Number(price.toFixed(2)).toString();
}

export function addItemToCart(userId: string | undefined, newItem: CartItem) {
  const currentCart = readCart(userId);

  const existingItem = currentCart.find((item) => {
    return item.cartItemId === newItem.cartItemId;
  });

  let updatedCart: CartItem[];

  if (existingItem) {
    updatedCart = currentCart.map((item) => {
      if (item.cartItemId === newItem.cartItemId) {
        return {
          ...item,
          quantity: item.quantity + newItem.quantity,
        };
      }

      return item;
    });
  } else {
    updatedCart = [...currentCart, newItem];
  }

  saveCart(userId, updatedCart);

  return updatedCart;
}