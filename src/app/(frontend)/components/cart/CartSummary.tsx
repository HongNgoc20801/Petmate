import styles from "../../cart/cart.module.css";

import { formatPrice } from "../../lib/cartUtils";
import Link from "next/link";
type CartSummaryProps = {
  totalQuantity: number;
  totalPrice: number;
  onClearCart: () => void;
};

export default function CartSummary({
  totalQuantity,
  totalPrice,
  onClearCart,
}: CartSummaryProps) {
  return (
    <aside className={styles.summaryBox}>
      <h2>Order summary</h2>

      <div className={styles.summaryRow}>
        <span>Items</span>
        <strong>{totalQuantity}</strong>
      </div>

      <div className={styles.summaryRow}>
        <span>Total</span>
        <strong>{formatPrice(totalPrice)} kr</strong>
      </div>

      <Link href="/checkout" className={styles.checkoutButton}>
        Continue to checkout
      </Link>

      <button
        type="button"
        className={styles.clearButton}
        onClick={onClearCart}
      >
        Clear cart
      </button>
    </aside>
  );
}