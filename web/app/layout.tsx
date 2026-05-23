import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Nouri",
  description: "Nutrition tracking without perfectionism.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Nouri" },
};

export const viewport: Viewport = {
  themeColor: "#1A1714",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-md px-5 py-6">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
