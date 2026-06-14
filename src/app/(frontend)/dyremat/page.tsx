"use client";

import { useEffect, useState } from "react";
import styles from "./dyremat.module.css";

import {
  type CartItem,
  type CurrentUser,
  getUserId,
  addItemToCart,
} from "../lib/cartUtils";

import {
  type ProductImage,
  type RelationItem,
  getImageUrl,
  getRelationId,
  getRelationName,
  formatLabel,
} from "../lib/productUtils";

type FeedingGuideRow = {
  id?: string;
  weightFrom?: number;
  weightTo?: number;
  amount?: string;
};

type FoodSize = {
  id?: string;
  weightValue?: number;
  weightUnit?: "kg" | "g";
  price?: number;
  discountPercent?: number;
  salePrice?: number | null;
};

type Dyremat = {
  id: string;
  name: string;
  petType?: RelationItem | string | null;
  matType?: RelationItem | string | null;
  brand?: string;

  price?: number;
  weightValue?: number;
  weightUnit?: "kg" | "g";

  sizes?: FoodSize[];

  countryOfOrigin?: string;
  ingredients?: string;
  description?: string;
  feedingGuide?: FeedingGuideRow[];
  status?: string;
  image?: ProductImage | string | null;
};

function getUniqueRelations(items: Dyremat[], key: "petType" | "matType") {
  const map = new Map<string, string>();

  items.forEach((item) => {
    const relation = item[key];

    const id = getRelationId(relation);
    const name = getRelationName(relation);

    if (id && name) {
      map.set(id, name);
    }
  });

  return Array.from(map, ([id, name]) => ({ id, name }));
}

function formatSize(size?: FoodSize) {
  if (!size?.weightValue || !size?.weightUnit) {
    return "";
  }

  return `${size.weightValue} ${size.weightUnit}`;
}

function getSizes(food: Dyremat) {
  if (food.sizes && food.sizes.length > 0) {
    return food.sizes;
  }

  if (food.weightValue && food.weightUnit && food.price) {
    return [
      {
        weightValue: food.weightValue,
        weightUnit: food.weightUnit,
        price: food.price,
      },
    ];
  }

  return [];
}

function getFinalPrice(size?: FoodSize) {
  if (!size) return undefined;

  if (
    typeof size.salePrice === "number" &&
    typeof size.price === "number" &&
    size.salePrice > 0 &&
    size.salePrice < size.price
  ) {
    return size.salePrice;
  }

  return size.price;
}

function isSizeOnSale(size?: FoodSize) {
  if (!size) return false;

  return (
    typeof size.salePrice === "number" &&
    typeof size.price === "number" &&
    size.salePrice > 0 &&
    size.salePrice < size.price
  );
}

