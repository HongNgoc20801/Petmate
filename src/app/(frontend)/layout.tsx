import type { Metadata } from "next";
import "./styles.css";
import Navbar from "./components/Navigation/Navigation";

export const metadata: Metadata = {
  title: "PetMate - Your Ultimate Pet Companion",
  description: "Find your new best friend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}