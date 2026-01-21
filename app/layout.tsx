import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/src/css/global.css";
import ClientLayout from "@/app/clientLayout";
import { UserProvider } from "@/src/context/UserContext";
import React from "react";
import { Nunito_Sans } from 'next/font/google';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
const nunitoSans = Nunito_Sans({ subsets: ['latin'] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RocketCenter",
    template: "%s | RocketCenter"
  },
  description: "RocketCenter - Your trading companion",
  keywords: ["trading", "signals", "investment", "finance"],
  authors: [{ name: "RocketCenter Team" }],
  openGraph: {
    title: "RocketCenter",
    description: "RocketCenter - Your trading companion",
    url: "https://rocket.centernetwork.info",
    siteName: "RocketCenter",
    images: [
      {
        url: "https://rocket.centernetwork.info/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'  // 노치 디자인 대응
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={nunitoSans.className}>
        <UserProvider>
          <ClientLayout>
              <Navbar />
                <div className="root-container">
                  {children}
                </div>
              <Footer />
          </ClientLayout>
        </UserProvider>
      </body>
    </html>
  );
}