export default function DyrematPage() {
  const [dyremat, setDyremat] = useState<Dyremat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState("all");
  const [selectedMatType, setSelectedMatType] = useState("all");
  const [selectedFood, setSelectedFood] = useState<Dyremat | null>(null);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedCardSizes, setSelectedCardSizes] = useState<
    Record<string, number>
  >({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

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
    async function loadDyremat() {
      try {
        const response = await fetch("/api/dyremat?limit=100&depth=2", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError("Could not load dyremat.");
          return;
        }

        setDyremat(data.docs || []);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDyremat();
  }, []);

  const petTypeOptions = getUniqueRelations(dyremat, "petType");

  const dyrematForSelectedType =
    selectedType === "all"
      ? dyremat
      : dyremat.filter((food) => getRelationId(food.petType) === selectedType);

  const matTypeOptions = getUniqueRelations(dyrematForSelectedType, "matType");

  const filteredDyremat = dyremat.filter((food) => {
    const matchType =
      selectedType === "all" || getRelationId(food.petType) === selectedType;

    const matchMatType =
      selectedMatType === "all" ||
      getRelationId(food.matType) === selectedMatType;

    return matchType && matchMatType;
  });

  function handleSelectType(typeId: string) {
    setSelectedType(typeId);
    setSelectedMatType("all");
  }

  function handleBackToAllFood() {
    setSelectedType("all");
    setSelectedMatType("all");
  }

  function handleSelectCardSize(foodId: string, sizeIndex: number) {
    setSelectedCardSizes((prev) => ({
      ...prev,
      [foodId]: sizeIndex,
    }));
  }

  function handleAddToCart(food: Dyremat, size?: FoodSize) {
    const finalPrice = getFinalPrice(size);

    if (!size || typeof finalPrice !== "number") {
      return;
    }

    const currentUserId = getUserId(currentUser);

    const cartItemId = `${food.id}-${
      size.id || `${size.weightValue}-${size.weightUnit}`
    }`;

    const newItem: CartItem = {
      cartItemId,
      productId: food.id,
      name: food.name,
      image: getImageUrl(food.image),
      weightValue: size.weightValue,
      weightUnit: size.weightUnit,
      price: finalPrice,
      originalPrice: size.price,
      discountPercent: size.discountPercent,
      quantity: 1,
      productType: "dyremat",
    };

    addItemToCart(currentUserId || undefined, newItem);
  }

  const selectedTypeName =
    selectedType === "all"
      ? ""
      : petTypeOptions.find((type) => type.id === selectedType)?.name || "";

  return (
    <main className={styles.dyrematPage}>
      <section className={styles.header}>
        <p className={styles.smallTitle}>Dyremat</p>

        <h1>Healthy food for your pets</h1>

        <p>Choose a pet type to see food that matches your pet.</p>

        {selectedType === "all" ? (
          <div className={styles.filterBar}>
            <button
              type="button"
              onClick={handleBackToAllFood}
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
                onClick={handleBackToAllFood}
                className={styles.backButton}
              >
                ← All food
              </button>
            </div>

            <div className={styles.filterBar}>
              <button
                type="button"
                onClick={() => setSelectedMatType("all")}
                className={`${styles.filterButton} ${
                  selectedMatType === "all" ? styles.filterButtonActive : ""
                }`}
              >
                All {formatLabel(selectedTypeName)}
              </button>

              {matTypeOptions.map((matType) => (
                <button
                  key={matType.id}
                  type="button"
                  onClick={() => setSelectedMatType(matType.id)}
                  className={`${styles.filterButton} ${
                    selectedMatType === matType.id
                      ? styles.filterButtonActive
                      : ""
                  }`}
                >
                  {formatLabel(matType.name)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {loading && <p className={styles.message}>Loading dyremat...</p>}

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && filteredDyremat.length === 0 && (
        <section className={styles.emptyBox}>
          <h2>No food found</h2>
          <p>Please add dyremat from the Payload admin panel first.</p>
        </section>
      )}

      {!loading && !error && filteredDyremat.length > 0 && (
        <section className={styles.foodGrid}>
          {filteredDyremat.map((food) => {
            const imageUrl = getImageUrl(food.image);
            const sizes = getSizes(food);
            const selectedIndex = selectedCardSizes[food.id] ?? 0;
            const selectedSize = sizes[selectedIndex] || sizes[0];

            const selectedFinalPrice = getFinalPrice(selectedSize);
            const selectedOnSale = isSizeOnSale(selectedSize);

            return (
              <article key={food.id} className={styles.foodCard}>
                <div className={styles.foodImageWrapper}>
                  {selectedOnSale &&
                    typeof selectedSize?.discountPercent === "number" &&
                    selectedSize.discountPercent > 0 && (
                      <span className={styles.discountBadge}>
                        -{selectedSize.discountPercent}%
                      </span>
                    )}

                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={
                        typeof food.image === "object" && food.image?.alt
                          ? food.image.alt
                          : food.name
                      }
                      className={styles.foodImage}
                    />
                  )}
                </div>

                <h2>{food.name}</h2>

                {sizes.length > 0 && (
                  <div className={styles.cardSizeOptions}>
                    {sizes.map((size, index) => (
                      <button
                        key={size.id || index}
                        type="button"
                        onClick={() => handleSelectCardSize(food.id, index)}
                        className={`${styles.cardSizeButton} ${
                          selectedIndex === index
                            ? styles.cardSizeButtonActive
                            : ""
                        }`}
                      >
                        {formatSize(size)}
                      </button>
                    ))}
                  </div>
                )}

                {food.description && (
                  <p className={styles.description}>{food.description}</p>
                )}

                <div className={styles.cardBottom}>
                  <div className={styles.priceBox}>
                    {selectedOnSale ? (
                      <>
                        <span className={styles.salePrice}>
                          {selectedFinalPrice} kr
                        </span>

                        <span className={styles.oldPrice}>
                          {selectedSize?.price} kr
                        </span>
                      </>
                    ) : (
                      <span className={styles.price}>
                        {typeof selectedFinalPrice === "number"
                          ? `${selectedFinalPrice} kr`
                          : "Price not set"}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardButtons}>
                    <button
                      type="button"
                      className={styles.detailButton}
                      onClick={() => {
                        setSelectedFood(food);
                        setSelectedSizeIndex(selectedIndex);
                      }}
                    >
                      Details
                    </button>

                    <button
                      type="button"
                      className={styles.cartButton}
                      disabled={
                        !selectedSize || typeof selectedFinalPrice !== "number"
                      }
                      onClick={() => handleAddToCart(food, selectedSize)}
                      aria-label="Add to cart"
                      title="Add to cart"
                    >
                      🛒
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedFood && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedFood(null)}
        >
          <section
            className={styles.detailModal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setSelectedFood(null)}
            >
              ×
            </button>

            <div className={styles.detailImageWrapper}>
              {getImageUrl(selectedFood.image) && (
                <img
                  src={getImageUrl(selectedFood.image)}
                  alt={selectedFood.name}
                  className={styles.detailImage}
                />
              )}
            </div>

            <div className={styles.detailContent}>
              {(() => {
                const sizes = getSizes(selectedFood);
                const selectedSize = sizes[selectedSizeIndex];

                const selectedFinalPrice = getFinalPrice(selectedSize);
                const selectedOnSale = isSizeOnSale(selectedSize);

                return (
                  <>
                    <h2>{selectedFood.name}</h2>

                    <div className={styles.detailPriceBox}>
                      {selectedOnSale ? (
                        <>
                          <span className={styles.detailSalePrice}>
                            {selectedFinalPrice} kr
                          </span>

                          <span className={styles.detailOldPrice}>
                            {selectedSize?.price} kr
                          </span>
                        </>
                      ) : (
                        <span className={styles.detailPrice}>
                          {typeof selectedFinalPrice === "number"
                            ? `${selectedFinalPrice} kr`
                            : "Price not set"}
                        </span>
                      )}
                    </div>

                    {sizes.length > 0 && (
                      <div className={styles.sizeSection}>
                        <h3>Choose size</h3>

                        <div className={styles.sizeOptions}>
                          {sizes.map((size, index) => (
                            <button
                              key={size.id || index}
                              type="button"
                              onClick={() => setSelectedSizeIndex(index)}
                              className={`${styles.sizeButton} ${
                                selectedSizeIndex === index
                                  ? styles.sizeButtonActive
                                  : ""
                              }`}
                            >
                              <span>{formatSize(size)}</span>

                              <strong>
                                {isSizeOnSale(size) ? (
                                  <>
                                    <span className={styles.sizeSalePrice}>
                                      {getFinalPrice(size)} kr
                                    </span>

                                    <span className={styles.sizeOldPrice}>
                                      {size.price} kr
                                    </span>
                                  </>
                                ) : (
                                  <span>
                                    {size.price
                                      ? `${size.price} kr`
                                      : "No price"}
                                  </span>
                                )}
                              </strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.detailGrid}>
                      <div>
                        <span>Pet type</span>
                        <strong>
                          {formatLabel(getRelationName(selectedFood.petType))}
                        </strong>
                      </div>

                      <div>
                        <span>Mat type</span>
                        <strong>
                          {formatLabel(getRelationName(selectedFood.matType))}
                        </strong>
                      </div>

                      <div>
                        <span>Selected size</span>
                        <strong>
                          {formatSize(selectedSize) || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Brand</span>
                        <strong>{selectedFood.brand || "Not specified"}</strong>
                      </div>

                      <div>
                        <span>Country</span>
                        <strong>
                          {selectedFood.countryOfOrigin || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>
                          {selectedFood.status === "sold-out"
                            ? "Sold out"
                            : "Available"}
                        </strong>
                      </div>
                    </div>
                  </>
                );
              })()}

              {selectedFood.ingredients && (
                <div className={styles.detailSection}>
                  <h3>Ingredients</h3>
                  <p>{selectedFood.ingredients}</p>
                </div>
              )}

              {selectedFood.description && (
                <div className={styles.detailSection}>
                  <h3>Description</h3>
                  <p>{selectedFood.description}</p>
                </div>
              )}

              {selectedFood.feedingGuide &&
                selectedFood.feedingGuide.length > 0 && (
                  <div className={styles.detailSection}>
                    <h3>Feeding guide</h3>

                    <table className={styles.feedingTable}>
                      <thead>
                        <tr>
                          <th>Weight from</th>
                          <th>Weight to</th>
                          <th>Food amount</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedFood.feedingGuide.map((row, index) => (
                          <tr key={row.id || index}>
                            <td>{row.weightFrom} kg</td>
                            <td>{row.weightTo} kg</td>
                            <td>{row.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}