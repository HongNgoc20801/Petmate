"use client";

import { useState, type FormEvent } from "react";
import styles from "./PetRegistrationModal.module.css";

type PetType = "dog" | "cat" | "smallAnimal";

type PetRegistrationModalProps = {
  ownerId: string;
  open: boolean;
  onClose: () => void;
  onPetCreated: (createdPetId: string | number) => void;
};

export default function PetRegistrationModal({
  ownerId,
  open,
  onClose,
  onPetCreated,
}: PetRegistrationModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [petType, setPetType] = useState<PetType>("dog");
  const [breed, setBreed] = useState("");
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gender, setGender] = useState("");
  const [sterilized, setSterilized] = useState("");
  const [origin, setOrigin] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  function resetForm() {
    setPetType("dog");
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
          owner: ownerId,
          petType,
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
    if (petType === "dog") return "Hunderase";
    if (petType === "cat") return "Katterase";

    return "Type smådyr";
  }

  function getBreedPlaceholder() {
    if (petType === "dog") return "Velg hunderase";
    if (petType === "cat") return "Velg katterase";

    return "For eksempel kanin, hamster eller marsvin";
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section className={styles.modal} onClick={(event) => event.stopPropagation()}>
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
          <div className={styles.choiceGroup}>
            <button
              type="button"
              className={petType === "dog" ? styles.activeChoice : ""}
              onClick={() => setPetType("dog")}
            >
              Hund
            </button>

            <button
              type="button"
              className={petType === "cat" ? styles.activeChoice : ""}
              onClick={() => setPetType("cat")}
            >
              Katt
            </button>

            <button
              type="button"
              className={petType === "smallAnimal" ? styles.activeChoice : ""}
              onClick={() => setPetType("smallAnimal")}
            >
              Smådyr
            </button>
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
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
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
                className={sterilized === "sterilized" ? styles.activeChoice : ""}
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
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Avbryt
            </button>

            <button type="submit" className={styles.saveButton} disabled={saving}>
              {saving ? "Lagrer..." : "Lagre kjæledyr"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
