import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MatricSA",
  description: "AI study coaching, APS prediction, past-paper navigation, and bursary matching for South African CAPS learners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
