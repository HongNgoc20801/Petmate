import styles from "../../cart/cart.module.css";

import {
  type CartItem,
  formatPrice,
} from "../../lib/cartUtils";

type CartItemCardProps = {
  item: CartItem;
  onIncrease: (cartItemId: string) => void;
  onDecrease: (cartItemId: string) => void;
  onRemove: (cartItemId: string) => void;
};

function formatSize(item: CartItem) {
  if (!item.weightValue || !item.weightUnit) return "";

  return `${item.weightValue} ${item.weightUnit}`;
}

export default function CartItemCard({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemCardProps) {
  const sizeText = formatSize(item);

  const itemTotal = formatPrice(item.price * item.quantity);

  const originalPrice =
    typeof item.originalPrice === "number" ? item.originalPrice : undefined;

  const isOnSale =
    typeof originalPrice === "number" && originalPrice > item.price;

  return (
    <article className={styles.cartItem}>
      <div className={styles.imageWrapper}>
        {item.discountPercent && item.discountPercent > 0 && isOnSale && (
          <span className={styles.discountBadge}>
            -{item.discountPercent}%
          </span>
        )}

        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className={styles.productImage}
          />
        )}
      </div>

      <div className={styles.itemContent}>
        <div className={styles.itemTop}>
          <div>
            <p className={styles.productType}>
              {item.productType === "dyremat" ? "Dyremat" : "Tilbehør"}
            </p>

            <h2>{item.name}</h2>

            {sizeText && <p className={styles.itemMeta}>Size: {sizeText}</p>}
          </div>

          <button
            type="button"
            className={styles.removeButton}
            onClick={() => onRemove(item.cartItemId)}
          >
            Remove
          </button>
        </div>

        <div className={styles.itemBottom}>
          <div className={styles.priceBox}>
            <span className={isOnSale ? styles.salePrice : styles.price}>
              {formatPrice(item.price)} kr
            </span>

            {isOnSale && typeof originalPrice === "number" && (
              <span className={styles.oldPrice}>
                {formatPrice(originalPrice)} kr
              </span>
            )}
          </div>

          <div className={styles.quantityBox}>
            <button
              type="button"
              onClick={() => onDecrease(item.cartItemId)}
            >
              −
            </button>

            <span>{item.quantity}</span>

            <button
              type="button"
              onClick={() => onIncrease(item.cartItemId)}
            >
              +
            </button>
          </div>

          <strong className={styles.itemTotal}>{itemTotal} kr</strong>
        </div>
      </div>
    </article>
  );
}