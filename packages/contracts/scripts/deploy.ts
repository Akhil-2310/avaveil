import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  // ============================================
  // 1. Deploy Groth16 Verifiers
  // ============================================
  console.log("\n--- Deploying Verifiers ---");

  const RegVerifier = await ethers.getContractFactory("RegistrationCircuitGroth16Verifier");
  const regVerifier = await RegVerifier.deploy();
  await regVerifier.waitForDeployment();
  console.log("RegistrationVerifier:", await regVerifier.getAddress());

  const MintVerifierFactory = await ethers.getContractFactory("MintCircuitGroth16Verifier");
  const mintVerifier = await MintVerifierFactory.deploy();
  await mintVerifier.waitForDeployment();
  console.log("MintVerifier:", await mintVerifier.getAddress());

  const WithdrawVerifierFactory = await ethers.getContractFactory("WithdrawCircuitGroth16Verifier");
  const withdrawVerifier = await WithdrawVerifierFactory.deploy();
  await withdrawVerifier.waitForDeployment();
  console.log("WithdrawVerifier:", await withdrawVerifier.getAddress());

  const TransferVerifierFactory = await ethers.getContractFactory("TransferCircuitGroth16Verifier");
  const transferVerifier = await TransferVerifierFactory.deploy();
  await transferVerifier.waitForDeployment();
  console.log("TransferVerifier:", await transferVerifier.getAddress());

  const BurnVerifierFactory = await ethers.getContractFactory("BurnCircuitGroth16Verifier");
  const burnVerifier = await BurnVerifierFactory.deploy();
  await burnVerifier.waitForDeployment();
  console.log("BurnVerifier:", await burnVerifier.getAddress());

  // ============================================
  // 2. Deploy BabyJubJub Library
  // ============================================
  console.log("\n--- Deploying BabyJubJub Library ---");
  const BabyJubJub = await ethers.getContractFactory("BabyJubJub");
  const babyJubJub = await BabyJubJub.deploy();
  await babyJubJub.waitForDeployment();
  const babyJubJubAddress = await babyJubJub.getAddress();
  console.log("BabyJubJub:", babyJubJubAddress);

  // ============================================
  // 3. Deploy Registrar
  // ============================================
  console.log("\n--- Deploying Registrar ---");
  const Registrar = await ethers.getContractFactory("Registrar");
  const registrar = await Registrar.deploy(await regVerifier.getAddress());
  await registrar.waitForDeployment();
  console.log("Registrar:", await registrar.getAddress());

  // ============================================
  // 4. Deploy EncryptedERC (Standalone Mode)
  // ============================================
  console.log("\n--- Deploying EncryptedERC (Standalone) ---");
  const EncryptedERC = await ethers.getContractFactory("EncryptedERC", {
    libraries: {
      "BabyJubJub": babyJubJubAddress,
    },
  });
  const encryptedERC = await EncryptedERC.deploy({
    registrar: await registrar.getAddress(),
    isConverter: false,
    name: "AvaVeil Token",
    symbol: "AVV",
    mintVerifier: await mintVerifier.getAddress(),
    withdrawVerifier: await withdrawVerifier.getAddress(),
    transferVerifier: await transferVerifier.getAddress(),
    burnVerifier: await burnVerifier.getAddress(),
    decimals: 2,
  });
  await encryptedERC.waitForDeployment();
  console.log("EncryptedERC (AVV):", await encryptedERC.getAddress());

  // ============================================
  // 5. Deploy a Simple ERC20 for Campaign Rewards
  // ============================================
  console.log("\n--- Deploying Reward Token (SimpleERC20) ---");
  const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
  const rewardToken = await SimpleERC20.deploy("AvaVeil Reward", "AVVR", 18);
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken (AVVR):", rewardTokenAddress);

  // Mint reward tokens to deployer
  const mintTx = await rewardToken.mint(deployer.address, ethers.parseEther("1000000"));
  await mintTx.wait();
  console.log("Minted 1,000,000 AVVR to deployer");

  // ============================================
  // 6. Deploy RewardsCampaign
  // ============================================
  console.log("\n--- Deploying RewardsCampaign ---");
  const backendSignerAddress = process.env.BACKEND_SIGNER_ADDRESS || deployer.address;
  const RewardsCampaign = await ethers.getContractFactory("RewardsCampaign");
  const rewardsCampaign = await RewardsCampaign.deploy(backendSignerAddress);
  await rewardsCampaign.waitForDeployment();
  console.log("RewardsCampaign:", await rewardsCampaign.getAddress());

  // ============================================
  // 7. Save deployment addresses
  // ============================================
  const addresses = {
    network: "fuji",
    deployer: deployer.address,
    registrationVerifier: await regVerifier.getAddress(),
    mintVerifier: await mintVerifier.getAddress(),
    withdrawVerifier: await withdrawVerifier.getAddress(),
    transferVerifier: await transferVerifier.getAddress(),
    burnVerifier: await burnVerifier.getAddress(),
    babyJubJub: babyJubJubAddress,
    registrar: await registrar.getAddress(),
    encryptedERC: await encryptedERC.getAddress(),
    rewardToken: rewardTokenAddress,
    rewardsCampaign: await rewardsCampaign.getAddress(),
    trustedBackendSigner: backendSignerAddress,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n=== Deployment Complete ===");
  console.table(addresses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
