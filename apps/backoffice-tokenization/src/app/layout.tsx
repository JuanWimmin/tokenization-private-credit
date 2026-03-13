import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryClientProvider } from "@tokenization/tw-blocks-shared/src/providers/ReactQueryClientProvider";
import { TrustlessWorkProvider } from "@tokenization/tw-blocks-shared/src/providers/TrustlessWork";
import { EscrowProvider } from "@tokenization/tw-blocks-shared/src/providers/EscrowProvider";
import { EscrowDialogsProvider } from "@tokenization/tw-blocks-shared/src/providers/EscrowDialogsProvider";
import { EscrowAmountProvider } from "@tokenization/tw-blocks-shared/src/providers/EscrowAmountProvider";
import { Toaster } from "@tokenization/ui/sonner";
import { WalletProvider } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Backoffice Tokenization",
  description: "Backoffice Tokenization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, "antialiased font-sans")}>
        <ReactQueryClientProvider>
          <TrustlessWorkProvider>
            <WalletProvider>
              <EscrowProvider>
                <EscrowDialogsProvider>
                  <EscrowAmountProvider>
                    {children}
                    <Toaster position="top-right" />
                  </EscrowAmountProvider>
                </EscrowDialogsProvider>
              </EscrowProvider>
            </WalletProvider>
          </TrustlessWorkProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}
