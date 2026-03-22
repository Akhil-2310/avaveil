import { avalancheFuji } from "wagmi/chains";

// ============================================
// Deployed Contract Addresses (update after deployment)
// ============================================
export const CONTRACTS = {
  encryptedERC: "0x77f6A98e8eE504CdD7817F5f8C5C57E1eb7f3827" as `0x${string}`,
  registrar: "0xf40383BFeDdE46eCCa269C0811b8625BE7Dc2d7c" as `0x${string}`,
  rewardsCampaign: "0x71689A4eEe4d961fa388df88a4c6F44c1774691c" as `0x${string}`,
  rewardToken: "0x7D5d00d235197155971E3Ce8E42a7b938Eea3EF0" as `0x${string}`,
  backendSigner: "0x8b916003D0C8F1f468a720BA4Ab5EA9678bc6e61" as `0x${string}`,
};

// ============================================
// Chain Config
// ============================================
export const CHAIN = avalancheFuji;

// ============================================
// Circuit URLs for ZK proof generation
// Placed in public/circuits/ directory
// ============================================
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const CIRCUIT_URLS = {
  register: {
    wasm: `${baseUrl}/circuits/RegistrationCircuit_v2.wasm`,
    zkey: `${baseUrl}/circuits/RegistrationCircuit_v2.groth16.zkey`,
  },
  mint: {
    wasm: `${baseUrl}/circuits/MintCircuit_v2.wasm`,
    zkey: `${baseUrl}/circuits/MintCircuit_v2.groth16.zkey`,
  },
  transfer: {
    wasm: `${baseUrl}/circuits/TransferCircuit_v2.wasm`,
    zkey: `${baseUrl}/circuits/TransferCircuit_v2.groth16.zkey`,
  },
  burn: {
    wasm: `${baseUrl}/circuits/BurnCircuit_v2.wasm`,
    zkey: `${baseUrl}/circuits/BurnCircuit_v2.groth16.zkey`,
  },
  withdraw: {
    wasm: `${baseUrl}/circuits/WithdrawCircuit_v2.wasm`,
    zkey: `${baseUrl}/circuits/WithdrawCircuit_v2.groth16.zkey`,
  },
};


// ============================================
// RewardsCampaign ABI (only the functions we call)
// ============================================
export const REWARDS_CAMPAIGN_ABI = [
  {
    inputs: [
      { name: "rewardToken", type: "address" },
      { name: "totalFunding", type: "uint256" },
      { name: "rewardPerUser", type: "uint256" },
      { name: "eercContract", type: "address" },
      { name: "requiredBalance", type: "uint256" },
      { name: "minAge", type: "uint256" },
      { name: "requiredCountry", type: "string" },
      { name: "requiredGender", type: "string" },
    ],
    name: "createCampaign",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "backendSignature", type: "bytes" },
    ],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "campaignId", type: "uint256" }],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "rewardToken", type: "address" },
          { name: "rewardAmount", type: "uint256" },
          { name: "remainingFunds", type: "uint256" },
          { name: "eercContract", type: "address" },
          { name: "requiredBalance", type: "uint256" },
          { name: "minAge", type: "uint256" },
          { name: "requiredCountry", type: "string" },
          { name: "requiredGender", type: "string" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextCampaignId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    name: "hasClaimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ============================================
// Simple ERC20 ABI (for approval + balanceOf)
// ============================================
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ENCRYPTED_ERC_ABI = [
  {
    type: "function",
    name: "setAuditorPublicKey",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  }
] as const;
