import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AvaVeil — Privacy-Preserving Rewards",
  description:
    "Token-gated rewards protocol using encrypted tokens and ZK proofs. Create campaigns and distribute rewards without revealing user identity or balance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#0a0a0a] text-white">
        <Providers>
          <Header />
          <main className="min-h-screen pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
