"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./orders.module.css";

type CurrentUser = {
  id?: string | number;
  _id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type OrderItem = {
  id?: string | number;
  productName?: string;
  name?: string;
  productType?: "dyremat" | "tilbehor" | string;
  productId?: string;
  imageUrl?: string;
  image?: string;
  quantity?: number;
  price?: number;
  originalPrice?: number;
  lineTotal?: number;
  weightValue?: string | number;
  weightUnit?: string;
};

type DeliveryAddress = {
  fullName?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
};

type Order = {
  id: string | number;
  orderNumber?: string;
  customerEmail?: string;
  customerName?: string;
  status?: string;
  paymentStatus?: string;
  items?: OrderItem[];
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total?: number;
  totalPrice?: number;
  currency?: string;
  deliveryAddress?: DeliveryAddress;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

function getUserId(user: CurrentUser | null) {
  if (!user) return "";

  return String(user.id || user._id || "");
}

function getFullName(user: CurrentUser | null) {
  if (!user) return "PetMate user";

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return fullName || user.email || "PetMate user";
}

function formatOrderPrice(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value || 0);

  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

function getOrderNumber(order: Order, index: number) {
  if (order.orderNumber) return order.orderNumber;

  const fallbackId = String(order.id || "").slice(-6).toUpperCase();

  if (fallbackId) return `PM-${fallbackId}`;

  return `PM-${String(index + 1).padStart(4, "0")}`;
}

function getOrderDate(order: Order) {
  if (!order.createdAt) return "-";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(order.createdAt));
}

function getOrderItems(order: Order) {
  return order.items || [];
}

function getOrderTotal(order: Order) {
  if (typeof order.total === "number") return order.total;
  if (typeof order.totalPrice === "number") return order.totalPrice;

  return 0;
}

function getOrderTotalQuantity(order: Order) {
  return getOrderItems(order).reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);
}

function getStatusLabel(status?: string) {
  if (status === "new") return "Ny";
  if (status === "processing") return "Under behandling";
  if (status === "shipped") return "Sendt";
  if (status === "delivered") return "Levert";
  if (status === "cancelled") return "Kansellert";

  return status || "-";
}

function getPaymentStatusLabel(status?: string) {
  if (status === "pending") return "Venter";
  if (status === "paid") return "Betalt";
  if (status === "failed") return "Feilet";
  if (status === "refunded") return "Refundert";

  return status || "-";
}

function getItemName(item: OrderItem) {
  return item.productName || item.name || "Produkt";
}

function getItemImage(item: OrderItem) {
  return item.imageUrl || item.image || "";
}

function getItemLineTotal(item: OrderItem) {
  if (typeof item.lineTotal === "number") return item.lineTotal;

  return Number(item.price || 0) * Number(item.quantity || 0);
}

