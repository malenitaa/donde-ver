import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LocaleProvider } from "@/components/LocaleProvider";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// VERCEL_URL is each deployment's own host, which sits behind Vercel's
// Deployment Protection (302 to a login page), so link previews can't fetch
// the OG image from it. Production uses the public domain instead.
const vercelHost =
  process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dónde ver",
  description: "Buscá películas y series y encontrá al instante en cuál de tus plataformas están.",
  openGraph: {
    title: "Dónde ver",
    description: "Buscá películas y series y encontrá al instante en cuál de tus plataformas están.",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dónde ver",
    description: "Buscá películas y series y encontrá al instante en cuál de tus plataformas están.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-50">
        <LocaleProvider>
          {children}
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
