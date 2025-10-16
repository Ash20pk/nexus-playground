import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/provider/Web3Provider";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexus Playground - Visual Intent Composer",
  description:
    "Create powerful cross-chain workflows with drag-and-drop simplicity. Like Zapier for Web3 intents.",
  metadataBase: new URL("https://nexus.playground/"),
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "16x16", type: "image/svg" },
      { url: "/favicon.svg", sizes: "32x32", type: "image/svg" },
      { url: "/favicon.svg", sizes: "96x96", type: "image/svg" },
      { url: "/favicon.svg", sizes: "any" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Nexus Playground",
    description: "Visual Intent Composer for Cross-Chain Workflows",
    siteName: "Nexus Playground",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Playground",
    description: "Visual Intent Composer for Cross-Chain Workflows",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Web3Provider>
          {children}
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  );
}
