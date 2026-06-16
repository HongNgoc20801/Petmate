"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./PetRegistrationModal.module.css";

type PetTypeDoc = {
  id: string | number;
  name: string;
};

type PetRegistrationModalProps = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  onPetCreated: (createdPetId: string | number) => void;
};

function normalizeId(id: string) {
  const numberId = Number(id);

  if (!Number.isNaN(numberId)) {
    return numberId;
  }

  return id;
}

function formatPetTypeName(name: string) {
  if (!name) return "Kjæledyr";

  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function PetRegistrationModal({
  ownerId,
  open,
  onClose,
  onPetCreated,
}: PetRegistrationModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [petTypes, setPetTypes] = useState<PetTypeDoc[]>([]);
  const [loadingPetTypes, setLoadingPetTypes] = useState(false);

  const [petType, setPetType] = useState("");
  const [breed, setBreed] = useState("");
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gender, setGender] = useState("");
  const [sterilized, setSterilized] = useState("");
  const [origin, setOrigin] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;

    async function loadPetTypes() {
      try {
        setLoadingPetTypes(true);
        setError("");

        const response = await fetch("/api/pet-types?limit=100&sort=name", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError("Kunne ikke laste dyretyper.");
          return;
        }

        const docs: PetTypeDoc[] = data.docs || [];

        setPetTypes(docs);

        if (docs.length > 0) {
          setPetType(String(docs[0].id));
        }
      } catch {
        setError("Noe gikk galt ved lasting av dyretyper.");
      } finally {
        setLoadingPetTypes(false);
      }
    }

    loadPetTypes();
  }, [open]);

  if (!open) return null;

  function resetForm() {
    setPetType(petTypes.length > 0 ? String(petTypes[0].id) : "");
    setBreed("");
    setName("");
    setImageFile(null);
    setGender("");
    setSterilized("");
    setOrigin("");
    setBirthDate("");
    setDescription("");
    setError("");
  }

  async function uploadPetImage() {
    if (!imageFile) return null;

    const formData = new FormData();

    formData.append("file", imageFile);

    formData.append(
      "_payload",
      JSON.stringify({
        alt: name || "Pet image",
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ownerId) {
      setError("Du må være logget inn for å registrere kjæledyr.");
      return;
    }

    if (!petType) {
      setError("Du må velge type kjæledyr.");
      return;
    }

    if (!name.trim()) {
      setError("Navn på kjæledyr er påkrevd.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const imageId = await uploadPetImage();

      const response = await fetch("/api/pets", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: normalizeId(ownerId),
          petType: normalizeId(petType),
          breed: breed.trim(),
          name: name.trim(),
          image: imageId,
          gender,
          sterilized,
          origin,
          birthDate: birthDate.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Kunne ikke registrere kjæledyr.");
        return;
      }

      const createdPet = data.doc || data;
      const createdPetId = createdPet.id || createdPet._id;

      resetForm();
      onPetCreated(createdPetId);
      onClose();
    } catch {
      setError("Noe gikk galt under registrering av kjæledyr.");
    } finally {
      setSaving(false);
    }
  }

  function getBreedLabel() {
    const selectedPetType = petTypes.find(
      (type) => String(type.id) === petType
    );

    const petTypeName = selectedPetType?.name.toLowerCase() || "";

    if (petTypeName.includes("hund")) return "Hunderase";
    if (petTypeName.includes("katt")) return "Katterase";

    return "Rase eller type";
  }

  function getBreedPlaceholder() {
    const selectedPetType = petTypes.find(
      (type) => String(type.id) === petType
    );

    const petTypeName = selectedPetType?.name.toLowerCase() || "";

    if (petTypeName.includes("hund")) return "For eksempel Golden Retriever";
    if (petTypeName.includes("katt")) return "For eksempel Maine Coon";

    return "For eksempel kanin, hamster eller marsvin";
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p>PetMate konto</p>
            <h2>Registrere nytt kjæledyr</h2>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Lukk popup"
          >
            ×
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Type kjæledyr *</label>

            {loadingPetTypes ? (
              <p>Laster dyretyper...</p>
            ) : petTypes.length === 0 ? (
              <p>Ingen dyretyper funnet. Lag først Hund, Katt osv. i admin.</p>
            ) : (
              <div className={styles.choiceGroup}>
                {petTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={
                      petType === String(type.id) ? styles.activeChoice : ""
                    }
                    onClick={() => setPetType(String(type.id))}
                  >
                    {formatPetTypeName(type.name)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="pet-breed">{getBreedLabel()}</label>

            <input
              id="pet-breed"
              type="text"
              value={breed}
              onChange={(event) => setBreed(event.target.value)}
              placeholder={getBreedPlaceholder()}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pet-name">Navn *</label>

            <input
              id="pet-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Navn"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pet-image">Legg til bilde</label>

            <input
              id="pet-image"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) =>
                setImageFile(event.target.files?.[0] || null)
              }
            />
          </div>

          <div className={styles.field}>
            <label>Kjønn</label>

            <div className={styles.choiceGroup}>
              <button
                type="button"
                className={gender === "male" ? styles.activeChoice : ""}
                onClick={() => setGender("male")}
              >
                Han
              </button>

              <button
                type="button"
                className={gender === "female" ? styles.activeChoice : ""}
                onClick={() => setGender("female")}
              >
                Hun
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Sterilisert eller ikke</label>

            <div className={styles.choiceGroup}>
              <button
                type="button"
                className={
                  sterilized === "notSterilized" ? styles.activeChoice : ""
                }
                onClick={() => setSterilized("notSterilized")}
              >
                Ikke sterilisert
              </button>

              <button
                type="button"
                className={
                  sterilized === "sterilized" ? styles.activeChoice : ""
                }
                onClick={() => setSterilized("sterilized")}
              >
                Sterilisert
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Er kjæledyret ditt:</label>

            <div className={styles.choiceGroup}>
              <button
                type="button"
                className={origin === "breeder" ? styles.activeChoice : ""}
                onClick={() => setOrigin("breeder")}
              >
                Fra oppdretter
              </button>

              <button
                type="button"
                className={origin === "adopted" ? styles.activeChoice : ""}
                onClick={() => setOrigin("adopted")}
              >
                Adoptert
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="pet-birth-date">Fødselsdato (DD.MM.ÅÅÅÅ)</label>

            <input
              id="pet-birth-date"
              type="text"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              placeholder="DD.MM.ÅÅÅÅ"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pet-description">Beskrivelse</label>

            <textarea
              id="pet-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Skriv litt om kjæledyret ditt."
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Avbryt
            </button>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving || loadingPetTypes || petTypes.length === 0}
            >
              {saving ? "Lagrer..." : "Lagre kjæledyr"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}