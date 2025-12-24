// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, ebool, externalEuint8, externalEuint16} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Privacy-preserving alcohol control system
/// @author fhevm-hardhat-template
/// @notice Checks age and drink limits without revealing sensitive data to the blockchain or staff
contract AlcoholControl is ZamaEthereumConfig {
    // Constants for the alcohol control policy
    uint8 public constant LEGAL_AGE = 21;
    uint8 public constant MAX_DRINKS = 3;

    // Store last check result per user (encrypted)
    mapping(address => ebool) private lastCheckResult;

    // Events
    event EligibilityChecked(address indexed guest, uint256 timestamp);

    /// @notice Checks if a guest can get a drink based on encrypted age and drink count
    /// @param inputAge the external encrypted age value
    /// @param inputProofAge the proof for the age input
    /// @param inputDrinksSoFar the external encrypted drinks count value
    /// @param inputProofDrinks the proof for the drinks input
    /// @return encAllowed encrypted boolean indicating if alcohol is allowed
    /// @dev This function performs all checks under encryption:
    ///      1. Checks if age >= LEGAL_AGE
    ///      2. Checks if (drinksSoFar + 1) <= MAX_DRINKS
    ///      3. Returns AND of both conditions
    function checkAlcoholAllowed(
        externalEuint8 inputAge,
        bytes calldata inputProofAge,
        externalEuint8 inputDrinksSoFar,
        bytes calldata inputProofDrinks
    ) external returns (ebool) {
        // Convert external encrypted inputs to internal encrypted types
        euint8 encAge = FHE.fromExternal(inputAge, inputProofAge);
        euint8 encDrinksSoFar = FHE.fromExternal(inputDrinksSoFar, inputProofDrinks);

        // Create encrypted constant for legal age
        euint8 encLegalAge = FHE.asEuint8(LEGAL_AGE);

        // Check 1: Is the guest old enough? (age >= LEGAL_AGE)
        ebool isAdult = FHE.ge(encAge, encLegalAge);

        // Check 2: Are they within drink limit?
        // Calculate next drink count: drinksSoFar + 1
        euint8 encOne = FHE.asEuint8(1);
        euint8 nextDrinks = FHE.add(encDrinksSoFar, encOne);

        // Check if nextDrinks <= MAX_DRINKS
        euint8 encMaxDrinks = FHE.asEuint8(MAX_DRINKS);
        ebool withinLimit = FHE.le(nextDrinks, encMaxDrinks);

        // Final decision: allowed if BOTH conditions are true
        ebool encAllowed = FHE.and(isAdult, withinLimit);

        // Store the result for this user
        lastCheckResult[msg.sender] = encAllowed;

        // Grant access permissions
        FHE.allowThis(encAllowed);
        FHE.allow(encAllowed, msg.sender);

        emit EligibilityChecked(msg.sender, block.timestamp);

        return encAllowed;
    }

    /// @notice Retrieves the last check result for the caller
    /// @return The encrypted result of the last eligibility check
    function getLastCheckResult() external view returns (ebool) {
        return lastCheckResult[msg.sender];
    }

    /// @notice Simple version that takes already-encrypted inputs without proofs (for testing)
    /// @param encAge encrypted age
    /// @param encDrinksSoFar encrypted drinks count
    /// @return encAllowed encrypted boolean indicating if alcohol is allowed
    function checkAlcoholAllowedSimple(euint8 encAge, euint8 encDrinksSoFar) external returns (ebool) {
        // Create encrypted constant for legal age
        euint8 encLegalAge = FHE.asEuint8(LEGAL_AGE);

        // Check 1: Is the guest old enough? (age >= LEGAL_AGE)
        ebool isAdult = FHE.ge(encAge, encLegalAge);

        // Check 2: Are they within drink limit?
        euint8 encOne = FHE.asEuint8(1);
        euint8 nextDrinks = FHE.add(encDrinksSoFar, encOne);

        euint8 encMaxDrinks = FHE.asEuint8(MAX_DRINKS);
        ebool withinLimit = FHE.le(nextDrinks, encMaxDrinks);

        // Final decision: allowed if BOTH conditions are true
        ebool encAllowed = FHE.and(isAdult, withinLimit);

        // Store the result
        lastCheckResult[msg.sender] = encAllowed;

        // Grant access permissions
        FHE.allowThis(encAllowed);
        FHE.allow(encAllowed, msg.sender);

        emit EligibilityChecked(msg.sender, block.timestamp);

        return encAllowed;
    }
}
