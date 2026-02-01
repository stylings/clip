import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "clip",
  description: "secure, client-side encrypted paste sharing.",
  keywords: ["paste", "encrypted", "secure", "sharing", "privacy"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
