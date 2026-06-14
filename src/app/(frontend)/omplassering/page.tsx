"use client";

import { type FormEvent, useEffect, useState } from "react";
import styles from "./omplassering.module.css";

type OmplasseringImage = {
  url?: string;
  filename?: string;
  alt?: string;
};

type RelationItem = {
  id: string;
  name?: string;
};

type Omplassering = {
  id: string;
  name: string;
  petType?: RelationItem | string | null;
  breed?: RelationItem | string | null;
  age: number;
  ageUnit?: "months" | "years";
  gender: string;
  personality?: string;
  description?: string;
  status?: string;
  image?: OmplasseringImage | string | null;
};

type VisitFormState = {
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  visitors: string;
  hasExperience: string;
  hasOtherPets: string;
  hasChildren: string;
  reason: string;
  extraMessage: string;
  confirmRequestOnly: boolean;
  agreeContact: boolean;
};

function getImageUrl(image: Omplassering["image"]) {
  if (!image) return "";

  if (typeof image === "string") {
    return "";
  }

  if (image.url) {
    return image.url;
  }

  if (image.filename) {
    return `/api/media/file/${image.filename}`;
  }

  return "";
}

function formatAge(age: number, ageUnit?: "months" | "years") {
  const unit = ageUnit || "years";

  if (unit === "months") {
    return age === 1 ? "1 month" : `${age} months`;
  }

  return age === 1 ? "1 year" : `${age} years`;
}

function getRelationId(value: RelationItem | string | null | undefined) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value.id;
}

function getRelationName(value: RelationItem | string | null | undefined) {
  if (!value) return "";

  if (typeof value === "string") {
    return "";
  }

  return value.name || "";
}

