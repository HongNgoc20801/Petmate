"use client";

import { useEffect, useState } from "react";
import styles from "./tilbud.module.css";

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
  sizes?: FoodSize[];
  countryOfOrigin?: string;
  ingredients?: string;
  description?: string;
  feedingGuide?: FeedingGuideRow[];
  status?: string;
  image?: ProductImage | string | null;
};

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

type SaleSize = {
  id?: string;
  cartItemId: string;
  weightValue?: number;
  weightUnit?: "kg" | "g";
  originalPrice: number;
  salePrice?: number | null;
  discountPercent?: number;
  sizeLabel?: string;
};

type SaleItem = {
  id: string;
  source: "dyremat" | "tilbehor";
  productId: string;
  cartItemId: string;
  name: string;
  cartName: string;
  image?: ProductImage | string | null;
  petType?: RelationValue;

  categoryName: string;
  matTypeName?: string;
  accessoryTypeName?: string;

  brand?: string;
  countryOfOrigin?: string;
  ingredients?: string;
  material?: string;
  color?: string;
  description?: string;
  feedingGuide?: FeedingGuideRow[];

  originalPrice: number;
  salePrice: number;
  discountPercent: number;

  status?: string;
  defaultSizeIndex?: number;
  sizes?: SaleSize[];
};

function formatSize(size?: FoodSize | SaleSize) {
  if (!size?.weightValue || !size?.weightUnit) {
    return "";
  }

  return `${size.weightValue} ${size.weightUnit}`;
}

