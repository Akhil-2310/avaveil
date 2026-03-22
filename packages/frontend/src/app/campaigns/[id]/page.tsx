"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { SelfQRcodeWrapper, SelfAppBuilder, type SelfApp } from "@selfxyz/qrcode";
import { useAvaVeilEERC } from "../../hooks/useAvaVeilEERC";
import { CONTRACTS, REWARDS_CAMPAIGN_ABI } from "../../lib/contracts";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SELF_SCOPE = process.env.NEXT_PUBLIC_SELF_SCOPE || "avaveil";

export default function ClaimReward({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const campaignId = BigInt(id);

  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState("");
  const [decryptionKey, setDecryptionKey] = useState<string>("");
  const [selfVerified, setSelfVerified] = useState(false);
  const [showSelfQR, setShowSelfQR] = useState(false);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [eercRegistered, setEercRegistered] = useState(false);
  const [metadata, setMetadata] = useState<{ name?: string; description?: string }>({});

  useEffect(() => {
    const saved = localStorage.getItem("avv-decryption-key");
    if (saved) setDecryptionKey(saved);

    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        if (data[Number(campaignId)]) setMetadata(data[Number(campaignId)]);
      })
      .catch((e) => console.error("Failed to load metadata", e));
  }, [campaignId]);

  const eerc = useAvaVeilEERC(decryptionKey || undefined);
  const encBalance = eerc?.useEncryptedBalance?.();

  useEffect(() => {
    if (eerc?.isRegistered) setEercRegistered(true);
  }, [eerc?.isRegistered]);

  // Read campaign
  const { data: campaign } = useReadContract({
    address: CONTRACTS.rewardsCampaign,
    abi: REWARDS_CAMPAIGN_ABI,
    functionName: "getCampaign",
    args: [campaignId],
  });

  const { data: alreadyClaimed } = useReadContract({
    address: CONTRACTS.rewardsCampaign,
    abi: REWARDS_CAMPAIGN_ABI,
    functionName: "hasClaimed",
    args: [campaignId, address ?? "0x0000000000000000000000000000000000000000"],
  });

  const {
    writeContract: claimWrite,
    data: claimTxHash,
    isPending: isClaiming,
  } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } =
    useWaitForTransactionReceipt({ hash: claimTxHash });

  const needsEerc = campaign && Number(campaign.requiredBalance) > 0;
  const needsIdentity =
    campaign &&
    (Number(campaign.minAge) > 0 || campaign.requiredCountry || campaign.requiredGender);

  // Build the Self app whenever the campaign and address are ready
  useEffect(() => {
    if (!address || !campaign || !needsIdentity) return;
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "AvaVeil",
        scope: SELF_SCOPE,
        endpoint: `${APP_URL}/api/verify-self`,
        endpointType: "staging_https",
        userId: address,
        userIdType: "hex",
        userDefinedData: id,
        disclosures: {
          ...(Number(campaign.minAge) > 0 && {
            minimumAge: Number(campaign.minAge),
          }),
          ...(campaign.requiredCountry && { nationality: true }),
          ...(campaign.requiredGender && { gender: true }),
        },
      }).build();
      setSelfApp(app);
    } catch (err) {
      console.error("Failed to build Self app:", err);
    }
  }, [address, campaign, needsIdentity, id]);

  const handleVerifySelf = () => {
    if (!selfApp) return;
    setShowSelfQR(true);
    setStatus("");
  };

  const handleSelfSuccess = () => {
    setSelfVerified(true);
    setShowSelfQR(false);
    setStatus("✓ Identity verified via Self Protocol!");
  };

  const handleSelfError = (data: { error_code?: string; reason?: string }) => {
    console.error("Self verification error:", data);
    setStatus(`Identity verification failed: ${data.reason || data.error_code || "unknown error"}`);
    setShowSelfQR(false);
  };

  const handleClaim = async () => {
    try {
      setStatus("Requesting backend approval...");
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          campaignId: Number(campaignId),
          selfVerified: needsIdentity ? selfVerified : true,
          eercBalance: encBalance?.decryptedBalance?.toString() ?? "0",
          requiredBalance: campaign?.requiredBalance?.toString() ?? "0",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setStatus(`Verification failed: ${data.error}`);
        return;
      }

      setStatus("Submitting claim transaction...");
      claimWrite({
        address: CONTRACTS.rewardsCampaign,
        abi: REWARDS_CAMPAIGN_ABI,
        functionName: "claimReward",
        args: [campaignId, data.signature as `0x${string}`],
      });
    } catch (err: unknown) {
      setStatus(`Claim failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRegisterEERC = async () => {
    try {
      setStatus("Registering with eERC protocol...");
      const result = await eerc.register();
      setDecryptionKey(result.key);
      localStorage.setItem("avv-decryption-key", result.key);
      setEercRegistered(true);
      setStatus("✓ Registered with eERC!");
    } catch (err: unknown) {
      setStatus(`Registration failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const canClaim =
    isConnected &&
    (!needsEerc || eercRegistered) &&
    (!needsIdentity || selfVerified) &&
    !alreadyClaimed;

  const isLocalhost = APP_URL.includes("localhost");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-24 font-sans">
      <div className="container mx-auto px-6 max-w-lg">
        <Link
          href="/campaigns"
          className="text-gray-500 hover:text-white transition-colors mb-8 inline-block text-sm"
        >
          &larr; Back to Campaigns
        </Link>

        <h1 className="text-3xl font-extrabold mb-2 text-white">
          {metadata.name || `Campaign #${id}`}
        </h1>
        {metadata.description && (
          <p className="text-gray-400 mb-6">{metadata.description}</p>
        )}

        {/* Campaign Info */}
        {campaign && (
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Reward per user</p>
                <p className="text-white font-bold text-lg">
                  {Number(campaign.rewardAmount) / 1e18} tokens
                </p>
              </div>
              <div>
                <p className="text-gray-500">Pool remaining</p>
                <p className="text-white font-bold text-lg">
                  {Number(campaign.remainingFunds) / 1e18} tokens
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {needsEerc && (
                <span className="px-3 py-1 text-xs rounded-full bg-red-600/10 text-red-400 border border-red-600/20 font-medium">
                  eERC Balance ≥ {campaign.requiredBalance.toString()} AVV
                </span>
              )}
              {Number(campaign.minAge) > 0 && (
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10 font-medium">
                  Age {campaign.minAge.toString()}+
                </span>
              )}
              {campaign.requiredCountry && (
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10 font-medium">
                  Country: {campaign.requiredCountry}
                </span>
              )}
              {campaign.requiredGender && (
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10 font-medium">
                  Gender: {campaign.requiredGender}
                </span>
              )}
            </div>
          </div>
        )}

        {alreadyClaimed && (
          <div className="p-4 rounded-xl bg-yellow-600/10 border border-yellow-600/20 mb-6 text-center">
            <p className="text-yellow-400 font-medium text-sm">
              You have already claimed this reward.
            </p>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {/* 1. Connect Wallet */}
          <StepCard
            number="1"
            title="Connect Wallet"
            done={isConnected}
            doneText={`Connected — ${address?.slice(0, 6)}...${address?.slice(-4)}`}
          />

          {/* 2. Register with eERC */}
          {needsEerc && (
            <StepCard
              number="2"
              title="Register with eERC Protocol"
              done={eercRegistered}
              doneText="Registered with eERC"
              actionLabel="Register (ZK Proof)"
              onAction={handleRegisterEERC}
              disabled={!isConnected}
            />
          )}

          {/* 3. Verify Identity via Self Protocol */}
          {needsIdentity && (
            <>
              <StepCard
                number={needsEerc ? "3" : "2"}
                title="Verify Identity (Self Protocol)"
                done={selfVerified}
                doneText="Identity Verified via Passport"
                actionLabel="Scan Passport with Self App"
                onAction={handleVerifySelf}
                disabled={!isConnected || !selfApp || (needsEerc && !eercRegistered)}
              />

              {/* Self QR Code panel */}
              {showSelfQR && selfApp && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  {isLocalhost && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-600/10 border border-yellow-600/20 text-xs text-yellow-400">
                      <strong>Local dev:</strong> the Self app cannot reach{" "}
                      <code className="font-mono">localhost</code>. Run{" "}
                      <code className="font-mono">ngrok http 3000</code> and set{" "}
                      <code className="font-mono">NEXT_PUBLIC_APP_URL</code> to the https URL,
                      then restart the dev server.
                    </div>
                  )}

                  <p className="text-sm text-gray-400 mb-4 text-center">
                    Open the{" "}
                    <a
                      href="https://selfxyz.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 underline"
                    >
                      Self app
                    </a>{" "}
                    on your phone and scan this QR code with your passport.
                  </p>

                  <div className="flex justify-center">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleSelfSuccess}
                      onError={handleSelfError}
                      size={240}
                      darkMode
                    />
                  </div>

                  <div className="mt-4 space-y-1 text-center text-xs text-gray-600">
                    {Number(campaign?.minAge) > 0 && (
                      <p>Minimum age {campaign!.minAge.toString()} will be verified</p>
                    )}
                    {campaign?.requiredCountry && (
                      <p>Nationality will be disclosed</p>
                    )}
                    {campaign?.requiredGender && (
                      <p>Gender will be disclosed</p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowSelfQR(false)}
                    className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {/* Encrypted Balance */}
          {needsEerc && eercRegistered && encBalance?.parsedDecryptedBalance && (
            <div className="p-4 rounded-xl bg-red-950/10 border border-red-600/10">
              <p className="text-xs text-gray-500">Your encrypted AVV balance</p>
              <p className="text-xl font-bold text-white">
                {encBalance.parsedDecryptedBalance} AVV
              </p>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={!canClaim || isClaiming || isClaimConfirming || isClaimConfirmed}
            className={`w-full mt-4 py-4 rounded-xl font-bold transition-colors ${
              canClaim && !isClaimConfirmed
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isClaiming || isClaimConfirming
              ? "⏳ Claiming..."
              : isClaimConfirmed
              ? "✓ Reward Claimed!"
              : "Submit Claim"}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-sm text-gray-400">{status}</p>
          </div>
        )}

        {isClaimConfirmed && claimTxHash && (
          <div className="mt-4 p-4 rounded-xl bg-green-600/10 border border-green-600/20 text-center">
            <p className="text-green-400 font-bold">Reward Claimed!</p>
            <p className="text-gray-500 text-xs font-mono mt-1">
              {claimTxHash.slice(0, 24)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  done,
  doneText,
  actionLabel,
  onAction,
  disabled,
}: {
  number: string;
  title: string;
  done: boolean;
  doneText?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  if (done) {
    return (
      <div className="py-4 px-5 rounded-xl bg-green-600/5 border border-green-600/15 flex items-center gap-3">
        <span className="text-green-500 font-bold">✓</span>
        <span className="text-green-400 text-sm font-medium">{doneText || title}</span>
      </div>
    );
  }

  if (onAction) {
    return (
      <button
        onClick={onAction}
        disabled={disabled}
        className={`w-full py-4 px-5 rounded-xl text-left font-medium transition-colors ${
          disabled
            ? "bg-white/[0.02] text-gray-600 border border-white/5 cursor-not-allowed"
            : "bg-white/[0.03] text-white border border-white/10 hover:border-red-600/30 hover:bg-red-600/5"
        }`}
      >
        <span className="text-gray-500 mr-2">{number}.</span>
        {actionLabel || title}
      </button>
    );
  }

  return (
    <div
      className={`py-4 px-5 rounded-xl border ${
        disabled
          ? "bg-white/[0.01] text-gray-600 border-white/5"
          : "bg-white/[0.03] text-white border-white/10"
      }`}
    >
      <span className="text-gray-500 mr-2">{number}.</span>
      {title}
    </div>
  );
}
