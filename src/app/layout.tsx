import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "sonner/dist/styles.css";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/constants";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Home Services Marketplace`, template: `%s · ${APP_NAME}` },
  description:
    "Book trusted local professionals for cleaning, plumbing, electrical, gardening and more.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
