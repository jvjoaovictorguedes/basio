import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppSessionProvider } from "@/components/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jota Studio",
  description: "Gestão interna da Jô para todos os clientes",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
