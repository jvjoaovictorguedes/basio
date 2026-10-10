import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppSessionProvider } from "@/components/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Basio Studio",
  description: "Gestão de conteúdo para clientes de social media",
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
