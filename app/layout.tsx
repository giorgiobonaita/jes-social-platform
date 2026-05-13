import type { Metadata } from "next";
import "./globals.css";
import OfflineScreen from "@/components/OfflineScreen";

export const metadata: Metadata = {
  metadataBase: new URL('https://jessocial.com'),
  title: "JES — Il Social delle Emozioni",
  description: "JES è il social network dedicato agli artisti e ai creativi di tutto il mondo.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "JES — Il Social delle Emozioni",
    description: "JES è il social network dedicato agli artisti e ai creativi di tutto il mondo.",
    siteName: "JES",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "JES" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <OfflineScreen />
      </body>
    </html>
  );
}
