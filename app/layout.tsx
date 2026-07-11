import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
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
  title: "AETHER FLIP | Provably Fair Coin Flip Arena",
  description:
    "Pick Heads or Tails, flip the 3D coin, and double your money instantly or keep nothing. Features real-time physics, audio synthesis, and provably fair verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} font-body antialiased min-h-screen selection:bg-amber-500 selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
