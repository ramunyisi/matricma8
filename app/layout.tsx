import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatricSA | CAPS Learner Success Platform",
  description: "A professional CAPS learner-success platform for schools, districts, and South African Grade 10-12 learners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
