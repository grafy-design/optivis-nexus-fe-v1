import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nexus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-[#e7e5e7]">
      <head></head>
      <body
        className={`${inter.variable} antialiased bg-[#e7e5e7] min-w-full`}
        style={{ fontFamily: "var(--font-inter), Inter" }}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
