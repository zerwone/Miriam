import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miriam Lab - AI Playground",
  description: "Compare, judge, and research with multiple AI models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
