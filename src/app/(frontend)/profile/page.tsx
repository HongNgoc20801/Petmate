"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";
import PetRegistrationModal from "../components/profile/PetRegistrationModal";

type MediaImage = {
  id?: string | number;
  url?: string;
  filename?: string;
  alt?: string;
};

type CurrentUser = {
  id?: string | number;
  _id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: string;
  role?: string;
  createdAt?: string;
  avatar?: MediaImage | string | number | null;
};

type RelationItem = {
  id: string | number;
  name?: string;
};

type Pet = {
  id: string | number;
  name: string;
  petType?: RelationItem | string | number | null;
  breed?: string;
};

function getUserId(user: CurrentUser | null) {
  if (!user) return "";

  return String(user.id || user._id || "");
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

function getFullName(user: CurrentUser) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  if (fullName) return fullName;

  return user.email || "PetMate user";
}

function getInitials(user: CurrentUser) {
  const firstLetter = user.firstName?.charAt(0) || "";
  const lastLetter = user.lastName?.charAt(0) || "";

  if (firstLetter || lastLetter) {
    return `${firstLetter}${lastLetter}`.toUpperCase();
  }

  return user.email?.charAt(0).toUpperCase() || "U";
}

function formatDate(date?: string) {
  if (!date) return "Ikke tilgjengelig";

  return new Date(date).toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getPetTypeLabel(petType?: Pet["petType"]) {
  if (!petType) return "Kjæledyr";

  if (typeof petType === "object") {
    return petType.name || "Kjæledyr";
  }

  if (petType === "dog") return "Hund";
  if (petType === "cat") return "Katt";
  if (petType === "smallAnimal") return "Smådyr";

  return "Kjæledyr";
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

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petModalOpen, setPetModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPets(ownerId: string) {
    try {
      const response = await fetch(
        `/api/pets?where[owner][equals]=${ownerId}&limit=100&sort=-createdAt&depth=2`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPets(data.docs || []);
      } else {
        setPets([]);
      }
    } catch {
      setPets([]);
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const meResponse = await fetch("/api/customers/me", {
          credentials: "include",
        });

        const meData = await meResponse.json();

        if (!meResponse.ok || !meData.user) {
          setUser(null);
          return;
        }

        const userId = String(meData.user.id || meData.user._id || "");

        let userData: CurrentUser = meData.user;

        if (userId) {
          const detailResponse = await fetch(
            `/api/customers/${userId}?depth=2`,
            {
              credentials: "include",
            }
          );

          const detailData = await detailResponse.json();

          if (detailResponse.ok) {
            userData = detailData.doc || detailData;
          }
        }

        if (
          userData.avatar &&
          (typeof userData.avatar === "string" ||
            typeof userData.avatar === "number")
        ) {
          const media = await getMediaById(userData.avatar);

          if (media) {
            userData = {
              ...userData,
              avatar: media,
            };
          }
        }

        setUser(userData);

        const currentUserId = getUserId(userData);

        if (currentUserId) {
          await loadPets(currentUserId);
        }
      } catch {
        setError("Kunne ikke laste profilen din.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/customers/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout skal fortsatt nullstille frontend selv om request feiler
    } finally {
      setUser(null);
      window.dispatchEvent(new Event("petmate-auth-updated"));
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <main className={styles.profilePage}>
        <p className={styles.message}>Laster profilen...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.profilePage}>
        <section className={styles.notLoggedInCard}>
          <h1>Min side</h1>

          <p>Du må logge inn for å se kontoinformasjonen din.</p>

          <div className={styles.notLoggedInActions}>
            <Link href="/login" className={styles.primaryButton}>
              Logg inn
            </Link>

            <Link href="/register" className={styles.secondaryButton}>
              Registrer deg
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar);
  const fullName = getFullName(user);
  const userId = getUserId(user);

  return (
    <main className={styles.profilePage}>
      <div className={styles.profileShell}>
        <aside className={styles.sidebar}>
          <div className={styles.userBox}>
            <div className={styles.sidebarAvatar}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className={styles.sidebarAvatarImage}
                />
              ) : (
                <div className={styles.sidebarInitials}>
                  {getInitials(user)}
                </div>
              )}
            </div>

            <div>
              <h2>{fullName}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <nav className={styles.sideMenu} aria-label="Profile menu">
            <Link
              href="/profile"
              className={`${styles.sideMenuItem} ${styles.active}`}
            >
              Min side
            </Link>

            <a href="#kontoinformasjon" className={styles.sideMenuItem}>
              Kontoinformasjon
            </a>

            <Link href="/profile/orders" className={styles.sideMenuItem}>
              Mine bestillinger
            </Link>

            <a href="#kjaeledyr" className={styles.sideMenuItem}>
              Kjæledyr
            </a>

            <a href="#tilbud" className={styles.sideMenuItem}>
              Personlige tilbud
            </a>

            <a href="#familie" className={styles.sideMenuItem}>
              Familiemedlemmer
            </a>

            <a href="#overvaking" className={styles.sideMenuItem}>
              Mine overvåkede produkter
            </a>

            <button
              type="button"
              className={styles.logoutMenuItem}
              onClick={handleLogout}
            >
              Logg ut
            </button>
          </nav>
        </aside>

        <section className={styles.content}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>PetMate konto</p>

            <h1>Min side</h1>

            <p>
              Hei, {fullName}! Her ser du din nåværende kontoaktivitet og
              kontoinformasjon.
            </p>
          </section>

          {error && <p className={styles.error}>{error}</p>}

          <section id="kontoinformasjon" className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2>Kontoinformasjon</h2>

              <Link href="/profile/edit" className={styles.editTopLink}>
                Endre
              </Link>
            </div>

            <div className={styles.accountCard}>
              <div className={styles.accountLeft}>
                <strong>{fullName}</strong>

                {userId && <span>Medlemsnummer {userId}</span>}

                <span>{user.email || "-"}</span>

                <div className={styles.infoSmallBlock}>
                  <strong>Telefon:</strong>
                  <span>{user.phone || "-"}</span>
                </div>

                <div className={styles.infoSmallBlock}>
                  <strong>Medlem siden:</strong>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </div>

              <div className={styles.accountRight}>
                <div>
                  <strong>Adresse:</strong>
                  <span>{user.address || "-"}</span>
                </div>

                <div>
                  <strong>Kjønn:</strong>
                  <span>{user.gender || "-"}</span>
                </div>

                <Link href="/profile/edit" className={styles.greenButton}>
                  Endre kontoinformasjon
                </Link>
              </div>
            </div>
          </section>

          <section className={styles.twoColumnGrid}>
            <div id="kjaeledyr" className={styles.sectionBlock}>
              <h2>Kjæledyr</h2>

              <div className={styles.greyCard}>
                {pets.length === 0 ? (
                  <>
                    <p>
                      Registrer hunder, katter eller andre kjæledyr for å få
                      bedre anbefalinger, personlige tilbud og enklere
                      handleopplevelse.
                    </p>

                    <p>Du har ingen kjæledyr registrert på kontoen din ennå.</p>

                    <button
                      type="button"
                      className={styles.greenButton}
                      onClick={() => setPetModalOpen(true)}
                    >
                      Registrere nytt kjæledyr
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      Du har registrert {pets.length} kjæledyr på kontoen din.
                    </p>

                    <div className={styles.petPreviewList}>
                      {pets.map((pet) => (
                        <Link
                          key={pet.id}
                          href={`/profile/pets/${pet.id}`}
                          className={styles.petPreviewCard}
                        >
                          <strong>{pet.name}</strong>
                          <span>{getPetTypeLabel(pet.petType)}</span>
                        </Link>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={styles.greenButton}
                      onClick={() => setPetModalOpen(true)}
                    >
                      Legg til nytt kjæledyr
                    </button>
                  </>
                )}
              </div>
            </div>

            <div id="familie" className={styles.sectionBlock}>
              <h2>Familiemedlemmer</h2>

              <div className={styles.greenInfoCard}>
                <p>
                  Du har ikke lagt til noen familiemedlem til din konto. Gjør det
                  enkelt å dele handlelister, tilbud og kjæledyrinformasjon.
                </p>

                <button type="button" className={styles.greenButton}>
                  Legg til et familiemedlem
                </button>
              </div>
            </div>
          </section>

          <section className={styles.twoColumnGrid}>
            <div id="bestillinger" className={styles.sectionBlock}>
              <h2>Mine bestillinger</h2>

              <div className={styles.whiteCard}>
                <p>
                  Se tidligere bestillinger, varer du har kjøpt, totalpris og
                  betalingsstatus.
                </p>

                <Link href="/profile/orders" className={styles.outlineButton}>
                  Se mine bestillinger
                </Link>
              </div>
            </div>

            <div id="tilbud" className={styles.sectionBlock}>
              <h2>Personlige tilbud</h2>

              <div className={styles.whiteCard}>
                <p>
                  Her kan du senere se personlige tilbud basert på dine
                  favoritter og tidligere kjøp.
                </p>

                <Link href="/tilbud" className={styles.outlineButton}>
                  Se tilbud
                </Link>
              </div>
            </div>
          </section>

          <section id="overvaking" className={styles.sectionBlock}>
            <h2>Mine overvåkede produkter</h2>

            <div className={styles.whiteCard}>
              <p>
                Du har ingen overvåkede produkter ennå. Senere kan du følge med
                på varer, prisendringer og tilbud her.
              </p>
            </div>
          </section>
        </section>
      </div>

      <PetRegistrationModal
        ownerId={userId}
        open={petModalOpen}
        onClose={() => setPetModalOpen(false)}
        onPetCreated={(createdPetId) => {
          if (userId) {
            loadPets(userId);
          }

          router.push(`/profile/pets/${createdPetId}`);
        }}
      />
    </main>
  );
}