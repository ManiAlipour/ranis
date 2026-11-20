import AppProvider from "@comps/providers";
import React from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html dir="rtl" lang="fa-IR">
      <body className="font-vazir">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
