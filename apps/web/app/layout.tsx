import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gnosis",
  description: "Long term memory for AI agents",
};

//TODO: remove the Suspense and move to the page level where it's needed, see https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense>
      <ClerkProvider appearance={{ baseTheme: dark }}>
        <html lang="en" className="dark">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
            <Toaster theme="dark" richColors closeButton />
          </body>
        </html>
      </ClerkProvider>
    </Suspense>
  );
}
