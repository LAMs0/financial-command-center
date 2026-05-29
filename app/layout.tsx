import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Financial Command Center",
    template: "%s | FCC",
  },
  description: "Tu centro de comando financiero personal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${robotoMono.variable} dark h-full`}>
      <body className={`${inter.variable} ${robotoMono.variable} h-full font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
