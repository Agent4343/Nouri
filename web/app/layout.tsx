import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nouri",
  description: "Nutrition tracking without perfectionism.",
  manifest: "/manifest.webmanifest",
  themeColor: "#1A1714",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Nouri" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-md px-5 py-6">
          <header className="flex items-center justify-between pb-6">
            <Link href="/" className="text-xl font-medium tracking-tight">
              Nouri
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/saved" className="hover:text-ink">Saved</Link>
              <Link href="/snap" className="hover:text-ink">Snap</Link>
              <Link href="/settings" className="hover:text-ink">Settings</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
