import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MY-Bank Staff Dashboard",
  description: "Internal banking operations dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