export default function OrdersPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const userResponse = await fetch("/api/customers/me", {
          credentials: "include",
        });

        const userData = await userResponse.json();

        if (!userResponse.ok || !userData.user) {
          setUser(null);
          setOrders([]);
          return;
        }

        const currentUser = userData.user as CurrentUser;

        setUser(currentUser);

        const ordersResponse = await fetch(
          "/api/orders?sort=-createdAt&depth=1&limit=100",
          {
            credentials: "include",
          }
        );

        const ordersData = await ordersResponse.json();

        if (!ordersResponse.ok) {
          setError("Kunne ikke laste bestillingene dine.");
          setOrders([]);
          return;
        }

        setOrders((ordersData.docs || []) as Order[]);
      } catch {
        setError("Kunne ikke laste bestillingene dine.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  function openOrderDetails(order: Order, orderNumber: string) {
    setSelectedOrder(order);
    setSelectedOrderNumber(orderNumber);
  }

  function closeOrderDetails() {
    setSelectedOrder(null);
    setSelectedOrderNumber("");
  }

  if (loading) {
    return (
      <main className={styles.ordersPage}>
        <p className={styles.message}>Laster bestillinger...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.ordersPage}>
        <section className={styles.emptyCard}>
          <h1>Mine bestillinger</h1>

          <p>Du må logge inn for å se dine bestillinger.</p>

          <Link href="/login" className={styles.primaryButton}>
            Logg inn
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.ordersPage}>
      <div className={styles.ordersShell}>
        <aside className={styles.sidebar}>
          <div className={styles.userBox}>
            <div className={styles.avatarCircle}>
              {getFullName(user).charAt(0).toUpperCase()}
            </div>

            <div>
              <h2>{getFullName(user)}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <nav className={styles.sideMenu}>
            <Link href="/profile" className={styles.sideMenuItem}>
              Min side
            </Link>

            <Link
              href="/profile#kontoinformasjon"
              className={styles.sideMenuItem}
            >
              Kontoinformasjon
            </Link>

            <Link
              href="/profile/orders"
              className={`${styles.sideMenuItem} ${styles.active}`}
            >
              Mine bestillinger
            </Link>

            <Link href="/profile#kjaeledyr" className={styles.sideMenuItem}>
              Kjæledyr
            </Link>

            <Link href="/profile#tilbud" className={styles.sideMenuItem}>
              Personlige tilbud
            </Link>

            <Link href="/profile#familie" className={styles.sideMenuItem}>
              Familiemedlemmer
            </Link>
          </nav>
        </aside>

        <section className={styles.content}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Kjøpshistorikk</p>

            <h1>Mine ordre</h1>

            <p>
              Her finner du en oversikt over tidligere bestillinger hos PetMate.
            </p>
          </section>

          {error && <p className={styles.error}>{error}</p>}

          {orders.length === 0 ? (
            <section className={styles.emptyCard}>
              <h2>Ingen bestillinger ennå</h2>

              <p>
                Når du fullfører et kjøp, vil ordren vises her med eget
                ordrenummer.
              </p>

              <Link href="/dyremat" className={styles.primaryButton}>
                Start å handle
              </Link>
            </section>
          ) : (
            <section className={styles.ordersTableCard}>
              <div className={styles.tableHeader}>
                <span>Ordrenummer</span>
                <span>Beløp</span>
                <span>Status</span>
                <span>Dato</span>
                <span></span>
              </div>

              <div className={styles.tableBody}>
                {orders.map((order, index) => {
                  const orderNumber = getOrderNumber(order, index);

                  return (
                    <div key={order.id} className={styles.tableRow}>
                      <button
                        type="button"
                        className={styles.orderNumberButton}
                        onClick={() => openOrderDetails(order, orderNumber)}
                      >
                        {orderNumber}
                      </button>

                      <span>{formatOrderPrice(getOrderTotal(order))} kr</span>

                      <span>
                        <span className={styles.statusBadge}>
                          {getStatusLabel(order.status)}
                        </span>
                      </span>

                      <span>{getOrderDate(order)}</span>

                      <button
                        type="button"
                        className={styles.infoButton}
                        onClick={() => openOrderDetails(order, orderNumber)}
                        aria-label={`Se detaljer for ordre ${orderNumber}`}
                      >
                        i
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      </div>

      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={closeOrderDetails}>
          <section
            className={styles.orderModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p>Ordredetaljer</p>
                <h2>Ordre {selectedOrderNumber}</h2>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeOrderDetails}
                aria-label="Lukk ordredetaljer"
              >
                ×
              </button>
            </div>

            <div className={styles.detailGrid}>
              <div>
                <span>Ordrestatus</span>
                <strong>{getStatusLabel(selectedOrder.status)}</strong>
              </div>

              <div>
                <span>Betaling</span>
                <strong>
                  {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                </strong>
              </div>

              <div>
                <span>Dato</span>
                <strong>{getOrderDate(selectedOrder)}</strong>
              </div>

              <div>
                <span>Antall varer</span>
                <strong>{getOrderTotalQuantity(selectedOrder)}</strong>
              </div>

              <div>
                <span>Frakt</span>
                <strong>
                  {formatOrderPrice(selectedOrder.shipping || 0)} kr
                </strong>
              </div>

              <div>
                <span>Total</span>
                <strong>
                  {formatOrderPrice(getOrderTotal(selectedOrder))} kr
                </strong>
              </div>
            </div>

            {selectedOrder.deliveryAddress && (
              <div className={styles.detailGrid}>
                <div>
                  <span>Navn</span>
                  <strong>{selectedOrder.deliveryAddress.fullName || "-"}</strong>
                </div>

                <div>
                  <span>Telefon</span>
                  <strong>{selectedOrder.deliveryAddress.phone || "-"}</strong>
                </div>

                <div>
                  <span>Adresse</span>
                  <strong>{selectedOrder.deliveryAddress.address || "-"}</strong>
                </div>

                <div>
                  <span>Poststed</span>
                  <strong>
                    {selectedOrder.deliveryAddress.postalCode || ""}{" "}
                    {selectedOrder.deliveryAddress.city || ""}
                  </strong>
                </div>
              </div>
            )}

            <div className={styles.itemsList}>
              {getOrderItems(selectedOrder).map((item, index) => (
                <div
                  key={`${item.productId || item.id || index}`}
                  className={styles.orderItem}
                >
                  <div className={styles.itemInfo}>
                    {getItemImage(item) ? (
                      <img
                        src={getItemImage(item)}
                        alt={getItemName(item)}
                        className={styles.itemImage}
                      />
                    ) : (
                      <div className={styles.itemImageFallback}>🐾</div>
                    )}

                    <div>
                      <strong>{getItemName(item)}</strong>

                      {item.weightValue && item.weightUnit && (
                        <span>
                          {item.weightValue}
                          {item.weightUnit}
                        </span>
                      )}
                    </div>
                  </div>

                  <p>
                    {item.quantity || 0} × {formatOrderPrice(item.price || 0)}{" "}
                    kr
                  </p>

                  <p>{formatOrderPrice(getItemLineTotal(item))} kr</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}