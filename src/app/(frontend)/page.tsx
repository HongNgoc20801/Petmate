import Link from "next/link";
import { getPayload } from "payload";
import config from "@/payload.config";

type ProductType = "dyremat" | "tilbehor";

type Product = {
  id: string | number;
  slug?: string;
  name?: string;
  title?: string;
  productName?: string;
  brand?: string | { name?: string; title?: string };
  merke?: string;
  price?: number | string;
  salePrice?: number | string;
  originalPrice?: number | string;
  normalPrice?: number | string;
  discountPercent?: number | string;
  salePercentage?: number | string;
  onSale?: boolean;
  isSale?: boolean;
  category?: string | { name?: string; title?: string };
  petType?: string;
  animalType?: string;
  dyr?: string;
  image?: unknown;
  productImage?: unknown;
  mainImage?: unknown;
  thumbnail?: unknown;
  images?: unknown[];
  gallery?: unknown[];
  createdAt?: string;
  productType: ProductType;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleanedValue = value.replace(",", ".").replace(/[^\d.]/g, "");
    return Number(cleanedValue) || 0;
  }

  return 0;
}

function getRelationText(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    return String(
      objectValue.name ||
        objectValue.title ||
        objectValue.label ||
        objectValue.value ||
        ""
    );
  }

  return "";
}

function getProductName(product: Product) {
  return (
    product.name ||
    product.title ||
    product.productName ||
    "Produkt uten navn"
  );
}

function getProductBrand(product: Product) {
  if (typeof product.brand === "string") return product.brand;

  if (typeof product.brand === "object" && product.brand) {
    return product.brand.name || product.brand.title || "";
  }

  return product.merke || "";
}

function getCurrentPrice(product: Product) {
  const salePrice = toNumber(product.salePrice);
  const price = toNumber(product.price);

  if (salePrice > 0) return salePrice;

  return price;
}

function getOriginalPrice(product: Product) {
  const originalPrice = toNumber(product.originalPrice);
  const normalPrice = toNumber(product.normalPrice);
  const price = toNumber(product.price);

  if (originalPrice > 0) return originalPrice;
  if (normalPrice > 0) return normalPrice;

  return price;
}

function getDiscountPercent(product: Product) {
  const directDiscount = toNumber(
    product.discountPercent || product.salePercentage
  );

  if (directDiscount > 0) return Math.round(directDiscount);

  const originalPrice = getOriginalPrice(product);
  const currentPrice = getCurrentPrice(product);

  if (originalPrice > 0 && currentPrice > 0 && originalPrice > currentPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  return 0;
}

function isSaleProduct(product: Product) {
  return (
    product.onSale === true ||
    product.isSale === true ||
    getDiscountPercent(product) > 0
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
  }).format(price);
}

function getMediaUrl(media: unknown): string {
  if (!media) return "";

  if (typeof media === "string") {
    if (media.startsWith("http")) return media;
    if (media.startsWith("/api/media/file/")) return media;

    return "";
  }

  if (typeof media === "object") {
    const mediaObject = media as Record<string, unknown>;

    if (typeof mediaObject.url === "string") return mediaObject.url;

    if (typeof mediaObject.filename === "string") {
      return `/api/media/file/${mediaObject.filename}`;
    }

    if (mediaObject.image) return getMediaUrl(mediaObject.image);
    if (mediaObject.file) return getMediaUrl(mediaObject.file);
    if (mediaObject.media) return getMediaUrl(mediaObject.media);
  }

  return "";
}

function getProductImage(product: Product) {
  const candidates = [
    product.image,
    product.productImage,
    product.mainImage,
    product.thumbnail,
    product.images?.[0],
    product.gallery?.[0],
  ];

  for (const candidate of candidates) {
    const url = getMediaUrl(candidate);

    if (url) return url;
  }

  return "";
}

function getProductLink(product: Product) {
  return `/${product.productType}/${product.id}`;
}

