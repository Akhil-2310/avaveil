"use client";

import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS, REWARDS_CAMPAIGN_ABI } from "../lib/contracts";
import { useState, useEffect } from "react";

type Campaign = {
  id: bigint;
  name?: string;
  description?: string;
  creator: string;
  rewardToken: string;
  rewardAmount: bigint;
  remainingFunds: bigint;
  eercContract: string;
  requiredBalance: bigint;
  minAge: bigint;
  requiredCountry: string;
  requiredGender: string;
  active: boolean;
};

export default function CampaignsList() {
  const [metadata, setMetadata] = useState<Record<number, { name: string, description: string }>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // 1. Fetch metadata off-chain
  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        setMetadata(data);
        setLoadingMetadata(false);
      })
      .catch((e) => {
        console.error("Failed to load metadata", e);
        setLoadingMetadata(false);
      });
  }, []);

  // 2. Read nextCampaignId to know how many to fetch
  const { data: nextId, isLoading: isIdLoading } = useReadContract({
    address: CONTRACTS.rewardsCampaign,
    abi: REWARDS_CAMPAIGN_ABI,
    functionName: "nextCampaignId",
  });

  const count = nextId !== undefined ? Number(nextId) : 0;

  // 3. Multicall all campaigns using useReadContracts
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: CONTRACTS.rewardsCampaign as `0x${string}`,
    abi: REWARDS_CAMPAIGN_ABI,
    functionName: "getCampaign",
    args: [BigInt(i)],
  }));

  const { data: results, isLoading: isCampaignsLoading } = useReadContracts({
    contracts,
    query: {
      enabled: count > 0,
    }
  });

  // Combine on-chain and off-chain data
  const campaigns: Campaign[] = [];
  if (results) {
    results.forEach((res, i) => {
      if (res.status === "success" && res.result) {
        const c = res.result as any;
        const meta = metadata[i] || { name: `Campaign #${i}`, description: "" };
        campaigns.push({
          id: BigInt(c.id),
          name: meta.name,
          description: meta.description,
          creator: c.creator,
          rewardToken: c.rewardToken,
          rewardAmount: BigInt(c.rewardAmount),
          remainingFunds: BigInt(c.remainingFunds),
          eercContract: c.eercContract,
          requiredBalance: BigInt(c.requiredBalance),
          minAge: BigInt(c.minAge),
          requiredCountry: c.requiredCountry,
          requiredGender: c.requiredGender,
          active: c.active,
        });
      }
    });
  }

  const loading = isIdLoading || (count > 0 && isCampaignsLoading) || loadingMetadata;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-24 font-sans">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Campaigns</h1>
            <p className="text-gray-500 mt-2">
              {loading
                ? "Loading..."
                : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <Link
            href="/campaigns/create"
            className="px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
          >
            + New Campaign
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse h-48"
              />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">No campaigns yet.</p>
            <Link
              href="/campaigns/create"
              className="inline-block px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
            >
              Create the first one
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <Link
                href={`/campaigns/${c.id.toString()}`}
                key={c.id.toString()}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-red-600/30 transition-all group flex flex-col h-full"
              >
                <div className="flex items-center flex-wrap gap-2 mb-4">
                  {Number(c.requiredBalance) > 0 && (
                    <span className="px-3 py-1 text-xs rounded-full bg-red-600/10 text-red-400 border border-red-600/20 font-medium">
                      eERC Gate
                    </span>
                  )}
                  {Number(c.minAge) > 0 && (
                    <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10 font-medium">
                      Age {c.minAge.toString()}+
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      c.active
                        ? "bg-green-600/10 text-green-400 border border-green-600/20"
                        : "bg-gray-600/10 text-gray-500 border border-gray-600/20"
                    }`}
                  >
                    {c.active ? "Live" : "Ended"}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1 text-white group-hover:text-red-400 transition-colors line-clamp-1">
                    {c.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {c.description || "No description provided."}
                  </p>
                </div>

                <div className="border-t border-white/[0.06] pt-4 mt-auto">
                  <p className="text-sm text-gray-400 mb-1">
                    Reward: <span className="text-white font-medium">{Number(c.rewardAmount) / 1e18} tokens</span>
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Pool: <span className="font-mono text-gray-500">{Number(c.remainingFunds) / 1e18} remaining</span>
                  </p>

                  <div className="w-full py-3 rounded-lg text-center text-sm font-semibold bg-white/5 border border-white/10 group-hover:bg-red-600/10 group-hover:border-red-600/20 transition-all">
                    View &amp; Claim &rarr;
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
