"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./checkout.module.css";

import {
  type CartItem,
  type CurrentUser,
  getUserId,
  getCartQuantity,
  getCartTotal,
  formatPrice,
  readCart,
  saveCart as saveCartToStorage,
} from "../lib/cartUtils";

type CheckoutUser = CurrentUser & {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
};

type StoreOption = {
  id: string | number;
  name: string;
  address: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  openingHours?: string;
  distanceText?: string;
  status?: string;
};

type DeliveryCompany = {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  deliveryTime?: string;
  status?: string;
};

function formatSize(item: CartItem) {
  if (!item.weightValue || !item.weightUnit) return "";

  return `${item.weightValue} ${item.weightUnit}`;
}

function roundPrice(value: number) {
  return Math.round(value * 100) / 100;
}

export default function CheckoutPage() {
  const [currentUser, setCurrentUser] = useState<CheckoutUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [stores, setStores] = useState<StoreOption[]>([]);
  const [deliveryCompanies, setDeliveryCompanies] = useState<
    DeliveryCompany[]
  >([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const [deliveryMethod, setDeliveryMethod] = useState("home");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedShippingId, setSelectedShippingId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("card");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [error, setError] = useState("");
  const [orderPaid, setOrderPaid] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    async function loadCheckoutData() {
      try {
        const response = await fetch("/api/customers/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          const user = data.user as CheckoutUser;

          setCurrentUser(user);

          const userId = getUserId(user);
          const savedCart = readCart(userId);

          setCart(savedCart);

          const defaultName = `${user.firstName || ""} ${
            user.lastName || ""
          }`.trim();

          setFullName(defaultName);
          setEmail(user.email || "");
          setPhone(user.phone || "");
          setAddress(user.address || "");
        } else {
          setCurrentUser(null);

          const guestCart = readCart();

          setCart(guestCart);
        }

        const storesResponse = await fetch("/api/stores?limit=100&depth=0", {
          credentials: "include",
        });

        const storesData = await storesResponse.json();

        if (storesResponse.ok) {
          const activeStores = (storesData.docs || []).filter(
            (store: StoreOption) => store.status === "active"
          );

          setStores(activeStores);
        }

        const deliveryResponse = await fetch(
          "/api/delivery-companies?limit=100&depth=0",
          {
            credentials: "include",
          }
        );

        const deliveryData = await deliveryResponse.json();

        if (deliveryResponse.ok) {
          const activeCompanies = (deliveryData.docs || []).filter(
            (company: DeliveryCompany) => company.status === "active"
          );

          setDeliveryCompanies(activeCompanies);

          if (activeCompanies.length > 0) {
            setSelectedShippingId(String(activeCompanies[0].id));
          }
        }
      } catch {
        setCurrentUser(null);

        const guestCart = readCart();

        setCart(guestCart);
        setStores([]);
        setDeliveryCompanies([]);
      } finally {
        setLoading(false);
      }
    }

    loadCheckoutData();
  }, []);

  const totalQuantity = getCartQuantity(cart);
  const productsTotal = getCartTotal(cart);

  const selectedStore = stores.find((store) => {
    return String(store.id) === selectedStoreId;
  });

  const selectedShipping = deliveryCompanies.find((company) => {
    return String(company.id) === selectedShippingId;
  });

  const deliveryPrice =
    deliveryMethod === "home" && selectedShipping ? selectedShipping.price : 0;

  const taxRatePercent = 25;
  const vatMultiplier = 1 + taxRatePercent / 100;

  const productsBeforeVat =
    productsTotal > 0 ? roundPrice(productsTotal / vatMultiplier) : 0;

  const productVatAmount = roundPrice(productsTotal - productsBeforeVat);

  const deliveryBeforeVat =
    deliveryPrice > 0 ? roundPrice(deliveryPrice / vatMultiplier) : 0;

  const deliveryVatAmount = roundPrice(deliveryPrice - deliveryBeforeVat);

  const totalBeforeVat = roundPrice(productsBeforeVat + deliveryBeforeVat);

  const totalVatAmount = roundPrice(productVatAmount + deliveryVatAmount);

  const totalPrice = roundPrice(productsTotal + deliveryPrice);

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const userId = getUserId(currentUser);

    const customerId =
      userId && !Number.isNaN(Number(userId)) ? Number(userId) : userId;

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!fullName || !email || !phone || !address || !postalCode || !city) {
      setError("Please fill in all required fields.");
      return;
    }

    if (deliveryMethod === "pickup" && !selectedStoreId) {
      setError("Please choose a store for pickup.");
      return;
    }

    if (deliveryMethod === "home" && !selectedShippingId) {
      setError("Please choose a delivery company.");
      return;
    }

    if (paymentMethod === "card") {
      if (!cardName || !cardNumber || !cardExpiry || !cardCvc) {
        setError("Please fill in your card information.");
        return;
      }
    }

    setPlacingOrder(true);

    try {
      const orderItems = cart.map((item) => {
        const originalPrice =
          typeof item.originalPrice === "number"
            ? item.originalPrice
            : item.price;

        return {
          productName: item.name,
          productType: item.productType,
          productId: String(item.productId),
          imageUrl: item.image || "",
          quantity: item.quantity,
          price: item.price,
          originalPrice,
          lineTotal: roundPrice(item.price * item.quantity),
        };
      });

      const orderData = {
        ...(customerId ? { customer: customerId } : {}),

        customerEmail: email,
        customerName: fullName,

        status: "new",
        paymentStatus: paymentMethod === "card" ? "paid" : "pending",

        items: orderItems,

        subtotal: productsTotal,
        shipping: deliveryPrice,
        discount: 0,
        total: totalPrice,
        currency: "NOK",

        deliveryAddress: {
          fullName,
          phone,
          address,
          postalCode,
          city,
        },

        note: [
          userId ? "Customer type: logged in user" : "Customer type: guest",
          `Delivery method: ${deliveryMethod}`,
          selectedStore ? `Pickup store: ${selectedStore.name}` : "",
          selectedShipping ? `Delivery company: ${selectedShipping.name}` : "",
          `Payment method: ${paymentMethod}`,
          `Products before VAT: ${productsBeforeVat}`,
          `Product VAT: ${productVatAmount}`,
          `Delivery before VAT: ${deliveryBeforeVat}`,
          `Delivery VAT: ${deliveryVatAmount}`,
          `Total before VAT: ${totalBeforeVat}`,
          `Total VAT: ${totalVatAmount}`,
          `Tax rate: ${taxRatePercent}%`,
        ]
          .filter(Boolean)
          .join("\n"),

        createdFrom: "website",
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setError(data.message || "Could not create order.");
        return;
      }

      saveCartToStorage(userId || undefined, []);
      setCart([]);
      setOrderPaid(true);
    } catch {
      setError("Something went wrong while creating the order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.checkoutPage}>
        <p className={styles.message}>Loading checkout...</p>
      </main>
    );
  }

  if (orderPaid) {
    return (
      <main className={`${styles.checkoutPage} ${styles.successPage}`}>
        <section className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>

          <h1>
            {paymentMethod === "card"
              ? "Your order has been paid"
              : "Your order has been placed"}
          </h1>

          <p>
            Thank you for shopping with PetMate. Your order has been saved in
            our system. Admin can now see this order in Payload. The receipt,
            including VAT details, will be sent to <strong>{email}</strong>.
          </p>

          <div className={styles.successActions}>
            <Link href="/dyremat" className={styles.primaryButton}>
              Continue shopping
            </Link>

            {currentUser ? (
              <Link href="/profile/orders" className={styles.secondaryButton}>
                View order history
              </Link>
            ) : (
              <Link href="/" className={styles.secondaryButton}>
                Back to home
              </Link>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className={styles.checkoutPage}>
        <section className={styles.emptyBox}>
          <h1>Your cart is empty</h1>

          <p>Add products to your cart before checkout.</p>

          <div className={styles.emptyActions}>
            <Link href="/dyremat" className={styles.primaryButton}>
              Go to Dyremat
            </Link>

            <Link href="/tilbehor" className={styles.secondaryButton}>
              Go to Tilbehør
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.checkoutPage}>
      <section className={styles.header}>
        <p className={styles.smallTitle}>Checkout</p>

        <h1>Complete your order</h1>

        <p>
          Fill in your delivery and payment information before paying for your
          order.
        </p>
      </section>

      <section className={styles.checkoutLayout}>
        <form className={styles.formCard} onSubmit={handlePlaceOrder}>
          <h2>Customer information</h2>

          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label>Full name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Your phone number"
              />
            </div>
          </div>

          <h2>Delivery information</h2>

          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroupFull}>
              <label>Address *</label>
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Postal code *</label>
              <input
                type="text"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                placeholder="Postal code"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>City *</label>
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
              />
            </div>
          </div>

          <h2>Delivery method</h2>

          <div className={styles.radioGrid}>
            <label className={styles.radioCard}>
              <input
                type="radio"
                name="delivery"
                value="pickup"
                checked={deliveryMethod === "pickup"}
                onChange={(event) => setDeliveryMethod(event.target.value)}
              />

              <span>
                <strong>Pick up in store</strong>
                <small>Choose a PetMate store near you</small>
              </span>
            </label>

            <label className={styles.radioCard}>
              <input
                type="radio"
                name="delivery"
                value="home"
                checked={deliveryMethod === "home"}
                onChange={(event) => setDeliveryMethod(event.target.value)}
              />

              <span>
                <strong>Home delivery</strong>
                <small>Choose a delivery company</small>
              </span>
            </label>
          </div>

          {deliveryMethod === "pickup" && (
            <div className={styles.optionSection}>
              <h3>Choose pickup store near you</h3>

              {stores.length === 0 ? (
                <p className={styles.optionEmpty}>
                  No pickup stores are available right now.
                </p>
              ) : (
                <div className={styles.optionList}>
                  {stores.map((store) => (
                    <label key={store.id} className={styles.optionCard}>
                      <input
                        type="radio"
                        name="store"
                        value={String(store.id)}
                        checked={selectedStoreId === String(store.id)}
                        onChange={(event) =>
                          setSelectedStoreId(event.target.value)
                        }
                      />

                      <span>
                        <strong>{store.name}</strong>

                        <small>
                          {store.address}
                          {store.postalCode || store.city
                            ? `, ${store.postalCode || ""} ${
                                store.city || ""
                              }`
                            : ""}
                        </small>

                        {store.distanceText && (
                          <small>{store.distanceText}</small>
                        )}

                        {store.openingHours && (
                          <small>{store.openingHours}</small>
                        )}

                        {store.phone && <small>Phone: {store.phone}</small>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {deliveryMethod === "home" && (
            <div className={styles.optionSection}>
              <h3>Choose delivery company</h3>

              {deliveryCompanies.length === 0 ? (
                <p className={styles.optionEmpty}>
                  No delivery companies are available right now.
                </p>
              ) : (
                <div className={styles.optionList}>
                  {deliveryCompanies.map((company) => (
                    <label key={company.id} className={styles.optionCard}>
                      <input
                        type="radio"
                        name="shipping"
                        value={String(company.id)}
                        checked={selectedShippingId === String(company.id)}
                        onChange={(event) =>
                          setSelectedShippingId(event.target.value)
                        }
                      />

                      <span>
                        <strong>
                          {company.name} - {formatPrice(company.price)} kr
                        </strong>

                        {company.description && (
                          <small>{company.description}</small>
                        )}

                        {company.deliveryTime && (
                          <small>{company.deliveryTime}</small>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <h2>Payment method</h2>

          <div className={styles.radioGrid}>
            <label className={styles.radioCard}>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />

              <span>
                <strong>Card payment</strong>
                <small>Demo card payment in this version</small>
              </span>
            </label>

            <label className={styles.radioCard}>
              <input
                type="radio"
                name="payment"
                value="invoice"
                checked={paymentMethod === "invoice"}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />

              <span>
                <strong>Invoice</strong>
                <small>Pay after order confirmation</small>
              </span>
            </label>
          </div>

          {paymentMethod === "card" && (
            <div className={styles.cardForm}>
              <div className={styles.fieldGroupFull}>
                <label>Name on card *</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="Name on card"
                />
              </div>

              <div className={styles.fieldGroupFull}>
                <label>Card number *</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.fieldGroup}>
                  <label>Expiry date *</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(event.target.value)}
                    placeholder="MM/YY"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>CVC *</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(event) => setCardCvc(event.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          )}

          <p className={styles.paymentNote}>
            The total amount includes 25% VAT. Your receipt and order details
            will be sent to <strong>{email || "your email"}</strong>.
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.placeOrderButton}
            disabled={placingOrder}
          >
            {placingOrder
              ? "Creating order..."
              : paymentMethod === "card"
                ? `Pay ${formatPrice(totalPrice)} kr`
                : `Place order ${formatPrice(totalPrice)} kr`}
          </button>
        </form>

        <aside className={styles.summaryBox}>
          <h2>Order summary</h2>

          <div className={styles.summaryItems}>
            {cart.map((item) => {
              const sizeText = formatSize(item);

              const originalPrice =
                typeof item.originalPrice === "number"
                  ? item.originalPrice
                  : undefined;

              const isOnSale =
                typeof originalPrice === "number" &&
                originalPrice > item.price;

              return (
                <article key={item.cartItemId} className={styles.summaryItem}>
                  <div className={styles.summaryImageWrapper}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={styles.summaryImage}
                      />
                    )}
                  </div>

                  <div className={styles.summaryItemInfo}>
                    <h3>{item.name}</h3>

                    <p>
                      {item.productType === "dyremat" ? "Dyremat" : "Tilbehør"}
                      {sizeText ? ` • ${sizeText}` : ""}
                    </p>

                    <p>Quantity: {item.quantity}</p>

                    <div className={styles.priceBox}>
                      <span
                        className={isOnSale ? styles.salePrice : styles.price}
                      >
                        {formatPrice(item.price)} kr
                      </span>

                      {isOnSale && typeof originalPrice === "number" && (
                        <span className={styles.oldPrice}>
                          {formatPrice(originalPrice)} kr
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.summaryRow}>
            <span>Items</span>
            <strong>{totalQuantity}</strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Products</span>
            <strong>{formatPrice(productsTotal)} kr</strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Delivery</span>
            <strong>{formatPrice(deliveryPrice)} kr</strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Included VAT 25%</span>
            <strong>{formatPrice(totalVatAmount)} kr</strong>
          </div>

          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total to pay</span>
            <strong>{formatPrice(totalPrice)} kr</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}