"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./cart.module.css";

import CartItemCard from "../components/cart/CartItemCard";
import CartSummary from "../components/cart/CartSummary";

import {
  type CartItem,
  type CurrentUser,
  getUserId,
  getCartQuantity,
  getCartTotal,
  readCart,
  saveCart as saveCartToStorage,
} from "../lib/cartUtils";

export default function CartPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/customers/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setCurrentUser(data.user);

          const userId = getUserId(data.user);
          const savedCart = readCart(userId);

          setCart(savedCart);
        } else {
          setCurrentUser(null);

          const guestCart = readCart();

          setCart(guestCart);
        }
      } catch {
        setCurrentUser(null);

        const guestCart = readCart();

        setCart(guestCart);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  function updateCart(updatedCart: CartItem[]) {
    const userId = getUserId(currentUser);

    saveCartToStorage(userId || undefined, updatedCart);
    setCart(updatedCart);
  }

  function increaseQuantity(cartItemId: string) {
    const updatedCart = cart.map((item) => {
      if (item.cartItemId === cartItemId) {
        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }

      return item;
    });

    updateCart(updatedCart);
  }

  function decreaseQuantity(cartItemId: string) {
    const updatedCart = cart
      .map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }

        return item;
      })
      .filter((item) => item.quantity > 0);

    updateCart(updatedCart);
  }

  function removeItem(cartItemId: string) {
    const updatedCart = cart.filter((item) => {
      return item.cartItemId !== cartItemId;
    });

    updateCart(updatedCart);
  }

  function clearCart() {
    updateCart([]);
  }

  const totalPrice = getCartTotal(cart);
  const totalQuantity = getCartQuantity(cart);

  if (loading) {
    return (
      <main className={styles.cartPage}>
        <p className={styles.message}>Loading cart...</p>
      </main>
    );
  }

  return (
    <main className={styles.cartPage}>
      <section className={styles.header}>
        <p className={styles.smallTitle}>Cart</p>

        <h1>Your shopping cart</h1>

        <p>
          Here you can see the products you have added to your cart before
          checkout.
        </p>
      </section>

      {cart.length === 0 ? (
        <section className={styles.emptyBox}>
          <h2>Your cart is empty</h2>

          <p>Add pet food or accessories to your cart first.</p>

          <div className={styles.emptyActions}>
            <Link href="/dyremat" className={styles.primaryButton}>
              Go to Dyremat
            </Link>

            <Link href="/tilbehor" className={styles.secondaryButton}>
              Go to Tilbehør
            </Link>
          </div>
        </section>
      ) : (
        <section className={styles.cartLayout}>
          <div className={styles.cartList}>
            {cart.map((item) => (
              <CartItemCard
                key={item.cartItemId}
                item={item}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className={styles.summaryArea}>
            <CartSummary
              totalQuantity={totalQuantity}
              totalPrice={totalPrice}
              onClearCart={clearCart}
            />
          </div>
        </section>
      )}
    </main>
  );
}