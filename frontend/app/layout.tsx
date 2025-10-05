import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthCare Portal",
  description: "Comprehensive health management for patients and guardians",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
