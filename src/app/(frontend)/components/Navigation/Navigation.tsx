"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navigation.module.css";

import {
  type CurrentUser as CartCurrentUser,
  getUserId,
  getCartQuantity,
  readCart,
} from "../../lib/cartUtils";

type MediaImage = {
  id?: string | number;
  url?: string;
  filename?: string;
  alt?: string;
};

type CurrentUser = CartCurrentUser & {
  firstName?: string;
  lastName?: string;
  avatar?: MediaImage | string | number | null;
};

function getCartCountFromStorage(user: CurrentUser | null) {
  if (typeof window === "undefined") return 0;

  const userId = getUserId(user);

  const cart = readCart(userId || undefined);

  return getCartQuantity(cart);
}

function getAvatarUrl(avatar: CurrentUser["avatar"]) {
  if (!avatar) return "";

  if (typeof avatar === "string") {
    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("/api/media/file/")) return avatar;

    return "";
  }

  if (typeof avatar === "number") {
    return "";
  }

  if (avatar.url) {
    return avatar.url;
  }

  if (avatar.filename) {
    return `/api/media/file/${avatar.filename}`;
  }

  return "";
}

async function getMediaById(mediaId: string | number) {
  try {
    const response = await fetch(`/api/media/${mediaId}`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) return null;

    return data.doc || data;
  } catch {
    return null;
  }
}

async function getUserWithAvatar(userData: CurrentUser) {
  const userId = String(userData.id || userData._id || "");

  let fullUser = userData;

  if (userId) {
    try {
      const detailResponse = await fetch(`/api/customers/${userId}?depth=2`, {
        credentials: "include",
      });

      const detailData = await detailResponse.json();

      if (detailResponse.ok) {
        fullUser = detailData.doc || detailData;
      }
    } catch {
      fullUser = userData;
    }
  }

  if (
    fullUser.avatar &&
    (typeof fullUser.avatar === "string" || typeof fullUser.avatar === "number")
  ) {
    const media = await getMediaById(fullUser.avatar);

    if (media) {
      fullUser = {
        ...fullUser,
        avatar: media,
      };
    }
  }

  return fullUser;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Hjem", href: "/" },
    { name: "Omplassering", href: "/omplassering" },
    { name: "Dyremat", href: "/dyremat" },
    { name: "Tilbehør", href: "/tilbehor" },
    { name: "Tilbud", href: "/tilbud" },
    { name: "Om oss", href: "/omoss" },
  ];

  useEffect(() => {
    async function checkLoginStatus() {
      try {
        const response = await fetch("/api/customers/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
          setUser(null);
          setCartCount(getCartCountFromStorage(null));
          return;
        }

        const loggedInUser = await getUserWithAvatar(data.user);

        setUser(loggedInUser);
        setCartCount(getCartCountFromStorage(loggedInUser));
      } catch {
        setUser(null);
        setCartCount(getCartCountFromStorage(null));
      } finally {
        setLoadingUser(false);
      }
    }

    checkLoginStatus();

    window.addEventListener("petmate-auth-updated", checkLoginStatus);
    window.addEventListener("focus", checkLoginStatus);

    return () => {
      window.removeEventListener("petmate-auth-updated", checkLoginStatus);
      window.removeEventListener("focus", checkLoginStatus);
    };
  }, [pathname]);

  useEffect(() => {
    function updateCartCount() {
      setCartCount(getCartCountFromStorage(user));
    }

    updateCartCount();

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("petmate-cart-updated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("petmate-cart-updated", updateCartCount);
    };
  }, [user]);

  function getInitials(currentUser: CurrentUser) {
    const firstLetter = currentUser.firstName?.charAt(0) || "";
    const lastLetter = currentUser.lastName?.charAt(0) || "";

    if (firstLetter || lastLetter) {
      return `${firstLetter}${lastLetter}`.toUpperCase();
    }

    return currentUser.email?.charAt(0).toUpperCase() || "U";
  }

  async function handleLogout() {
    try {
      await fetch("/api/customers/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Nếu logout request lỗi, vẫn reset giao diện phía frontend
    } finally {
      setUser(null);
      setCartCount(getCartCountFromStorage(null));
      setProfileMenuOpen(false);
      router.push("/login");

      window.dispatchEvent(new Event("petmate-auth-updated"));
    }
  }

  const avatarUrl = user ? getAvatarUrl(user.avatar) : "";

  return (
    <header className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        <img
          src="/images/petlogo.png"
          alt="PetMate logo"
          className={styles.logoImage}
        />

        <span className={styles.logoText}>
          <span className={styles.logoPet}>Pet</span>Mate
        </span>
      </Link>

      <nav className={styles.navLinks}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className={styles.authActions}>
        <Link href="/cart" className={styles.cartLink} aria-label="Cart">
          <span className={styles.cartIcon}>🛒</span>

          {cartCount > 0 && (
            <span className={styles.cartBadge}>{cartCount}</span>
          )}
        </Link>

        {!loadingUser && !user && (
          <>
            <Link href="/login" className={styles.loginButton}>
              Logg inn
            </Link>

            <Link href="/register" className={styles.registerButton}>
              Registrer deg
            </Link>
          </>
        )}

        {!loadingUser && user && (
          <div className={styles.profileMenuWrapper}>
            <button
              type="button"
              className={styles.profileButton}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label="Open profile menu"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileInitials}>
                  {getInitials(user)}
                </div>
              )}
            </button>

            {profileMenuOpen && (
              <div className={styles.profileDropdown}>
                <Link
                  href="/profile"
                  className={styles.profileDropdownLink}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  Min profil
                </Link>

                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  Logg ut
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}