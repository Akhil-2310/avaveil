"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useWriteContract } from "wagmi";
import { useAvaVeilEERC } from "../hooks/useAvaVeilEERC";
import { CONTRACTS, ENCRYPTED_ERC_ABI } from "../lib/contracts";

export default function TokensPage() {
  const { address, isConnected } = useAccount();
  const [decryptionKey, setDecryptionKey] = useState<string>("");
  const [status, setStatus] = useState("");
  const [mintAmount, setMintAmount] = useState("100");
  const { writeContract } = useWriteContract();

  useEffect(() => {
    const saved = localStorage.getItem("avv-decryption-key");
    if (saved) setDecryptionKey(saved);
  }, []);

  const eerc = useAvaVeilEERC(decryptionKey || undefined);
  const encBalance = eerc?.useEncryptedBalance?.();

  const handleRegister = async () => {
    try {
      setStatus("Registering with eERC protocol...");
      const result = await eerc.register();
      setDecryptionKey(result.key);
      localStorage.setItem("avv-decryption-key", result.key);
      setStatus(`✓ Registered! TX: ${result.transactionHash.slice(0, 16)}...`);
    } catch (err: any) {
      setStatus(`Registration failed: ${err.message}`);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setStatus("Generating decryption key...");
      const key = await eerc.generateDecryptionKey();
      setDecryptionKey(key);
      localStorage.setItem("avv-decryption-key", key);
      setStatus("✓ Decryption key generated!");
    } catch (err: any) {
      setStatus(`Key generation failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-24 font-sans">
      <div className="container mx-auto px-6 max-w-2xl">
        <Link href="/" className="text-gray-500 hover:text-white transition-colors mb-8 inline-block text-sm">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-extrabold mb-2 text-white">
          AvaVeil Token <span className="text-red-500">(AVV)</span>
        </h1>
        <p className="text-gray-500 mb-10">
          Get test tokens to participate in campaigns. Your balance is encrypted on-chain.
        </p>
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">1. Wallet</h3>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-sm font-medium">✓ Connected</span>
                <span className="text-gray-500 text-sm font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Connect your wallet using the button in the header.</p>
            )}
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">2. eERC Registration</h3>
            {eerc?.isRegistered ? (
              <div className="space-y-3">
                <p className="text-green-500 text-sm font-medium">✓ Registered with eERC</p>
                {!eerc?.isDecryptionKeySet && (
                  <button onClick={handleGenerateKey}
                    className="w-full py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm">
                    Generate Decryption Key
                  </button>
                )}
              </div>
            ) : (
              <button onClick={handleRegister} disabled={!isConnected || !eerc?.isInitialized}
                className="w-full py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {eerc?.isInitialized ? "Register (Sign & Generate ZK Proof)" : "Initializing SDK..."}
              </button>
            )}
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">3. Encrypted Balance</h3>
            {encBalance ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-950/10 border border-red-600/10">
                  <p className="text-xs text-gray-500 mb-1">Decrypted Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {encBalance?.parsedDecryptedBalance ?? "—"}{" "}
                    <span className="text-lg text-gray-500">AVV</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <input type="number" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
                  <button
                    onClick={async () => {
                      try {
                        setStatus("Minting tokens...");
                        const result = await encBalance.privateMint(address!, BigInt(mintAmount));
                        setStatus(`✓ Minted! TX: ${result.transactionHash.slice(0, 16)}...`);
                        encBalance.refetchBalance();
                      } catch (err: any) { setStatus(`Mint failed: ${err.message}`); }
                    }}
                    disabled={!eerc?.isRegistered}
                    className="px-6 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50">
                    Mint
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Register and generate a decryption key to view your balance.</p>
            )}
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">4. System Admin</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                The EncryptedERC contract requires an Auditor Public Key to encrypt token mints. 
                The contract owner must register their account and set it as the auditor before anyone can mint.
              </p>
              <button
                onClick={() => {
                  setStatus("Setting auditor public key...");
                  writeContract({
                    address: CONTRACTS.encryptedERC as `0x${string}`,
                    abi: ENCRYPTED_ERC_ABI,
                    functionName: "setAuditorPublicKey",
                    args: [address!],
                  }, {
                    onSuccess: (hash: string) => setStatus(`✓ Auditor set! TX: ${hash}`),
                    onError: (err: any) => setStatus(`Failed to set auditor: ${err.message}`)
                  });
                }}
                disabled={!isConnected || !eerc?.isRegistered}
                className="w-full py-3 rounded-xl font-bold text-red-400 bg-red-950/20 border border-red-900/50 hover:bg-red-900/30 transition-colors disabled:opacity-50">
                Set Myself as Auditor (Owner Only)
              </button>
            </div>
          </div>
          {status && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-sm text-gray-400">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
