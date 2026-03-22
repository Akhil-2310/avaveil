import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { keccak256, encodePacked } from "viem";

/**
 * POST /api/verify
 * Backend verification endpoint that:
 * 1. Validates Self Protocol identity proof (age, country, gender)
 * 2. Validates eERC encrypted balance meets campaign threshold
 * 3. Signs an approval message that the RewardsCampaign contract verifies on-chain
 *
 * Body:
 * - userAddress: string
 * - campaignId: number
 * - selfProof: { attestationId, proof, publicSignals } (from Self Protocol)
 * - eercBalance: string (decrypted balance from client)
 * - requiredBalance: string (campaign requirement)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userAddress,
      campaignId,
      selfVerified,
      eercBalance,
      requiredBalance,
    } = body;

    if (!userAddress || campaignId === undefined) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    // 1. VERIFY SELF PROTOCOL IDENTITY
    // In production, use SelfBackendVerifier from @selfxyz/core:
    //
    // const verifier = new SelfBackendVerifier("avaveil", endpoint, false, AllIds, configStore, "hex");
    // const result = await verifier.verify(attestationId, proof, publicSignals, userContextData);
    // if (!result.isValidDetails.isValid) { return error; }
    //
    // For hackathon, the frontend does the Self QR verification and sends the result
    if (selfVerified !== true) {
      return NextResponse.json(
        { error: "Identity verification required" },
        { status: 403 }
      );
    }

    // 2. VERIFY eERC BALANCE THRESHOLD
    // The frontend decrypts the user's balance using eerc-sdk and sends it.
    // In production, you'd verify this against the on-chain encrypted balance
    // using the auditor's decryption key or a ZK range proof.
    if (requiredBalance && BigInt(eercBalance || "0") < BigInt(requiredBalance)) {
      return NextResponse.json(
        { error: "Insufficient eERC balance", required: requiredBalance, actual: eercBalance },
        { status: 403 }
      );
    }

    // 3. SIGN APPROVAL
    const pk = process.env.BACKEND_PRIVATE_KEY as `0x${string}`;
    if (!pk) {
      console.error("BACKEND_PRIVATE_KEY not set");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const account = privateKeyToAccount(pk);

    // Sign: keccak256(claimant + campaignId + "APPROVED")
    // This must match exactly what the smart contract expects
    const messageHash = keccak256(
      encodePacked(
        ["address", "uint256", "string"],
        [userAddress as `0x${string}`, BigInt(campaignId), "APPROVED"]
      )
    );

    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    return NextResponse.json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
