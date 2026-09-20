import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NestLedger · PG owner portal",
  description: "Your properties, people and finances. One owner workspace.",
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
