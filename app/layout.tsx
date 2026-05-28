import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es" className="dark h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
