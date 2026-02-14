import type { Metadata } from "next";

import "./globals.css";
import { QueryProvider } from "@/frontend/providers/query-provider";

export const metadata: Metadata = {
  title: "Mira Bakes",
  description: "Simple online ordering for fresh baked goods"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="page-bg" aria-hidden="true" />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