function calculateDiscount(originalPrice: number, salePrice: number) {
  if (!originalPrice || !salePrice || salePrice >= originalPrice) {
    return 0;
  }

  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

function isFoodSizeOnSale(size: FoodSize) {
  return (
    typeof size.price === "number" &&
    typeof size.salePrice === "number" &&
    size.price > 0 &&
    size.salePrice > 0 &&
    size.salePrice < size.price
  );
}

function isTilbehorOnSale(product: Tilbehor) {
  return (
    typeof product.price === "number" &&
    typeof product.salePrice === "number" &&
    product.price > 0 &&
    product.salePrice > 0 &&
    product.salePrice < product.price
  );
}

function isOfferSizeOnSale(size?: SaleSize) {
  if (!size) return false;

  return (
    typeof size.salePrice === "number" &&
    size.salePrice > 0 &&
    size.salePrice < size.originalPrice
  );
}

function getOfferSizeFinalPrice(size?: SaleSize) {
  if (!size) return undefined;

  if (isOfferSizeOnSale(size)) {
    return size.salePrice as number;
  }

  return size.originalPrice;
}

function getUniquePetTypes(items: SaleItem[]) {
  const map = new Map<string, string>();

  items.forEach((item) => {
    const petTypes = item.petType;

    if (Array.isArray(petTypes)) {
      petTypes.forEach((petType) => {
        const id = getRelationId(petType);
        const name = getRelationName(petType);

        if (id && name) {
          map.set(id, name);
        }
      });

      return;
    }

    const id = getRelationId(petTypes as RelationItem | string | null);
    const name = getRelationName(petTypes as RelationItem | string | null);

    if (id && name) {
      map.set(id, name);
    }
  });

  return Array.from(map, ([id, name]) => ({ id, name }));
}

function getOfferSizes(item: SaleItem) {
  if (item.sizes && item.sizes.length > 0) {
    return item.sizes;
  }

  return [
    {
      cartItemId: item.cartItemId,
      originalPrice: item.originalPrice,
      salePrice: item.salePrice,
      discountPercent: item.discountPercent,
    },
  ];
}

function buildSaleItems(dyremat: Dyremat[], tilbehor: Tilbehor[]) {
  const saleItems: SaleItem[] = [];

  dyremat.forEach((food) => {
    if (!food.sizes || food.sizes.length === 0) return;

    const allSizes: SaleSize[] = food.sizes
      .filter((size) => typeof size.price === "number" && size.price > 0)
      .map((size, index) => {
        const originalPrice = size.price as number;
        const onSale = isFoodSizeOnSale(size);
        const salePrice = onSale ? (size.salePrice as number) : null;

        const discountPercent =
          onSale &&
          typeof size.discountPercent === "number" &&
          size.discountPercent > 0
            ? size.discountPercent
            : onSale && salePrice
              ? calculateDiscount(originalPrice, salePrice)
              : 0;

        return {
          id: size.id,
          cartItemId: `${food.id}-${
            size.id || `${size.weightValue}-${size.weightUnit}-${index}`
          }`,
          weightValue: size.weightValue,
          weightUnit: size.weightUnit,
          originalPrice,
          salePrice,
          discountPercent,
          sizeLabel: formatSize(size),
        };
      });

    const firstSaleIndex = allSizes.findIndex((size) =>
      isOfferSizeOnSale(size)
    );

    if (firstSaleIndex === -1) return;

    const firstSaleSize = allSizes[firstSaleIndex];
    const matTypeName = getRelationName(food.matType);

    saleItems.push({
      id: `dyremat-${food.id}`,
      source: "dyremat",
      productId: food.id,
      cartItemId: firstSaleSize.cartItemId,
      name: food.name,
      cartName: food.name,
      image: food.image,
      petType: food.petType,

      categoryName: matTypeName
        ? `Dyremat • ${formatLabel(matTypeName)}`
        : "Dyremat",
      matTypeName,

      brand: food.brand,
      countryOfOrigin: food.countryOfOrigin,
      ingredients: food.ingredients,
      description: food.description,
      feedingGuide: food.feedingGuide,

      originalPrice: firstSaleSize.originalPrice,
      salePrice: firstSaleSize.salePrice as number,
      discountPercent: firstSaleSize.discountPercent || 0,

      status: food.status,
      defaultSizeIndex: firstSaleIndex,
      sizes: allSizes,
    });
  });

  tilbehor.forEach((product) => {
    if (!isTilbehorOnSale(product)) return;

    const originalPrice = product.price;
    const salePrice = product.salePrice as number;

    const discountPercent =
      typeof product.discountPercent === "number" && product.discountPercent > 0
        ? product.discountPercent
        : calculateDiscount(originalPrice, salePrice);

    const accessoryTypeName = getRelationName(product.tilbehorType);

    saleItems.push({
      id: `tilbehor-${product.id}`,
      source: "tilbehor",
      productId: product.id,
      cartItemId: `tilbehor-${product.id}`,
      name: product.name,
      cartName: product.name,
      image: product.image,
      petType: product.petType,

      categoryName: accessoryTypeName
        ? `Tilbehør • ${formatLabel(accessoryTypeName)}`
        : "Tilbehør",
      accessoryTypeName,

      brand: product.brand,
      material: product.material,
      color: product.color,
      description: product.description,

      originalPrice,
      salePrice,
      discountPercent,

      status: product.status,
      defaultSizeIndex: 0,
      sizes: [
        {
          cartItemId: `tilbehor-${product.id}`,
          originalPrice,
          salePrice,
          discountPercent,
        },
      ],
    });
  });

  return saleItems;
}

export default function TilbudPage() {
  const [dyremat, setDyremat] = useState<Dyremat[]>([]);
  const [tilbehor, setTilbehor] = useState<Tilbehor[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "dyremat" | "tilbehor"
  >("all");

  const [selectedPetType, setSelectedPetType] = useState("all");

  const [selectedCardSizes, setSelectedCardSizes] = useState<
    Record<string, number>
  >({});

  const [selectedOffer, setSelectedOffer] = useState<SaleItem | null>(null);
  const [selectedOfferSizeIndex, setSelectedOfferSizeIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    async function loadSaleProducts() {
      try {
        const [dyrematResponse, tilbehorResponse] = await Promise.all([
          fetch("/api/dyremat?limit=100&depth=2", {
            credentials: "include",
          }),
          fetch("/api/tilbehor?limit=100&depth=2", {
            credentials: "include",
          }),
        ]);

        const dyrematData = await dyrematResponse.json();
        const tilbehorData = await tilbehorResponse.json();

        if (!dyrematResponse.ok || !tilbehorResponse.ok) {
          setError("Could not load tilbud.");
          return;
        }

        setDyremat(dyrematData.docs || []);
        setTilbehor(tilbehorData.docs || []);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadSaleProducts();
  }, []);

  const saleItems = buildSaleItems(dyremat, tilbehor);

  const petTypeOptions = getUniquePetTypes(saleItems);

  const filteredSaleItems = saleItems.filter((item) => {
    const matchCategory =
      selectedCategory === "all" || item.source === selectedCategory;

    const matchPetType =
      selectedPetType === "all" ||
      getRelationIds(item.petType).includes(selectedPetType);

    return matchCategory && matchPetType;
  });

  function handleSelectCategory(category: "all" | "dyremat" | "tilbehor") {
    setSelectedCategory(category);
  }

  function handleSelectCardSize(itemId: string, sizeIndex: number) {
    setSelectedCardSizes((prev) => ({
      ...prev,
      [itemId]: sizeIndex,
    }));
  }

  function handleAddToCart(item: SaleItem, selectedSize?: SaleSize) {
    const currentUserId = getUserId(currentUser);

    const offerSize =
        selectedSize ||
        getOfferSizes(item)[item.defaultSizeIndex || 0] ||
        getOfferSizes(item)[0];

    const finalPrice = getOfferSizeFinalPrice(offerSize);

    if (!offerSize || typeof finalPrice !== "number") {
        return;
    }

    const newItem: CartItem = {
        cartItemId: offerSize.cartItemId,
        productId: item.productId,
        name: item.cartName,
        image: getImageUrl(item.image),
        price: finalPrice,
        originalPrice: offerSize.originalPrice,
        discountPercent: offerSize.discountPercent,
        quantity: 1,
        productType: item.source,
        weightValue: offerSize.weightValue,
        weightUnit: offerSize.weightUnit,
    };

    addItemToCart(currentUserId || undefined, newItem);
    }

  return (
    <main className={styles.tilbudPage}>
      <section className={styles.header}>
        <p className={styles.smallTitle}>Tilbud</p>

        <h1>Discounted products for your pets</h1>

        <p>
          Here you can find pet food and accessories that are currently on sale.
        </p>

        <div className={styles.filterBar}>
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className={`${styles.filterButton} ${
              selectedCategory === "all" ? styles.filterButtonActive : ""
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory("dyremat")}
            className={`${styles.filterButton} ${
              selectedCategory === "dyremat" ? styles.filterButtonActive : ""
            }`}
          >
            Dyremat
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory("tilbehor")}
            className={`${styles.filterButton} ${
              selectedCategory === "tilbehor" ? styles.filterButtonActive : ""
            }`}
          >
            Tilbehør
          </button>
        </div>

        {petTypeOptions.length > 0 && (
          <div className={styles.filterBar}>
            <button
              type="button"
              onClick={() => setSelectedPetType("all")}
              className={`${styles.filterButton} ${
                selectedPetType === "all" ? styles.filterButtonActive : ""
              }`}
            >
              All pets
            </button>

            {petTypeOptions.map((petType) => (
              <button
                key={petType.id}
                type="button"
                onClick={() => setSelectedPetType(petType.id)}
                className={`${styles.filterButton} ${
                  selectedPetType === petType.id
                    ? styles.filterButtonActive
                    : ""
                }`}
              >
                {formatLabel(petType.name)}
              </button>
            ))}
          </div>
        )}
      </section>

      {loading && <p className={styles.message}>Loading tilbud...</p>}

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && filteredSaleItems.length === 0 && (
        <section className={styles.emptyBox}>
          <h2>No offers found</h2>
          <p>
            Add discount percent and sale prices to Dyremat or Tilbehør products
            in the admin panel first.
          </p>
        </section>
      )}

      {!loading && !error && filteredSaleItems.length > 0 && (
        <section className={styles.offerGrid}>
          {filteredSaleItems.map((item) => {
            const imageUrl = getImageUrl(item.image);
            const petTypeNames = getRelationNames(item.petType);
            const offerSizes = getOfferSizes(item);

            const selectedIndex =
              selectedCardSizes[item.id] ?? item.defaultSizeIndex ?? 0;

            const selectedSize = offerSizes[selectedIndex] || offerSizes[0];
            const selectedFinalPrice = getOfferSizeFinalPrice(selectedSize);
            const selectedOnSale = isOfferSizeOnSale(selectedSize);
            const isSoldOut = item.status === "sold-out";

            return (
              <article key={item.id} className={styles.offerCard}>
                <div className={styles.imageWrapper}>
                  {selectedOnSale &&
                    typeof selectedSize.discountPercent === "number" &&
                    selectedSize.discountPercent > 0 && (
                      <span className={styles.discountBadge}>
                        -{selectedSize.discountPercent}%
                      </span>
                    )}

                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className={styles.productImage}
                    />
                  )}
                </div>

                <h2>{item.name}</h2>

                {item.source === "dyremat" && offerSizes.length > 0 && (
                  <div className={styles.cardSizeOptions}>
                    {offerSizes.map((size, index) => (
                      <button
                        key={size.id || index}
                        type="button"
                        onClick={() => handleSelectCardSize(item.id, index)}
                        className={`${styles.cardSizeButton} ${
                          selectedIndex === index
                            ? styles.cardSizeButtonActive
                            : ""
                        }`}
                      >
                        {size.sizeLabel || formatSize(size)}
                      </button>
                    ))}
                  </div>
                )}

                {item.source === "tilbehor" && (
                  <p className={styles.productMeta}>
                    {petTypeNames.map(formatLabel).join(", ")}
                    {item.accessoryTypeName
                      ? ` • ${formatLabel(item.accessoryTypeName)}`
                      : ""}
                  </p>
                )}

                {item.source === "dyremat" && item.description && (
                  <p className={styles.description}>{item.description}</p>
                )}

                <div className={styles.cardBottom}>
                  <div className={styles.priceBox}>
                    {selectedOnSale ? (
                      <>
                        <span className={styles.salePrice}>
                          {selectedFinalPrice} kr
                        </span>

                        <span className={styles.oldPrice}>
                          {selectedSize.originalPrice} kr
                        </span>
                      </>
                    ) : (
                      <span className={styles.price}>
                        {selectedFinalPrice} kr
                      </span>
                    )}
                  </div>

                  <div className={styles.cardButtons}>
                    <button
                      type="button"
                      className={styles.detailButton}
                      onClick={() => {
                        setSelectedOffer(item);
                        setSelectedOfferSizeIndex(selectedIndex);
                      }}
                    >
                      Details
                    </button>

                    <button
                      type="button"
                      className={styles.cartButton}
                      disabled={isSoldOut}
                      onClick={() => handleAddToCart(item, selectedSize)}
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

      {selectedOffer && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedOffer(null)}
        >
          <section
            className={styles.detailModal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setSelectedOffer(null)}
            >
              ×
            </button>

            {(() => {
              const imageUrl = getImageUrl(selectedOffer.image);
              const petTypeNames = getRelationNames(selectedOffer.petType);
              const offerSizes = getOfferSizes(selectedOffer);

              const selectedSize =
                offerSizes[selectedOfferSizeIndex] ||
                offerSizes[selectedOffer.defaultSizeIndex || 0] ||
                offerSizes[0];

              const selectedFinalPrice = getOfferSizeFinalPrice(selectedSize);
              const selectedOnSale = isOfferSizeOnSale(selectedSize);
              const isSoldOut = selectedOffer.status === "sold-out";

              return (
                <>
                  <div className={styles.detailImageWrapper}>
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={selectedOffer.name}
                        className={styles.detailImage}
                      />
                    )}
                  </div>

                  <div className={styles.detailContent}>
                    <h2>{selectedOffer.name}</h2>

                    <div className={styles.detailPriceBox}>
                      {selectedOnSale ? (
                        <>
                          <span className={styles.detailSalePrice}>
                            {selectedFinalPrice} kr
                          </span>

                          <span className={styles.detailOldPrice}>
                            {selectedSize.originalPrice} kr
                          </span>
                        </>
                      ) : (
                        <span className={styles.detailPrice}>
                          {selectedFinalPrice} kr
                        </span>
                      )}
                    </div>

                    {selectedOffer.source === "dyremat" &&
                      offerSizes.length > 0 && (
                        <div className={styles.sizeSection}>
                          <h3>Choose size</h3>

                          <div className={styles.sizeOptions}>
                            {offerSizes.map((size, index) => {
                              const sizeFinalPrice =
                                getOfferSizeFinalPrice(size);

                              const sizeOnSale = isOfferSizeOnSale(size);

                              return (
                                <button
                                  key={size.id || index}
                                  type="button"
                                  onClick={() =>
                                    setSelectedOfferSizeIndex(index)
                                  }
                                  className={`${styles.sizeButton} ${
                                    selectedOfferSizeIndex === index
                                      ? styles.sizeButtonActive
                                      : ""
                                  }`}
                                >
                                  <span>
                                    {size.sizeLabel || formatSize(size)}
                                  </span>

                                  <strong>
                                    {sizeOnSale ? (
                                      <>
                                        <span
                                          className={styles.sizeSalePrice}
                                        >
                                          {sizeFinalPrice} kr
                                        </span>

                                        <span
                                          className={styles.sizeOldPrice}
                                        >
                                          {size.originalPrice} kr
                                        </span>
                                      </>
                                    ) : (
                                      <span>{size.originalPrice} kr</span>
                                    )}
                                  </strong>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {selectedOffer.source === "dyremat" ? (
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
                          <span>Mat type</span>
                          <strong>
                            {selectedOffer.matTypeName
                              ? formatLabel(selectedOffer.matTypeName)
                              : "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Selected size</span>
                          <strong>
                            {selectedSize.sizeLabel ||
                              formatSize(selectedSize) ||
                              "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Brand</span>
                          <strong>
                            {selectedOffer.brand || "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Country</span>
                          <strong>
                            {selectedOffer.countryOfOrigin || "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong>
                            {isSoldOut ? "Sold out" : "Available"}
                          </strong>
                        </div>
                      </div>
                    ) : (
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
                            {selectedOffer.accessoryTypeName
                              ? formatLabel(selectedOffer.accessoryTypeName)
                              : "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Brand</span>
                          <strong>
                            {selectedOffer.brand || "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Material</span>
                          <strong>
                            {selectedOffer.material || "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Color</span>
                          <strong>
                            {selectedOffer.color || "Not specified"}
                          </strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong>
                            {isSoldOut ? "Sold out" : "Available"}
                          </strong>
                        </div>
                      </div>
                    )}

                    {selectedOffer.source === "dyremat" &&
                      selectedOffer.ingredients && (
                        <div className={styles.detailSection}>
                          <h3>Ingredients</h3>
                          <p>{selectedOffer.ingredients}</p>
                        </div>
                      )}

                    {selectedOffer.description && (
                      <div className={styles.detailSection}>
                        <h3>Description</h3>
                        <p>{selectedOffer.description}</p>
                      </div>
                    )}

                    {selectedOffer.source === "dyremat" &&
                      selectedOffer.feedingGuide &&
                      selectedOffer.feedingGuide.length > 0 && (
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
                              {selectedOffer.feedingGuide.map((row, index) => (
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

                    <button
                      type="button"
                      className={styles.detailCartButton}
                      disabled={isSoldOut}
                      onClick={() =>
                        handleAddToCart(selectedOffer, selectedSize)
                      }
                    >
                      {isSoldOut ? "Sold out" : "Add to cart"}
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