"use client";

import { useEffect, useState } from "react";
import styles from "./tilbehor.module.css";

import {
  type CartItem,
  type CurrentUser,
  getUserId,
  addItemToCart,
} from "../lib/cartUtils";

import {
  type ProductImage,
  type RelationItem,
  type RelationValue,
  getImageUrl,
  getRelationId,
  getRelationName,
  getRelationIds,
  getRelationNames,
  formatLabel,
} from "../lib/productUtils";

type Tilbehor = {
  id: string;
  name: string;
  petType?: RelationValue;
  tilbehorType?: RelationItem | string | null;
  brand?: string;
  price: number;
  discountPercent?: number;
  salePrice?: number | null;
  material?: string;
  color?: string;
  description?: string;
  status?: string;
  image?: ProductImage | string | null;
};

function getUniqueRelations(
  items: Tilbehor[],
  key: "petType" | "tilbehorType"
) {
  const map = new Map<string, string>();

  items.forEach((item) => {
    const relation = item[key];

    if (Array.isArray(relation)) {
      relation.forEach((rel) => {
        const id = getRelationId(rel);
        const name = getRelationName(rel);

        if (id && name) {
          map.set(id, name);
        }
      });

      return;
    }

    const id = getRelationId(relation as RelationItem | string | null);
    const name = getRelationName(relation as RelationItem | string | null);

    if (id && name) {
      map.set(id, name);
    }
  });

  return Array.from(map, ([id, name]) => ({ id, name }));
}

function getFinalPrice(product: Tilbehor) {
  if (
    typeof product.salePrice === "number" &&
    product.salePrice > 0 &&
    product.salePrice < product.price
  ) {
    return product.salePrice;
  }

  return product.price;
}

function isOnSale(product: Tilbehor) {
  return (
    typeof product.salePrice === "number" &&
    product.salePrice > 0 &&
    product.salePrice < product.price
  );
}

