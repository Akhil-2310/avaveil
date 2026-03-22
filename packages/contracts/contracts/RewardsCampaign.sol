// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title RewardsCampaign
 * @notice Token-gated rewards protocol using encrypted balances and ZK identity proofs.
 * @dev Campaign creators fund a reward pool with ERC20 tokens and set eligibility criteria.
 *      Claim verification is done off-chain by a trusted backend that validates:
 *      1. eERC encrypted balance meets threshold (via ZK proof from eerc-sdk)
 *      2. Self Protocol identity meets demographic criteria (via ZK proof from self-xyz)
 *      The backend then signs an approval that this contract verifies on-chain.
 */
contract RewardsCampaign {
    using ECDSA for bytes32;

    struct Campaign {
        uint256 id;
        address creator;
        address rewardToken;        // ERC20 token used for rewards
        uint256 rewardAmount;       // Amount per user
        uint256 remainingFunds;     // Total remaining in pool
        // eERC criteria
        address eercContract;       // EncryptedERC contract address
        uint256 requiredBalance;    // Minimum encrypted token balance
        // Self Protocol demographic criteria (validated off-chain)
        uint256 minAge;             // Minimum age (0 = no requirement)
        string requiredCountry;     // ISO 3166-1 alpha-3 country code ("" = no requirement)
        string requiredGender;      // "M", "F", or "" for no requirement
        bool active;
    }

    uint256 public nextCampaignId;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    address public trustedBackendSigner;

    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        address rewardToken,
        uint256 totalFunding,
        uint256 rewardPerUser
    );
    event RewardClaimed(uint256 indexed campaignId, address indexed claimant, uint256 amount);

    constructor(address _trustedBackendSigner) {
        trustedBackendSigner = _trustedBackendSigner;
    }

    /**
     * @notice Create a new reward campaign
     * @param rewardToken ERC20 token to distribute as rewards
     * @param totalFunding Total tokens to fund the campaign pool
     * @param rewardPerUser Tokens each eligible user receives
     * @param eercContract Address of the EncryptedERC contract for balance checks
     * @param requiredBalance Minimum encrypted token balance required
     * @param minAge Minimum age requirement (0 = none)
     * @param requiredCountry Required country code (empty = none)
     * @param requiredGender Required gender (empty = none)
     */
    function createCampaign(
        address rewardToken,
        uint256 totalFunding,
        uint256 rewardPerUser,
        address eercContract,
        uint256 requiredBalance,
        uint256 minAge,
        string calldata requiredCountry,
        string calldata requiredGender
    ) external returns (uint256) {
        require(totalFunding >= rewardPerUser, "Insufficient funding");
        require(
            IERC20(rewardToken).transferFrom(msg.sender, address(this), totalFunding),
            "Funding failed"
        );

        uint256 id = nextCampaignId++;
        campaigns[id] = Campaign({
            id: id,
            creator: msg.sender,
            rewardToken: rewardToken,
            rewardAmount: rewardPerUser,
            remainingFunds: totalFunding,
            eercContract: eercContract,
            requiredBalance: requiredBalance,
            minAge: minAge,
            requiredCountry: requiredCountry,
            requiredGender: requiredGender,
            active: true
        });

        emit CampaignCreated(id, msg.sender, rewardToken, totalFunding, rewardPerUser);
        return id;
    }

    /**
     * @notice Claim reward from a campaign
     * @dev The trusted backend validates:
     *      - eERC balance meets threshold (decrypts + checks via ZK proof)
     *      - Self Protocol identity meets demographic criteria
     *      Then signs: keccak256(claimant, campaignId, "APPROVED")
     * @param campaignId The campaign to claim from
     * @param backendSignature ECDSA signature from the trusted backend
     */
    function claimReward(
        uint256 campaignId,
        bytes calldata backendSignature
    ) external {
        Campaign storage c = campaigns[campaignId];
        require(c.active, "Campaign not active");
        require(c.remainingFunds >= c.rewardAmount, "Campaign depleted");
        require(!hasClaimed[campaignId][msg.sender], "Already claimed");

        // Verify backend approval signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, campaignId, "APPROVED")
        );
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ethSignedMessageHash.recover(backendSignature);
        require(signer == trustedBackendSigner, "Invalid backend signature");

        hasClaimed[campaignId][msg.sender] = true;
        c.remainingFunds -= c.rewardAmount;

        require(
            IERC20(c.rewardToken).transfer(msg.sender, c.rewardAmount),
            "Reward transfer failed"
        );
        emit RewardClaimed(campaignId, msg.sender, c.rewardAmount);
    }

    /**
     * @notice Get campaign details
     */
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    /**
     * @notice Deactivate a campaign (creator only)
     */
    function deactivateCampaign(uint256 campaignId) external {
        Campaign storage c = campaigns[campaignId];
        require(msg.sender == c.creator, "Not creator");
        c.active = false;
        
        // Return remaining funds to creator
        if (c.remainingFunds > 0) {
            uint256 refund = c.remainingFunds;
            c.remainingFunds = 0;
            IERC20(c.rewardToken).transfer(c.creator, refund);
        }
    }
}
