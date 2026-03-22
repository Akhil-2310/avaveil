"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther } from "viem";
import {
  CONTRACTS,
  REWARDS_CAMPAIGN_ABI,
  ERC20_ABI,
} from "../../lib/contracts";

export default function CreateCampaign() {
  const { address, isConnected } = useAccount();

  const [formData, setFormData] = useState({
    name: "My Awesome Campaign",
    description: "Reward users for participating.",
    rewardToken: CONTRACTS.rewardToken,
    totalFunding: "1000",
    rewardPerUser: "50",
    eercContract: CONTRACTS.encryptedERC,
    requiredBalance: "100",
    minAge: "",
    requiredCountry: "",
    requiredGender: "",
  });
  const [step, setStep] = useState<"form" | "approving" | "creating" | "saving_metadata" | "done">("form");

  // Get current nextCampaignId so we know what ID this campaign will be
  const { data: nextId } = useReadContract({
    address: CONTRACTS.rewardsCampaign,
    abi: REWARDS_CAMPAIGN_ABI,
    functionName: "nextCampaignId",
  });

  const { writeContract: approveWrite, data: approveTxHash, isPending: isApproving } = useWriteContract();
  const { writeContract: createWrite, data: createTxHash, isPending: isCreating } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash });
  const { isLoading: isCreateConfirming, isSuccess: isCreateConfirmed } =
    useWaitForTransactionReceipt({ hash: createTxHash });

  // When creation is confirmed, save metadata
  useEffect(() => {
    if (isCreateConfirmed && step === "creating" && nextId !== undefined) {
      setStep("saving_metadata");
      const currentId = Number(nextId);
      fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentId,
          name: formData.name,
          description: formData.description,
        }),
      }).then(() => {
        setStep("done");
      }).catch(console.error);
    }
  }, [isCreateConfirmed, step, nextId, formData.name, formData.description]);

  const handleApprove = () => {
    setStep("approving");
    approveWrite({
      address: formData.rewardToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.rewardsCampaign, parseEther(formData.totalFunding)],
    });
  };

  const handleCreate = () => {
    setStep("creating");
    createWrite({
      address: CONTRACTS.rewardsCampaign,
      abi: REWARDS_CAMPAIGN_ABI,
      functionName: "createCampaign",
      args: [
        formData.rewardToken as `0x${string}`,
        parseEther(formData.totalFunding),
        parseEther(formData.rewardPerUser),
        formData.eercContract as `0x${string}`,
        BigInt(formData.requiredBalance),
        BigInt(formData.minAge || "0"),
        formData.requiredCountry,
        formData.requiredGender,
      ],
    });
  };

  const updateField = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-24 font-sans">
      <div className="container mx-auto px-6 max-w-3xl">
        <Link href="/campaigns" className="text-gray-500 hover:text-white transition-colors mb-8 inline-block text-sm">
          &larr; Back to Campaigns
        </Link>

        <h1 className="text-4xl font-extrabold mb-2 text-white">Create Campaign</h1>
        <p className="text-gray-500 mb-10">Set up reward distribution with privacy-preserving eligibility criteria.</p>

        <div className="space-y-8 bg-white/[0.02] border border-white/[0.06] p-8 rounded-2xl">
          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Campaign Info</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Campaign Name</label>
              <input type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors min-h-[80px]" />
            </div>
          </div>

          {/* Reward Token */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Reward Settings</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Reward Token Address (use AVVR)</label>
              <input
                type="text"
                value={formData.rewardToken}
                onChange={(e) => updateField("rewardToken", e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Total Funding</label>
                <input type="number" value={formData.totalFunding} onChange={(e) => updateField("totalFunding", e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Reward Per User</label>
                <input type="number" value={formData.rewardPerUser} onChange={(e) => updateField("rewardPerUser", e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* eERC Requirement */}
          <div className="p-5 rounded-xl bg-red-950/20 border border-red-600/10">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-4">🔐 eERC Token Gate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">EncryptedERC Contract</label>
                <input type="text" value={formData.eercContract} onChange={(e) => updateField("eercContract", e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Min Encrypted Balance</label>
                <input type="number" value={formData.requiredBalance} onChange={(e) => updateField("requiredBalance", e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="p-5 rounded-xl bg-white/[0.01] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">🛡️ Identity Requirements</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Min Age (Optional)</label>
                <input type="number" value={formData.minAge} onChange={(e) => updateField("minAge", e.target.value)}
                  placeholder="e.g. 18"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Country (Optional)</label>
                <input type="text" value={formData.requiredCountry} onChange={(e) => updateField("requiredCountry", e.target.value)}
                  placeholder="e.g. USA"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Gender (Optional)</label>
                <select value={formData.requiredGender} onChange={(e) => updateField("requiredGender", e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                  <option value="">Any</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isConnected ? (
            <p className="text-center text-gray-500 py-4">Connect your wallet to create a campaign.</p>
          ) : step === "form" ? (
            <button onClick={handleApprove}
              className="w-full py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors">
              Step 1 — Approve Token Spending
            </button>
          ) : step === "approving" ? (
            <div className="space-y-3">
              <div className="w-full py-4 rounded-xl font-bold text-center bg-green-600/10 text-green-400 border border-green-600/20">
                {isApproving ? "⏳ Confirming approval..." : isApproveConfirming ? "⏳ Waiting for block..." : "✓ Approved"}
              </div>
              {(isApproveConfirmed || approveTxHash) && (
                <button onClick={handleCreate}
                  className="w-full py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors">
                  Step 2 — Deploy Campaign
                </button>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              {(isCreating || isCreateConfirming) ? (
                <p className="text-yellow-400 font-medium">⏳ Deploying campaign...</p>
              ) : step === "saving_metadata" ? (
                <p className="text-yellow-400 font-medium">⏳ Saving campaign details...</p>
              ) : step === "done" ? (
                <div>
                  <p className="text-green-400 font-bold text-lg mb-1">✓ Campaign Created!</p>
                  <p className="text-gray-500 text-sm font-mono">{createTxHash?.slice(0, 20)}...</p>
                  <Link href="/campaigns" className="inline-block mt-4 px-6 py-3 rounded-xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    View All Campaigns &rarr;
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
