"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "./petDetail.module.css";

type MediaImage = {
  id?: string | number;
  url?: string;
  filename?: string;
  alt?: string;
};

type Pet = {
  id: string | number;
  name: string;
  petType?: "dog" | "cat" | "smallAnimal";
  breed?: string;
  image?: MediaImage | string | number | null;
  gender?: "male" | "female";
  sterilized?: "notSterilized" | "sterilized";
  origin?: "breeder" | "adopted";
  birthDate?: string;
  description?: string;
};

function getPetTypeLabel(petType?: Pet["petType"]) {
  if (petType === "dog") return "Hund";
  if (petType === "cat") return "Katt";
  if (petType === "smallAnimal") return "Smådyr";

  return "Kjæledyr";
}

function getGenderLabel(gender?: Pet["gender"]) {
  if (gender === "male") return "Han";
  if (gender === "female") return "Hun";

  return "-";
}

function getSterilizedLabel(sterilized?: Pet["sterilized"]) {
  if (sterilized === "sterilized") return "Sterilisert";
  if (sterilized === "notSterilized") return "Ikke sterilisert";

  return "-";
}

function getOriginLabel(origin?: Pet["origin"]) {
  if (origin === "breeder") return "Fra oppdretter";
  if (origin === "adopted") return "Adoptert";

  return "-";
}

