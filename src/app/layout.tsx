import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BalanceProvider } from "./contexts/BalanceContext";
import { ToastProvider } from "./contexts/ToastContext";
import AuthEventListener from "./components/AuthEventListener";
import SkipLink from "./components/SkipLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leave Request System",
  description: "Employee leave request management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <SkipLink />
        <ToastProvider>
          <AuthEventListener />
          <BalanceProvider>
            <div id="root" role="application" aria-label="Leave Request System">
              {children}
            </div>
          </BalanceProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
