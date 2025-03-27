"use client";

import "@mysten/dapp-kit/dist/index.css";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { networkConfig } from "@/config/networkConfig";
import { NETWORK_IN_USE } from "@/constants";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={NETWORK_IN_USE}
      >
        <WalletProvider autoConnect>
          <Theme>{children}</Theme>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
