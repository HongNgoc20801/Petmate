"use client";
import { useState } from "react";
import {useRouter} from "next/navigation";
import styles from "./register.module.css";
import { Link } from "@payloadcms/ui/elements/Link";

export default function Register() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);// kiểm tra form có đang gửi không
    const router = useRouter(); // dùng để chuyển trang sau khi register thành công

    async function handleRegister(event:React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }
        setLoading(true);

        try {
            const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    role:"customer",
                }),
            });
            const data = await response.json();// lấy kết quả từ Payload API

            if (!response.ok) {
                const data = await response.json();
                setError(data?.error?.message || "Registration failed");
                return;
            }
            router.push("/login?register=1");// tạo thành công thì chuyển sang login
        } catch (error) {
            setError("An error occurred during registration");
        } finally {
            setLoading(false);
        }
    }   
    return (
        <main className={styles.registerPage}>
            <section className={styles.registerCard}>
            <div className={styles.introSide}>
                <p className={styles.smallTitle}>Create Account</p>

                <h1>Join PetMate</h1>

                <p className={styles.description}>
                Create an account to start your pet adoption journey with us!
                As a member of the PetMate community, you can browse available pets,
                save your favorites, and receive personalized recommendations.
                Join us today and find your new best friend!
                </p>
            </div>

            <div className={styles.formSide}>
                <div className={styles.formHeader}>
                <h2>Create new account</h2>
                <p>Welcome to PetMate</p>
                </div>

                <form onSubmit={handleRegister} className={styles.form}>
                <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                    <label>First Name</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="Your first name"
                    />
                    </div>

                    <div className={styles.fieldGroup}>
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Your last name"
                    />
                    </div>
                </div>

                <div className={styles.fieldGroup}>
                    <label>Email</label>
                    <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@petmate.com"
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Create password"
                    />
                    </div>

                    <div className={styles.fieldGroup}>
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repeat password"
                    />
                    </div>
                </div>

                <label className={styles.checkBoxRow}>
                    <input type="checkbox" />
                    <span>I agree to the Terms and Conditions</span>
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? "Creating account..." : "Register now"}
                </button>

                <p className={styles.loginText}>
                    Already have an account? <a href="/login">Login now</a>
                </p>
                </form>
            </div>
            </section>
        </main>
    );
}
            
