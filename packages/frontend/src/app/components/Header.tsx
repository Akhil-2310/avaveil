"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-white tracking-tight">
            Ava<span className="text-red-500">Veil</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="/campaigns" className="hover:text-white transition-colors">
            Campaigns
          </Link>
          <Link href="/campaigns/create" className="hover:text-white transition-colors">
            Create
          </Link>
          <Link href="/tokens" className="hover:text-white transition-colors">
            Tokens
          </Link>
        </nav>

        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus="address"
        />
      </div>
    </header>
  );
}
