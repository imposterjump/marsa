import type { Metadata, Viewport } from "next";
import { bootScript } from "@/lib/theme";
import { fontVariables } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marsa",
  description: "Procurement Intelligence for Ports & Customs",
  applicationName: "Marsa",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efede8" },
    { media: "(prefers-color-scheme: dark)", color: "#080d12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the boot script sets class/data-* on <html> before hydration.
    <html
      lang="en"
      dir="ltr"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
