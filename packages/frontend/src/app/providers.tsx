"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "./lib/wagmi-config";
import { useState, type ReactNode } from "react";

const customTheme = darkTheme({
  accentColor: "#DC2626",
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
});

// Override more theme tokens for consistent red/white on dark
customTheme.colors.connectButtonBackground = "#1a1a1a";
customTheme.colors.connectButtonInnerBackground = "#262626";
customTheme.colors.modalBackground = "#111111";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