function getImageUrl(image: Pet["image"]) {
  if (!image) return "";

  if (typeof image === "string") {
    if (image.startsWith("http")) return image;
    if (image.startsWith("/api/media/file/")) return image;

    return "";
  }

  if (typeof image === "number") return "";

  if (image.url) return image.url;

  if (image.filename) {
    return `/api/media/file/${image.filename}`;
  }

  return "";
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();

  const petId = String(params.id || "");

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState("");

  const [editPetType, setEditPetType] = useState<Pet["petType"]>("dog");
  const [editBreed, setEditBreed] = useState("");
  const [editName, setEditName] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editGender, setEditGender] = useState("");
  const [editSterilized, setEditSterilized] = useState("");
  const [editOrigin, setEditOrigin] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function loadPet() {
    try {
      const response = await fetch(`/api/pets/${petId}?depth=2`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError("Kunne ikke laste kjæledyret.");
        return;
      }

      const loadedPet = data.doc || data;

      setPet(loadedPet);
    } catch {
      setError("Noe gikk galt under lasting av kjæledyret.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (petId) {
      loadPet();
    }
  }, [petId]);

  function openEditModal() {
    if (!pet) return;

    setEditPetType(pet.petType || "dog");
    setEditBreed(pet.breed || "");
    setEditName(pet.name || "");
    setEditImageFile(null);
    setEditGender(pet.gender || "");
    setEditSterilized(pet.sterilized || "");
    setEditOrigin(pet.origin || "");
    setEditBirthDate(pet.birthDate || "");
    setEditDescription(pet.description || "");
    setError("");
    setEditOpen(true);
  }

  async function uploadNewPetImage() {
    if (!editImageFile) return null;

    const formData = new FormData();

    formData.append("file", editImageFile);

    formData.append(
      "_payload",
      JSON.stringify({
        alt: editName || "Pet image",
      })
    );

    const response = await fetch("/api/media", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Kunne ikke laste opp bilde.");
    }

    return data.doc?.id || data.id || null;
  }

  async function handleUpdatePet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pet) return;

    if (!editName.trim()) {
      setError("Navn på kjæledyr er påkrevd.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const imageId = await uploadNewPetImage();

      const updateData: Record<string, unknown> = {
        petType: editPetType,
        breed: editBreed.trim(),
        name: editName.trim(),
        gender: editGender || undefined,
        sterilized: editSterilized || undefined,
        origin: editOrigin || undefined,
        birthDate: editBirthDate.trim(),
        description: editDescription.trim(),
      };

      if (imageId) {
        updateData.image = imageId;
      }

      const response = await fetch(`/api/pets/${pet.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Kunne ikke oppdatere kjæledyret.");
        return;
      }

      const updatedPet = data.doc || data;

      setPet(updatedPet);
      setEditOpen(false);
      setEditImageFile(null);
    } catch {
      setError("Noe gikk galt under oppdatering av kjæledyret.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePet() {
    if (!pet) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/pets/${pet.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        setError("Kunne ikke slette kjæledyret.");
        return;
      }

      setDeleteModalOpen(false);
      router.push("/profile#kjaeledyr");
    } catch {
      setError("Noe gikk galt under sletting av kjæledyret.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.petDetailPage}>
        <p className={styles.message}>Laster kjæledyr...</p>
      </main>
    );
  }

  if (error && !pet) {
    return (
      <main className={styles.petDetailPage}>
        <section className={styles.emptyCard}>
          <h1>Kjæledyr ikke funnet</h1>

          <p>{error}</p>

          <Link href="/profile" className={styles.backButton}>
            Tilbake til Min side
          </Link>
        </section>
      </main>
    );
  }

  if (!pet) {
    return (
      <main className={styles.petDetailPage}>
        <section className={styles.emptyCard}>
          <h1>Kjæledyr ikke funnet</h1>

          <p>Dette kjæledyret finnes ikke.</p>

          <Link href="/profile" className={styles.backButton}>
            Tilbake til Min side
          </Link>
        </section>
      </main>
    );
  }

  const imageUrl = getImageUrl(pet.image);

  return (
    <main className={styles.petDetailPage}>
      <div className={styles.petDetailShell}>
        <Link href="/profile#kjaeledyr" className={styles.backLink}>
          ← Tilbake til Min side
        </Link>

        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.heroCard}>
          <div className={styles.imageBox}>
            {imageUrl ? (
              <img src={imageUrl} alt={pet.name} className={styles.petImage} />
            ) : (
              <div className={styles.imageFallback}>🐾</div>
            )}
          </div>

          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{getPetTypeLabel(pet.petType)}</p>

            <h1>{pet.name}</h1>

            <p>
              {pet.description ||
                "Her finner du informasjonen som er registrert om kjæledyret ditt."}
            </p>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.editButton}
                onClick={openEditModal}
              >
                Endre informasjon
              </button>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setDeleteModalOpen(true)}
                disabled={deleting}
              >
                {deleting ? "Sletter..." : "Slett kjæledyr"}
              </button>
            </div>
          </div>
        </section>

        <section className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <span>Type</span>
            <strong>{getPetTypeLabel(pet.petType)}</strong>
          </div>

          <div className={styles.infoCard}>
            <span>Rase</span>
            <strong>{pet.breed || "-"}</strong>
          </div>

          <div className={styles.infoCard}>
            <span>Kjønn</span>
            <strong>{getGenderLabel(pet.gender)}</strong>
          </div>

          <div className={styles.infoCard}>
            <span>Sterilisert</span>
            <strong>{getSterilizedLabel(pet.sterilized)}</strong>
          </div>

          <div className={styles.infoCard}>
            <span>Opprinnelse</span>
            <strong>{getOriginLabel(pet.origin)}</strong>
          </div>

          <div className={styles.infoCard}>
            <span>Fødselsdato</span>
            <strong>{pet.birthDate || "-"}</strong>
          </div>
        </section>

        <section className={styles.descriptionCard}>
          <h2>Beskrivelse</h2>

          <p>{pet.description || "Ingen beskrivelse er lagt til ennå."}</p>
        </section>
      </div>

      {editOpen && (
        <div className={styles.modalOverlay} onClick={() => setEditOpen(false)}>
          <section
            className={styles.editModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p>PetMate konto</p>
                <h2>Endre kjæledyr</h2>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setEditOpen(false)}
                aria-label="Lukk redigering"
              >
                ×
              </button>
            </div>

            <form className={styles.editForm} onSubmit={handleUpdatePet}>
              <div className={styles.choiceGroup}>
                <button
                  type="button"
                  className={editPetType === "dog" ? styles.activeChoice : ""}
                  onClick={() => setEditPetType("dog")}
                >
                  Hund
                </button>

                <button
                  type="button"
                  className={editPetType === "cat" ? styles.activeChoice : ""}
                  onClick={() => setEditPetType("cat")}
                >
                  Katt
                </button>

                <button
                  type="button"
                  className={
                    editPetType === "smallAnimal" ? styles.activeChoice : ""
                  }
                  onClick={() => setEditPetType("smallAnimal")}
                >
                  Smådyr
                </button>
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-pet-breed">Rase</label>

                <input
                  id="edit-pet-breed"
                  type="text"
                  value={editBreed}
                  onChange={(event) => setEditBreed(event.target.value)}
                  placeholder="Velg rase"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-pet-name">Navn *</label>

                <input
                  id="edit-pet-name"
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Navn"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-pet-image">Bytt bilde</label>

                <input
                  id="edit-pet-image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  title="Bytt bilde"
                  aria-label="Bytt bilde"
                  onChange={(event) =>
                    setEditImageFile(event.target.files?.[0] || null)
                  }
                />
              </div>

              <div className={styles.field}>
                <p className={styles.groupLabel}>Kjønn</p>

                <div className={styles.choiceGroup}>
                  <button
                    type="button"
                    className={editGender === "male" ? styles.activeChoice : ""}
                    onClick={() => setEditGender("male")}
                  >
                    Han
                  </button>

                  <button
                    type="button"
                    className={
                      editGender === "female" ? styles.activeChoice : ""
                    }
                    onClick={() => setEditGender("female")}
                  >
                    Hun
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <p className={styles.groupLabel}>Sterilisert eller ikke</p>

                <div className={styles.choiceGroup}>
                  <button
                    type="button"
                    className={
                      editSterilized === "notSterilized"
                        ? styles.activeChoice
                        : ""
                    }
                    onClick={() => setEditSterilized("notSterilized")}
                  >
                    Ikke sterilisert
                  </button>

                  <button
                    type="button"
                    className={
                      editSterilized === "sterilized"
                        ? styles.activeChoice
                        : ""
                    }
                    onClick={() => setEditSterilized("sterilized")}
                  >
                    Sterilisert
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <p className={styles.groupLabel}>Er kjæledyret ditt:</p>

                <div className={styles.choiceGroup}>
                  <button
                    type="button"
                    className={
                      editOrigin === "breeder" ? styles.activeChoice : ""
                    }
                    onClick={() => setEditOrigin("breeder")}
                  >
                    Fra oppdretter
                  </button>

                  <button
                    type="button"
                    className={
                      editOrigin === "adopted" ? styles.activeChoice : ""
                    }
                    onClick={() => setEditOrigin("adopted")}
                  >
                    Adoptert
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-pet-birth-date">
                  Fødselsdato (DD.MM.ÅÅÅÅ)
                </label>

                <input
                  id="edit-pet-birth-date"
                  type="text"
                  value={editBirthDate}
                  onChange={(event) => setEditBirthDate(event.target.value)}
                  placeholder="DD.MM.ÅÅÅÅ"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="edit-pet-description">Beskrivelse</label>

                <textarea
                  id="edit-pet-description"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={4}
                  placeholder="Skriv litt om kjæledyret ditt."
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setEditOpen(false)}
                >
                  Avbryt
                </button>

                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? "Lagrer..." : "Lagre endringer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteModalOpen && (
        <div
          className={styles.deleteModalOverlay}
          onClick={() => {
            if (!deleting) {
              setDeleteModalOpen(false);
            }
          }}
        >
          <section
            className={styles.deleteConfirmModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.deleteIcon}>!</div>

            <h2>Slette kjæledyr?</h2>

            <p>
              Er du sikker på at du vil slette <strong>{pet.name}</strong>?
              Denne handlingen kan ikke angres.
            </p>

            <div className={styles.deleteActions}>
              <button
                type="button"
                className={styles.cancelDeleteButton}
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Avbryt
              </button>

              <button
                type="button"
                className={styles.confirmDeleteButton}
                onClick={handleDeletePet}
                disabled={deleting}
              >
                {deleting ? "Sletter..." : "Ja, slett"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}