function getSearchText(product: Product) {
  return [
    getProductName(product),
    getProductBrand(product),
    getRelationText(product.category),
    product.petType,
    product.animalType,
    product.dyr,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function findProductImageByKeywords(products: Product[], keywords: string[]) {
  const foundProduct = products.find((product) => {
    const text = getSearchText(product);

    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });

  if (!foundProduct) return "";

  return getProductImage(foundProduct);
}

async function getProducts(collection: ProductType): Promise<Product[]> {
  const payload = await getPayload({ config });

  try {
    const result = await payload.find({
      collection,
      limit: 100,
      depth: 2,
      sort: "-createdAt",
    });

    return result.docs.map((doc) => {
      const product = doc as unknown as Omit<Product, "productType">;

      return {
        ...product,
        productType: collection,
      };
    });
  } catch {
    return [];
  }
}

function ProductCard({ product }: { product: Product }) {
  const name = getProductName(product);
  const brand = getProductBrand(product);
  const imageUrl = getProductImage(product);
  const currentPrice = getCurrentPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product);

  return (
    <article className="productCard">
      <Link href={getProductLink(product)} className="productImageLink">
        <div className="productImageBox">
          {discountPercent > 0 && (
            <span className="productSaleBadge">-{discountPercent}%</span>
          )}

          {imageUrl ? (
            <img src={imageUrl} alt={name} className="productImage" />
          ) : (
            <div className="productImageFallback">🐾</div>
          )}
        </div>
      </Link>

      <div className="productInfo">
        <Link href={getProductLink(product)} className="productName">
          {name}
        </Link>

        {brand && <p className="productBrand">{brand}</p>}

        <div className="productRating">★★★★★</div>

        <div className="productPriceRow">
          <strong>{formatPrice(currentPrice)}</strong>

          {originalPrice > currentPrice && (
            <span>{formatPrice(originalPrice)}</span>
          )}
        </div>

        <p className="stockText">✓ På lager.</p>

        <Link href={getProductLink(product)} className="buyButton">
          Kjøp
        </Link>
      </div>
    </article>
  );
}

function CategoryCard({
  title,
  href,
  image,
  icon,
}: {
  title: string;
  href: string;
  image: string;
  icon: string;
}) {
  return (
    <Link href={href} className="categoryCard">
      {image ? (
        <img src={image} alt={title} className="categoryImage" />
      ) : (
        <div className="categoryFallback">{icon}</div>
      )}

      <div className="categoryOverlay">
        <h3>{title}</h3>
        <span>›</span>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const dyrematProducts = await getProducts("dyremat");
  const tilbehorProducts = await getProducts("tilbehor");

  const allProducts = [...dyrematProducts, ...tilbehorProducts];

  const saleProducts = allProducts.filter(isSaleProduct);
  const newestProducts = [...allProducts]
    .sort((a, b) => {
      return (
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
      );
    })
    .slice(0, 8);

  const recommendedProducts = allProducts.slice(0, 8);

  const heroProduct = saleProducts[0] || allProducts[0];
  const heroImage = heroProduct ? getProductImage(heroProduct) : "";
  const heroDiscount = heroProduct ? getDiscountPercent(heroProduct) : 0;

  const dogImage = findProductImageByKeywords(allProducts, [
    "hund",
    "dog",
    "valp",
  ]);

  const catImage = findProductImageByKeywords(allProducts, [
    "katt",
    "cat",
    "kattunge",
  ]);

  const smallAnimalImage = findProductImageByKeywords(allProducts, [
    "smådyr",
    "kanin",
    "hamster",
    "rabbit",
  ]);

  return (
    <main className="homePage">
      <section className="homeShell">
        <section className="saleHero">
          <div className="saleHeroMedia">
            {heroImage ? (
              <img
                src={heroImage}
                alt={heroProduct ? getProductName(heroProduct) : "Sale"}
              />
            ) : (
              <div className="heroFallback">🐶</div>
            )}

            {heroDiscount > 0 && (
              <div className="saleBubble">{heroDiscount}%</div>
            )}
          </div>

          <div className="saleHeroContent">
            <p className="heroEyebrow">PetMate kampanje</p>

            <h1>
              {saleProducts.length > 0
                ? "Store salg akkurat nå"
                : "Alt til kjæledyret ditt"}
            </h1>

            <p>
              {heroProduct
                ? getProductName(heroProduct)
                : "Finn mat, utstyr og produkter til hund, katt og smådyr."}
            </p>

            <Link
              href={heroProduct ? getProductLink(heroProduct) : "/dyremat"}
              className="heroButton"
            >
              Kjøp
            </Link>
          </div>
        </section>

        <section className="benefitRow">
          <div className="benefitItem">
            <div className="benefitIcon">🏷️</div>
            <div>
              <strong>Hver 7. sekk gratis</strong>
              <p>Gjelder utvalgt tørrfôr til hund og katt.</p>
            </div>
          </div>

          <div className="benefitItem">
            <div className="benefitIcon">📦</div>
            <div>
              <strong>Fri frakt over 599,-</strong>
              <p>Rask levering hjem til deg.</p>
            </div>
          </div>

          <div className="benefitItem">
            <div className="benefitIcon">🚚</div>
            <div>
              <strong>Levert hjem på døren</strong>
              <p>Leveringstid fra 2–5 virkedager.</p>
            </div>
          </div>

          <div className="benefitItem">
            <div className="benefitIcon">💬</div>
            <div>
              <strong>Personlig service</strong>
              <p>Vi hjelper deg med riktig valg.</p>
            </div>
          </div>
        </section>

        <section className="categoryGrid">
          <CategoryCard
            title="Hund"
            href="/dyremat"
            image={dogImage}
            icon="🐶"
          />

          <CategoryCard
            title="Katt"
            href="/dyremat"
            image={catImage}
            icon="🐱"
          />

          <CategoryCard
            title="Smådyr"
            href="/tilbehor"
            image={smallAnimalImage}
            icon="🐰"
          />

          <CategoryCard
            title="Tilbehør"
            href="/tilbehor"
            image={tilbehorProducts[0] ? getProductImage(tilbehorProducts[0]) : ""}
            icon="🦴"
          />
        </section>

        {saleProducts.length > 0 && (
          <section className="sectionBlock">
            <div className="sectionHeader">
              <div>
                <p>Utvalgte tilbud</p>
                <h2>Sale hos PetMate</h2>
              </div>

              <Link href="/tilbud">Se alle tilbud</Link>
            </div>

            <div className="productGrid">
              {saleProducts.slice(0, 4).map((product) => (
                <ProductCard key={`${product.productType}-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="wideBanner">
          <div>
            <p>Ukens kampanje</p>
            <h2>Alt kjæledyret ditt trenger på ett sted</h2>

            <Link href="/tilbud" className="wideBannerButton">
              Se kampanjer
            </Link>
          </div>
        </section>

        <section className="sectionBlock">
          <div className="sectionHeader">
            <div>
              <p>Nye produkter</p>
              <h2>Nyheter!</h2>
            </div>

            <Link href="/tilbehor">Se mer</Link>
          </div>

          <div className="productGrid">
            {newestProducts.slice(0, 4).map((product) => (
              <ProductCard key={`${product.productType}-${product.id}`} product={product} />
            ))}
          </div>
        </section>

        <section className="sectionBlock">
          <div className="sectionHeader">
            <div>
              <p>Populært nå</p>
              <h2>Visste du at du får hver 7. sekk gratis?</h2>
            </div>

            <Link href="/dyremat">Se dyremat</Link>
          </div>

          <div className="productGrid">
            {recommendedProducts.slice(0, 4).map((product) => (
              <ProductCard key={`${product.productType}-${product.id}`} product={product} />
            ))}
          </div>
        </section>

        <section className="inspirationSection">
          <div className="sectionHeader">
            <div>
              <p>PetMate kunder</p>
              <h2>Bli inspirert av våre kunder!</h2>
            </div>
          </div>

          <p className="inspirationText">
            Del dine bilder med kjæledyret ditt og bli en del av PetMate
            familien.
          </p>

          <div className="inspirationGrid">
            <div className="inspirationCard">🐶</div>
            <div className="inspirationCard">🐱</div>
            <div className="inspirationCard large">🐕</div>
            <div className="inspirationCard">🐰</div>
            <div className="inspirationCard">🐾</div>
          </div>
        </section>
      </section>
    </main>
  );
}
