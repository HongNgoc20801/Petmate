"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./edit.module.css";

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
  avatar?: MediaImage | string | number | null;
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

function getInitials(user: CurrentUser) {
  const firstLetter = user.firstName?.charAt(0) || "";
  const lastLetter = user.lastName?.charAt(0) || "";

  if (firstLetter || lastLetter) {
    return `${firstLetter}${lastLetter}`.toUpperCase();
  }

  return user.email?.charAt(0).toUpperCase() || "U";
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

export default function EditProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

        let currentUser: CurrentUser = meData.user;

        if (userId) {
          const detailResponse = await fetch(`/api/customers/${userId}?depth=2`, {
            credentials: "include",
          });

          const detailData = await detailResponse.json();

          if (detailResponse.ok) {
            currentUser = detailData.doc || detailData;
          }
        }

        if (
          currentUser.avatar &&
          (typeof currentUser.avatar === "string" ||
            typeof currentUser.avatar === "number")
        ) {
          const media = await getMediaById(currentUser.avatar);

          if (media) {
            currentUser = {
              ...currentUser,
              avatar: media,
            };
          }
        }

        setUser(currentUser);
        setFirstName(currentUser.firstName || "");
        setLastName(currentUser.lastName || "");
        setEmail(currentUser.email || "");
        setPhone(currentUser.phone || "");
        setAddress(currentUser.address || "");
        setGender(currentUser.gender || "");
        setAvatarPreview(getAvatarUrl(currentUser.avatar));
      } catch {
        setError("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!avatarFile) return;

    const objectUrl = URL.createObjectURL(avatarFile);

    setAvatarPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  function handleAvatarChange(file: File | null) {
    setAvatarFile(file);
    setRemoveAvatar(false);

    if (!file && user) {
      setAvatarPreview(getAvatarUrl(user.avatar));
    }
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(true);
  }

  async function uploadAvatar() {
    if (!avatarFile) return null;

    const formData = new FormData();

    const altText = `${firstName} ${lastName}`.trim() || "Profile image";

    formData.append("file", avatarFile);

    formData.append(
      "_payload",
      JSON.stringify({
        alt: altText,
      })
    );

    const response = await fetch("/api/media", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Could not upload avatar.");
    }

    if (data.doc?.id) {
      return data.doc.id;
    }

    if (data.id) {
      return data.id;
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const userId = getUserId(user);

    if (!userId) {
      setError("You must be logged in to edit your profile.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);

    try {
      let avatarValue: string | number | null | undefined = undefined;

      if (avatarFile) {
        avatarValue = await uploadAvatar();
      }

      if (removeAvatar) {
        avatarValue = null;
      }

      const updateData: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        gender,
      };

      if (avatarValue !== undefined) {
        updateData.avatar = avatarValue;
      }

      const response = await fetch(`/api/customers/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Could not update profile.");
        return;
      }

      window.dispatchEvent(new Event("petmate-auth-updated"));

      setSuccessMessage("Your profile has been updated.");

      setTimeout(() => {
        router.push("/profile");
      }, 600);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong while saving your profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.editProfilePage}>
        <p className={styles.message}>Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.editProfilePage}>
        <section className={styles.emptyBox}>
          <h1>Edit profile</h1>

          <p>You need to log in before editing your profile.</p>

          <Link href="/login" className={styles.primaryButton}>
            Logg inn
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.editProfilePage}>
      <section className={styles.header}>
        <p className={styles.smallTitle}>Min profil</p>

        <h1>Edit profile</h1>

        <p>Update your personal information and profile image.</p>
      </section>

      <form className={styles.editLayout} onSubmit={handleSubmit}>
        <aside className={styles.avatarCard}>
          <div className={styles.avatarWrapper}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile preview"
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.avatarInitials}>{getInitials(user)}</div>
            )}
          </div>

          <h2>Profile image</h2>

          <p>
            Upload a new profile image or remove the current one from your
            account.
          </p>

          <label className={styles.uploadButton}>
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              title="Choose profile image"
              aria-label="Choose profile image"
              onChange={(event) =>
                handleAvatarChange(event.target.files?.[0] || null)
              }
            />
          </label>

          {(avatarPreview || avatarFile) && (
            <button
              type="button"
              className={styles.removeAvatarButton}
              onClick={handleRemoveAvatar}
            >
              Remove image
            </button>
          )}
        </aside>

        <section className={styles.formCard}>
          <h2>Personal information</h2>

          {error && <p className={styles.error}>{error}</p>}

          {successMessage && (
            <p className={styles.successMessage}>{successMessage}</p>
          )}

          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-first-name">First name *</label>

              <input
                id="profile-first-name"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="profile-last-name">Last name *</label>

              <input
                id="profile-last-name"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
              />
            </div>

            <div className={styles.fieldGroupFull}>
              <label htmlFor="profile-email">Email</label>

              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                className={styles.readOnlyInput}
                placeholder="Email"
              />

              <small>Email cannot be changed from this page.</small>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="profile-phone">Phone</label>

              <input
                id="profile-phone"
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="profile-gender">Gender</label>

              <select
                id="profile-gender"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                title="Gender"
              >
                <option value="">Not specified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.fieldGroupFull}>
              <label htmlFor="profile-address">Address</label>

              <input
                id="profile-address"
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Address"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/profile" className={styles.secondaryButton}>
              Cancel
            </Link>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}