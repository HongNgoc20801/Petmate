"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/customers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.errors?.[0]?.message || "Login failed.");
        return;
      }

      window.dispatchEvent(new Event("petmate-auth-updated"));

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <div className={styles.introSide}>
          <p className={styles.smallTitle}>Welcome Back</p>

          <h1>Login to PetMate</h1>

          <p className={styles.description}>
            Login to continue your pet adoption journey. You can save your
            favorite pets, manage your profile, and explore more pet care
            services with PetMate.
          </p>
        </div>

        <div className={styles.formSide}>
          <div className={styles.formHeader}>
            <h2>Login account</h2>
            <p>Welcome back to PetMate</p>
          </div>

          {registered === "1" && (
            <p className={styles.success}>
              Account created successfully. Please login.
            </p>
          )}

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@petmate.com"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
              />
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkBoxRow}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <a href="#" className={styles.forgotLink}>
                Forgot password?
              </a>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login now"}
            </button>

            <p className={styles.registerText}>
              Do not have an account? <Link href="/register">Register now</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.loginPage}>
          <p>Loading login...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}