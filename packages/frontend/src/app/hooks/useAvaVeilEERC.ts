"use client";

import { useEERC } from "@avalabs/eerc-sdk";
import { usePublicClient, useWalletClient } from "wagmi";
import { CONTRACTS, CIRCUIT_URLS } from "../lib/contracts";

/**
 * Custom hook wrapping @avalabs/eerc-sdk useEERC with our contract/circuit config.
 * Usage: const { isRegistered, register, useEncryptedBalance, ... } = useAvaVeilEERC();
 */
export function useAvaVeilEERC(decryptionKey?: string) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const eerc = useEERC(
    publicClient as any,
    walletClient as any,
    CONTRACTS.encryptedERC,
    CIRCUIT_URLS,
    decryptionKey
  );

  return eerc;
}
