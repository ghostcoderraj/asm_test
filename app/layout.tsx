import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans_Devanagari } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { InstallApp } from "@/components/pwa/install-app";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const source = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "STET & BPSC Music Mock Tests | Anand Sangeet Mahavidyalaya",
    template: "%s | Anand Sangeet Music Test Series",
  },
  description:
    "Prepare for STET Music and BPSC Music with mock tests, topic practice, and detailed analytics from Anand Sangeet Mahavidyalaya.",
  applicationName: "Anand Sangeet Music Test Series",
  appleWebApp: {
    capable: true,
    title: "ASM Tests",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#6f2430",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${source.variable} ${fraunces.variable} h-full antialiased`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
          {children}
          <InstallApp />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
