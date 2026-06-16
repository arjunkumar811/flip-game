import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Coin Flip – Pick a Side & Flip",
  description:
    "A clean, single-page Solana coin flip game. Connect wallet, pick a side, and flip!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
