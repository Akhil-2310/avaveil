# AvaVeil — Privacy-Preserving Rewards Platform on Avalanche

> Confidential airdrops, private token-gated access, and identity-verified rewards — without revealing your wallet, balance, or passport.

AvaVeil lets anyone create reward campaigns with on-chain eligibility conditions (minimum token balance, age, nationality, gender) that are verified using Zero-Knowledge Proofs. Users can claim rewards without exposing any private information — only a yes/no eligibility result is ever revealed.

---

## [Video Demo](https://www.loom.com/share/6b1b6a73e8fd4f8aa2e3623747f4699a)

## [Live Demo](https://avaveil-fw76.vercel.app/)

## How It Works

### The Problem
Traditional airdrops and reward campaigns expose:
- Wallet addresses and token balances (publicly readable on-chain)
- Personal identity when KYC is required
- Double-claiming is hard to prevent without linking identities

### The Solution
AvaVeil combines two ZK-powered primitives:

1. **Avalanche eERC (Encrypted ERC-20)** — token balances are encrypted on-chain using ElGamal encryption over the BabyJubJub curve. A user can prove they hold ≥ X tokens without revealing their actual balance.

2. **Self Protocol** — users scan their passport with the Self mobile app to generate a ZK proof of identity attributes (age, nationality, gender) without revealing the underlying document or linking their passport to their wallet.

### Claim Flow

```
User visits campaign page
        │
        ▼
[Step 1] Connect Wallet (MetaMask / any EVM wallet)
        │
        ▼
[Step 2] Register with eERC Protocol
        │  → Generates a BabyJubJub keypair
        │  → Submits ZK registration proof on-chain
        │  → Encrypted balance becomes readable by user only
        ▼
[Step 3] Scan Passport with Self App (if campaign requires identity)
        │  → Self mobile app reads passport NFC chip
        │  → Generates ZK proof of age / nationality / gender
        │  → Proof is verified by our backend (never touches a server in cleartext)
        ▼
[Step 4] Submit Claim
        │  → Backend verifies eERC balance meets threshold
        │  → Backend verifies Self Protocol proof passed campaign conditions
        │  → Backend signs an approval message with its trusted hot wallet
        │  → Smart contract verifies the signature and releases the reward
        ▼
Reward tokens sent to your wallet — eligibility never revealed
```

---

## Architecture