export default function TilbehorPage() {
  const [tilbehor, setTilbehor] = useState<Tilbehor[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState("all");
  const [selectedAccessoryType, setSelectedAccessoryType] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Tilbehor | null>(null);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/customers/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    async function loadTilbehor() {
      try {
        const response = await fetch("/api/tilbehor?limit=100&depth=2", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError("Could not load tilbehor.");
          return;
        }

        setTilbehor(data.docs || []);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadTilbehor();
  }, []);

  const petTypeOptions = getUniqueRelations(tilbehor, "petType");

  const tilbehorForSelectedType =
    selectedType === "all"
      ? tilbehor
      : tilbehor.filter((product) =>
          getRelationIds(product.petType).includes(selectedType)
        );

  const accessoryTypeOptions = getUniqueRelations(
    tilbehorForSelectedType,
    "tilbehorType"
  );

  const filteredTilbehor = tilbehor.filter((product) => {
    const matchPetType =
      selectedType === "all" ||
      getRelationIds(product.petType).includes(selectedType);

    const matchAccessoryType =
      selectedAccessoryType === "all" ||
      getRelationId(product.tilbehorType) === selectedAccessoryType;

    return matchPetType && matchAccessoryType;
  });

  function handleSelectType(typeId: string) {
    setSelectedType(typeId);
    setSelectedAccessoryType("all");
  }

  function handleBackToAllAccessories() {
    setSelectedType("all");
    setSelectedAccessoryType("all");
  }

  function handleAddToCart(product: Tilbehor) {
    const currentUserId = getUserId(currentUser);

    const finalPrice = getFinalPrice(product);

    const cartItemId = `tilbehor-${product.id}`;

    const newItem: CartItem = {
      cartItemId,
      productId: product.id,
      name: product.name,
      image: getImageUrl(product.image),
      price: finalPrice,
      originalPrice: product.price,
      discountPercent: product.discountPercent,
      quantity: 1,
      productType: "tilbehor",
    };

    addItemToCart(currentUserId || undefined, newItem);
  }

  const selectedTypeName =
    selectedType === "all"
      ? ""
      : petTypeOptions.find((type) => type.id === selectedType)?.name || "";

  return (
    <main className={styles.tilbehorPage}>
      <section className={styles.header}>
        <p className={styles.smallTitle}>Tilbehør</p>

        <h1>Useful accessories for your pets</h1>

        <p>
          Find beds, toys, bowls, leashes and other accessories for your pets.
        </p>

        {selectedType === "all" ? (
          <div className={styles.filterBar}>
            <button
              type="button"
              onClick={handleBackToAllAccessories}
              className={`${styles.filterButton} ${styles.filterButtonActive}`}
            >
              All
            </button>

            {petTypeOptions.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleSelectType(type.id)}
                className={styles.filterButton}
              >
                {formatLabel(type.name)}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.categoryFilterBox}>
            <div className={styles.categoryFilterTop}>
              <button
                type="button"
                onClick={handleBackToAllAccessories}
                className={styles.backButton}
              >
                ← All accessories
              </button>
            </div>

            <div className={styles.filterBar}>
              <button
                type="button"
                onClick={() => setSelectedAccessoryType("all")}
                className={`${styles.filterButton} ${
                  selectedAccessoryType === "all"
                    ? styles.filterButtonActive
                    : ""
                }`}
              >
                All {formatLabel(selectedTypeName)}
              </button>

              {accessoryTypeOptions.map((accessoryType) => (
                <button
                  key={accessoryType.id}
                  type="button"
                  onClick={() => setSelectedAccessoryType(accessoryType.id)}
                  className={`${styles.filterButton} ${
                    selectedAccessoryType === accessoryType.id
                      ? styles.filterButtonActive
                      : ""
                  }`}
                >
                  {formatLabel(accessoryType.name)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {loading && <p className={styles.message}>Loading tilbehør...</p>}

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && filteredTilbehor.length === 0 && (
        <section className={styles.emptyBox}>
          <h2>No accessories found</h2>
          <p>Please add accessories from the Payload admin panel first.</p>
        </section>
      )}

      {!loading && !error && filteredTilbehor.length > 0 && (
        <section className={styles.productGrid}>
          {filteredTilbehor.map((product) => {
            const imageUrl = getImageUrl(product.image);
            const petTypeNames = getRelationNames(product.petType);
            const accessoryTypeName = getRelationName(product.tilbehorType);
            const finalPrice = getFinalPrice(product);
            const productOnSale = isOnSale(product);
            const isSoldOut = product.status === "sold-out";

            return (
              <article key={product.id} className={styles.productCard}>
                <div className={styles.productImageWrapper}>
                  {productOnSale &&
                    typeof product.discountPercent === "number" &&
                    product.discountPercent > 0 && (
                      <span className={styles.discountBadge}>
                        -{product.discountPercent}%
                      </span>
                    )}

                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={
                        typeof product.image === "object" && product.image?.alt
                          ? product.image.alt
                          : product.name
                      }
                      className={styles.productImage}
                    />
                  )}
                </div>

                <h2>{product.name}</h2>

                <p className={styles.productMeta}>
                  {petTypeNames.map(formatLabel).join(", ")}
                  {accessoryTypeName
                    ? ` • ${formatLabel(accessoryTypeName)}`
                    : ""}
                </p>

                <div className={styles.cardBottom}>
                  <div className={styles.priceBox}>
                    {productOnSale ? (
                      <>
                        <span className={styles.salePrice}>
                          {finalPrice} kr
                        </span>

                        <span className={styles.oldPrice}>
                          {product.price} kr
                        </span>
                      </>
                    ) : (
                      <span className={styles.price}>{product.price} kr</span>
                    )}
                  </div>

                  <div className={styles.cardButtons}>
                    <button
                      type="button"
                      className={styles.detailButton}
                      onClick={() => setSelectedProduct(product)}
                    >
                      Details
                    </button>

                    <button
                      type="button"
                      className={styles.cartButton}
                      disabled={isSoldOut}
                      onClick={() => handleAddToCart(product)}
                      aria-label="Add to cart"
                      title="Add to cart"
                    >
                      {isSoldOut ? "Sold out" : "🛒"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedProduct && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className={styles.detailModal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>

            {(() => {
              const imageUrl = getImageUrl(selectedProduct.image);
              const petTypeNames = getRelationNames(selectedProduct.petType);
              const accessoryTypeName = getRelationName(
                selectedProduct.tilbehorType
              );
              const finalPrice = getFinalPrice(selectedProduct);
              const productOnSale = isOnSale(selectedProduct);

              return (
                <>
                  <div className={styles.detailImageWrapper}>
                    {productOnSale &&
                      typeof selectedProduct.discountPercent === "number" &&
                      selectedProduct.discountPercent > 0 && (
                        <span className={styles.discountBadge}>
                          -{selectedProduct.discountPercent}%
                        </span>
                      )}

                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={selectedProduct.name}
                        className={styles.detailImage}
                      />
                    )}
                  </div>

                  <div className={styles.detailContent}>
                    <h2>{selectedProduct.name}</h2>

                    <div className={styles.detailPriceBox}>
                      {productOnSale ? (
                        <>
                          <span className={styles.detailSalePrice}>
                            {finalPrice} kr
                          </span>

                          <span className={styles.detailOldPrice}>
                            {selectedProduct.price} kr
                          </span>
                        </>
                      ) : (
                        <span className={styles.detailPrice}>
                          {selectedProduct.price} kr
                        </span>
                      )}
                    </div>

                    <div className={styles.detailGrid}>
                      <div>
                        <span>Pet type</span>
                        <strong>
                          {petTypeNames.length > 0
                            ? petTypeNames.map(formatLabel).join(", ")
                            : "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Accessory type</span>
                        <strong>
                          {accessoryTypeName
                            ? formatLabel(accessoryTypeName)
                            : "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Brand</span>
                        <strong>
                          {selectedProduct.brand || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Material</span>
                        <strong>
                          {selectedProduct.material || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Color</span>
                        <strong>
                          {selectedProduct.color || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>
                          {selectedProduct.status === "sold-out"
                            ? "Sold out"
                            : "Available"}
                        </strong>
                      </div>
                    </div>

                    {selectedProduct.description && (
                      <div className={styles.detailSection}>
                        <h3>Description</h3>
                        <p>{selectedProduct.description}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      className={styles.detailCartButton}
                      disabled={selectedProduct.status === "sold-out"}
                      onClick={() => handleAddToCart(selectedProduct)}
                    >
                      {selectedProduct.status === "sold-out"
                        ? "Sold out"
                        : "Add to cart"}
                    </button>
                  </div>
                </>
              );
            })()}
          </section>
        </div>
      )}
    </main>
  );
}