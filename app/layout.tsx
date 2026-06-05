import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatricMate SA",
  description: "AI study coaching, APS prediction, past-paper navigation, and bursary matching for South African CAPS learners."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
