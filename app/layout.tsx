import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/app/providers";

const inter = localFont({
  src: [
    { path: "../public/fonts/inter-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/inter-semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brief Group | Practical tools for people doing important work",
    template: "%s | Brief Group",
  },
  description:
    "Brief Group helps farming and industrial teams make sense of operations, act on useful signals, and keep people in the loop.",
  keywords: [
    "Brief Group",
    "AI infrastructure",
    "energy monitoring",
    "smart farm prediction",
    "farm intelligence",
    "automated reports",
    "computer vision inspection",
    "customer care chatbot",
    "machine inspection",
    "predictive analytics",
  ],
  openGraph: {
    title: "Brief Group",
    description:
      "Practical tools for people doing important work in farming and industry.",
    type: "website",
  },
  icons: {
    icon: "/brief-group-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white font-sans text-slate-800">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
