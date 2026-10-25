import type { Metadata, Viewport } from "next";
import { bootScript } from "@/lib/theme";
import { fontVariables } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Procurement Intelligence for Ports & Customs", // i18n-ignore (meta tag)
  applicationName: APP_NAME,
  // Static file, not src/app/icon.svg: a metadata icon route made the dev server rebuild and reload
  // the page on every request.
  icons: {
    icon: [
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/brand/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
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
