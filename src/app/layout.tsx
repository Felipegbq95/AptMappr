import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  applicationName: "AptMappr",
  title: "AptMappr — map your apartment hunt",
  description:
    "Pin every apartment listing on a map, keep notes, links and appointments in one place, and plan the most efficient day of viewings.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AptMappr",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1b6ef5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