```
avaveil/
├── packages/
│   ├── contracts/          # Solidity smart contracts + Hardhat config
│   │   ├── contracts/
│   │   │   ├── RewardsCampaign.sol     # Core campaign logic
│   │   │   └── eerc/
│   │   │       ├── EncryptedERC.sol    # Privacy token (eERC standard)
│   │   │       ├── Registrar.sol       # ZK key registration
│   │   │       ├── auditor/            # Auditor management
│   │   │       └── verifiers/          # Groth16 ZK verifier contracts
│   │   ├── scripts/deploy.ts           # Deployment script
│   │   ├── deployments/addresses.json  # Deployed contract addresses
│   │   └── public/circuits/            # ZK circuit files for on-chain verification
│   │
│   └── frontend/           # Next.js 15 app
│       ├── src/app/
│       │   ├── campaigns/              # Campaign list + claim pages
│       │   ├── tokens/                 # Mint / manage encrypted tokens
│       │   ├── api/
│       │   │   ├── verify/             # Backend: signs claim approvals
│       │   │   └── verify-self/        # Backend: verifies Self Protocol proofs
│       │   ├── hooks/useAvaVeilEERC.ts # eERC SDK integration hook
│       │   └── lib/contracts.ts        # Contract addresses + ABIs
│       └── public/circuits/            # ZK circuit files for frontend proof generation
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Avalanche Fuji Testnet (C-Chain) |
| Privacy Tokens | Avalanche eERC SDK (`@avalabs/eerc-sdk`) |
| ZK Proving System | Groth16 (Circom circuits, snarkjs) |
| Identity Proofs | Self Protocol (`@selfxyz/qrcode`, `@selfxyz/core`) |
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Wallet | Wagmi v2, Viem v2, RainbowKit |
| Cryptography | BabyJubJub elliptic curve, ElGamal encryption, Poseidon hash |

---

## Deployed Contracts (Avalanche Fuji Testnet)

| Contract | Address |
|---|---|
| EncryptedERC | `0x77f6A98e8eE504CdD7817F5f8C5C57E1eb7f3827` |
| Registrar | `0xf40383BFeDdE46eCCa269C0811b8625BE7Dc2d7c` |
| RewardsCampaign | `0x71689A4eEe4d961fa388df88a4c6F44c1774691c` |
| Reward Token (ERC20) | `0x7D5d00d235197155971E3Ce8E42a7b938Eea3EF0` |
| Mint Verifier | `0x84f0184f0b53224B8CE9be52f25C29E980Df5CdA` |
| Burn Verifier | `0xC9934CF87dF5c9ac4cD3501A416300C0cAb0aCE6` |
| Withdraw Verifier | `0xFD09f4DA66f9e72D19715E24B0159eB4E15f5AAB` |
| Transfer Verifier | `0x49e384a45980cC9d4150AD1A1caee4f5ff1DA8d7` |
| Registration Verifier | `0x061f9C0bF9CbDfB67D8B7eBC6E275ddac7a3E61B` |
| BabyJubJub Library | `0xdB1e9B881C4A56CE1970aEfa32cCc71e0eAf7fFa` |
| Trusted Backend Signer | `0x8b916003D0C8F1f468a720BA4Ab5EA9678bc6e61` |

Network: **Avalanche Fuji** (Chain ID: 43113)  
Deployed: 2026-03-22

---

## ZK Circuits

AvaVeil uses five Groth16 circuits from the Avalanche eERC standard:

| Circuit | Purpose | WASM | zkey |
|---|---|---|---|
| Registration | Register a BabyJubJub public key | `RegistrationCircuit_v2.wasm` | `RegistrationCircuit_v2.groth16.zkey` |
| Mint | Prove encrypted mint is valid | `MintCircuit_v2.wasm` | `MintCircuit_v2.groth16.zkey` |
| Transfer | Prove encrypted transfer is valid | `TransferCircuit_v2.wasm` | `TransferCircuit_v2.groth16.zkey` |
| Burn | Prove encrypted burn is valid | `BurnCircuit_v2.wasm` | `BurnCircuit_v2.groth16.zkey` |
| Withdraw | Prove withdrawal amount | `WithdrawCircuit_v2.wasm` | `WithdrawCircuit_v2.groth16.zkey` |

Circuit files live in `packages/frontend/public/circuits/` and are served statically to the browser for client-side proof generation.

---

## Campaign Conditions

Campaign creators can set any combination of:

| Condition | Type | Example |
|---|---|---|
| Minimum eERC balance | on-chain ZK proof | Hold ≥ 100 AVV tokens |
| Minimum age | ZK passport proof | Age 18+ |
| Required nationality | ZK passport proof | ISO 3166-1 alpha-3 code e.g. `IND` |
| Required gender | ZK passport proof | `M` or `F` |

---

## Local Development

### Prerequisites
- Node.js 18+
- MetaMask with Avalanche Fuji network
- Self mobile app (for identity verification)

### Frontend

```bash
cd packages/frontend
cp .env.example .env
# Fill in .env values (see below)
npm install
npm run dev
```

### Environment Variables (`packages/frontend/.env`)

```env
# Backend hot wallet private key (signs claim approvals)
BACKEND_PRIVATE_KEY=0x<your_private_key>

# Public URL of your app (Self Protocol needs to reach this)
# For local dev: run `ngrok http 3000` and paste the https URL here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Self Protocol app identifier (must match backend)
NEXT_PUBLIC_SELF_SCOPE=avaveil

# true = accept Self mock passports (staging), false = real passports only
NEXT_PUBLIC_SELF_MOCK_PASSPORT=true
```

### Contracts

```bash
cd packages/contracts
cp .env.example .env
# Add your deployer private key to .env
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network fuji
```

### Self Protocol (Local Testing)

The Self mobile app needs to reach your `/api/verify-self` endpoint from the internet. For local dev:

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
# Copy the https URL and set it as NEXT_PUBLIC_APP_URL in .env, then restart dev server
```

---

## Use Cases

- **Confidential Airdrops** — Distribute tokens only to users who hold a minimum encrypted balance, with no public balance leakage
- **Age-Gated Rewards** — Campaigns restricted to verified adults (18+) without collecting any ID documents
- **Country-Specific Promotions** — Geographic eligibility enforced by ZK passport proofs, not IP addresses
- **Privacy-First Loyalty Programs** — Enterprise reward systems where employee wallet balances and identities stay private

---

## Security Notes

- Private keys are never stored or transmitted — only ZK proofs leave the client
- The backend signer only signs approvals after both ZK proofs are verified
- Nullifiers (via `hasClaimed` mapping) prevent double-claiming without linking identities
- Encrypted balances are auditable by a designated auditor key (set by the token owner)
- All ZK verifier contracts are deployed separately and can be audited independently

---

## License

MIT
