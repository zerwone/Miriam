import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miriam Lab - One prompt. Many minds.",
  description: "Compare, judge, and research with multiple AI models in one powerful playground",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-miriam-bg">
      <body className="font-body bg-miriam-bg text-miriam-text antialiased">{children}</body>
    </html>
  );
}
