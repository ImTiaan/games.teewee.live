import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import Header from "../components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const blockScript = localFont({
  src: "./fonts/Block-Script.otf",
  variable: "--font-block-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Dailies",
  description: "A daily game of bias and perception.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${blockScript.variable} antialiased`}
      >
        <Header />
        <main className="pt-20">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