function formatLabel(value: string) {
  if (!value) return "";

  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getUniqueRelations(
  items: Omplassering[],
  key: "petType" | "breed"
) {
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

function getEmptyVisitForm(): VisitFormState {
  return {
    fullName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    visitors: "1",
    hasExperience: "",
    hasOtherPets: "",
    hasChildren: "",
    reason: "",
    extraMessage: "",
    confirmRequestOnly: false,
    agreeContact: false,
  };
}

export default function OmplasseringPage() {
  const [omplassering, setOmplassering] = useState<Omplassering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState("all");
  const [selectedBreed, setSelectedBreed] = useState("all");

  const [selectedPet, setSelectedPet] = useState<Omplassering | null>(null);
  const [visitForm, setVisitForm] = useState<VisitFormState>(
    getEmptyVisitForm()
  );
  const [visitMessage, setVisitMessage] = useState("");
  const [visitSubmitted, setVisitSubmitted] = useState(false);

  useEffect(() => {
    async function loadOmplassering() {
      try {
        const response = await fetch("/api/omplassering?limit=100&depth=2", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError("Could not load omplassering.");
          return;
        }

        setOmplassering(data.docs || []);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadOmplassering();
  }, []);

  const petTypeOptions = getUniqueRelations(omplassering, "petType");

  const omplasseringForSelectedType =
    selectedType === "all"
      ? omplassering
      : omplassering.filter(
          (omp) => getRelationId(omp.petType) === selectedType
        );

  const breedOptions = getUniqueRelations(
    omplasseringForSelectedType,
    "breed"
  );

  const filteredOmplassering = omplassering.filter((omp) => {
    const matchType =
      selectedType === "all" || getRelationId(omp.petType) === selectedType;

    const matchBreed =
      selectedBreed === "all" || getRelationId(omp.breed) === selectedBreed;

    return matchType && matchBreed;
  });

  function handleSelectType(typeId: string) {
    setSelectedType(typeId);
    setSelectedBreed("all");
  }

  function handleBackToAllPets() {
    setSelectedType("all");
    setSelectedBreed("all");
  }

  function openVisitForm(pet: Omplassering) {
    setSelectedPet(pet);
    setVisitForm(getEmptyVisitForm());
    setVisitMessage("");
    setVisitSubmitted(false);
  }

  function closeVisitForm() {
    setSelectedPet(null);
    setVisitMessage("");
    setVisitSubmitted(false);
  }

  function updateVisitForm(
    field: keyof VisitFormState,
    value: string | boolean
  ) {
    setVisitForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmitVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPet) return;

    if (!visitForm.confirmRequestOnly || !visitForm.agreeContact) {
      setVisitMessage("Please confirm both checkboxes before sending.");
      return;
    }

    const visitRequest = {
      id: crypto.randomUUID(),
      petId: selectedPet.id,
      petName: selectedPet.name,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...visitForm,
    };

    const currentRequests = JSON.parse(
      localStorage.getItem("petmate-visit-requests") || "[]"
    );

    localStorage.setItem(
      "petmate-visit-requests",
      JSON.stringify([...currentRequests, visitRequest])
    );

    setVisitMessage("Your visit request has been sent.");
    setVisitSubmitted(true);
  }

  const selectedTypeName =
    selectedType === "all"
      ? ""
      : petTypeOptions.find((type) => type.id === selectedType)?.name || "";

  return (
    <main className={styles.omplasseringPage}>
      <section className={styles.header}>
        <p className={styles.smallTitle}>Omplassering</p>

        <h1>Our lovely omplassering</h1>

        <p>
          Here you can see omplassering that are currently added to PetMate.
        </p>

        {selectedType === "all" ? (
          <div className={styles.filterBar}>
            <button
              type="button"
              onClick={handleBackToAllPets}
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
          <div className={styles.breedFilterBox}>
            <div className={styles.breedFilterTop}>
              <button
                type="button"
                onClick={handleBackToAllPets}
                className={styles.backButton}
              >
                ← All pets
              </button>
            </div>

            <div className={styles.filterBar}>
              <button
                type="button"
                onClick={() => setSelectedBreed("all")}
                className={`${styles.filterButton} ${
                  selectedBreed === "all" ? styles.filterButtonActive : ""
                }`}
              >
                All {formatLabel(selectedTypeName)}
              </button>

              {breedOptions.map((breed) => (
                <button
                  key={breed.id}
                  type="button"
                  onClick={() => setSelectedBreed(breed.id)}
                  className={`${styles.filterButton} ${
                    selectedBreed === breed.id ? styles.filterButtonActive : ""
                  }`}
                >
                  {formatLabel(breed.name)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {loading && <p className={styles.message}>Loading omplassering...</p>}

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && filteredOmplassering.length === 0 && (
        <section className={styles.emptyBox}>
          <h2>No omplassering yet</h2>
          <p>Please add omplassering from the Payload admin panel first.</p>
        </section>
      )}

      {!loading && !error && filteredOmplassering.length > 0 && (
        <section className={styles.omplasseringGrid}>
          {filteredOmplassering.map((omp) => {
            const imageUrl = getImageUrl(omp.image);

            const petTypeName = getRelationName(omp.petType);
            const breedName = getRelationName(omp.breed);

            const status = omp.status || "available";

            return (
              <article key={omp.id} className={styles.omplasseringCard}>
                <div className={styles.omplasseringImageWrapper}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={
                        typeof omp.image === "object" && omp.image?.alt
                          ? omp.image.alt
                          : omp.name
                      }
                      className={styles.omplasseringImage}
                    />
                  ) : (
                    <div className={styles.omplasseringPlaceholder}>🐾</div>
                  )}
                </div>

                <h2>{omp.name}</h2>

                <p className={styles.omplasseringInfo}>
                  {formatLabel(petTypeName)}
                  {breedName ? ` • ${formatLabel(breedName)}` : ""}
                  {" • "}
                  {formatAge(omp.age, omp.ageUnit)}
                  {" • "}
                  {formatLabel(omp.gender)}
                </p>

                {omp.personality && (
                  <p className={styles.personality}>{omp.personality}</p>
                )}

                {omp.description && (
                  <p className={styles.description}>{omp.description}</p>
                )}

                <div className={styles.cardActions}>
                  <span className={styles.status}>{status}</span>

                  {status !== "adopted" ? (
                    <button
                      type="button"
                      className={styles.bookButton}
                      onClick={() => openVisitForm(omp)}
                    >
                      Book a visit
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.bookButtonDisabled}
                      disabled
                    >
                      Already adopted
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedPet && (
        <div className={styles.visitOverlay} onClick={closeVisitForm}>
          <section
            className={styles.visitModal}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.visitCloseButton}
              onClick={closeVisitForm}
            >
              ×
            </button>

            <div className={styles.visitHeader}>
              <p className={styles.smallTitle}>Book a visit</p>

              <h2>Meet {selectedPet.name}</h2>

              <p>
                Fill in the form below to request a visit. This is only a visit
                request, not a confirmed adoption.
              </p>
            </div>

            {visitSubmitted ? (
              <div className={styles.visitSuccessBox}>
                <div className={styles.visitSuccessIcon}>✓</div>

                <h3>Visit request sent</h3>

                <p>
                  Your visit request for {selectedPet.name} has been sent
                  successfully. We will contact you about the visit time.
                </p>

                <button
                  type="button"
                  className={styles.submitVisitButton}
                  onClick={closeVisitForm}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {visitMessage && (
                  <p className={styles.visitMessage}>{visitMessage}</p>
                )}

                <form
                  className={styles.visitForm}
                  onSubmit={handleSubmitVisit}
                >
                  <div className={styles.formSection}>
                    <h3>Your information</h3>

                    <div className={styles.formGrid}>
                      <label>
                        Full name *
                        <input
                          type="text"
                          required
                          value={visitForm.fullName}
                          onChange={(event) =>
                            updateVisitForm("fullName", event.target.value)
                          }
                        />
                      </label>

                      <label>
                        Email *
                        <input
                          type="email"
                          required
                          value={visitForm.email}
                          onChange={(event) =>
                            updateVisitForm("email", event.target.value)
                          }
                        />
                      </label>

                      <label>
                        Phone number *
                        <input
                          type="tel"
                          required
                          value={visitForm.phone}
                          onChange={(event) =>
                            updateVisitForm("phone", event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h3>Visit details</h3>

                    <div className={styles.formGrid}>
                      <label>
                        Preferred date *
                        <input
                          type="date"
                          required
                          value={visitForm.preferredDate}
                          onChange={(event) =>
                            updateVisitForm(
                              "preferredDate",
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Preferred time *
                        <input
                          type="time"
                          required
                          value={visitForm.preferredTime}
                          onChange={(event) =>
                            updateVisitForm(
                              "preferredTime",
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Number of visitors *
                        <input
                          type="number"
                          min="1"
                          required
                          value={visitForm.visitors}
                          onChange={(event) =>
                            updateVisitForm("visitors", event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h3>About your home</h3>

                    <div className={styles.questionGroup}>
                      <p>Do you have experience with this type of pet? *</p>

                      <div className={styles.radioRow}>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="hasExperience"
                            value="yes"
                            required
                            checked={visitForm.hasExperience === "yes"}
                            onChange={(event) =>
                              updateVisitForm(
                                "hasExperience",
                                event.target.value
                              )
                            }
                          />
                          Yes
                        </label>

                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="hasExperience"
                            value="no"
                            required
                            checked={visitForm.hasExperience === "no"}
                            onChange={(event) =>
                              updateVisitForm(
                                "hasExperience",
                                event.target.value
                              )
                            }
                          />
                          No
                        </label>
                      </div>
                    </div>

                    <div className={styles.questionGroup}>
                      <p>Do you have other pets at home? *</p>

                      <div className={styles.radioRow}>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="hasOtherPets"
                            value="yes"
                            required
                            checked={visitForm.hasOtherPets === "yes"}
                            onChange={(event) =>
                              updateVisitForm(
                                "hasOtherPets",
                                event.target.value
                              )
                            }
                          />
                          Yes
                        </label>

                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="hasOtherPets"
                            value="no"
                            required
                            checked={visitForm.hasOtherPets === "no"}
                            onChange={(event) =>
                              updateVisitForm(
                                "hasOtherPets",
                                event.target.value
                              )
                            }
                          />
                          No
                        </label>
                      </div>
                    </div>

                    <div className={styles.questionGroup}>
                      <p>Do you have children at home? *</p>

                      <div className={styles.radioRow}>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="hasChildren"
                            value="yes"
                            required
                            checked={visitForm.hasChildren === "yes"}
                            onChange={(event) =>
                              updateVisitForm(
                                "hasChildren",
                                event.target.value
                              )
                            }
                          />
                          Yes
                        </label>

                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="hasChildren"
                            value="no"
                            required
                            checked={visitForm.hasChildren === "no"}
                            onChange={(event) =>
                              updateVisitForm(
                                "hasChildren",
                                event.target.value
                              )
                            }
                          />
                          No
                        </label>
                      </div>
                    </div>

                    <label className={styles.questionGroup}>
                      Why do you want to meet {selectedPet.name}? *
                      <textarea
                        required
                        rows={4}
                        value={visitForm.reason}
                        onChange={(event) =>
                          updateVisitForm("reason", event.target.value)
                        }
                      />
                    </label>

                    <label className={styles.questionGroup}>
                      Extra message or questions
                      <textarea
                        rows={3}
                        value={visitForm.extraMessage}
                        onChange={(event) =>
                          updateVisitForm("extraMessage", event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <div className={styles.confirmBox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={visitForm.confirmRequestOnly}
                        onChange={(event) =>
                          updateVisitForm(
                            "confirmRequestOnly",
                            event.target.checked
                          )
                        }
                      />
                      I understand that this is only a visit request, not a
                      confirmed adoption.
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={visitForm.agreeContact}
                        onChange={(event) =>
                          updateVisitForm("agreeContact", event.target.checked)
                        }
                      />
                      I agree to be contacted about this visit.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitVisitButton}
                  >
                    Send visit request
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}