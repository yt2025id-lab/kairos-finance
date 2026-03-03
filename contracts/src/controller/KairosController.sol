// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IReceiver} from "../interfaces/IReceiver.sol";
import {IKairosController} from "./IKairosController.sol";
import {IKairosVault} from "../vault/IKairosVault.sol";
import {IStrategy} from "../strategies/IStrategy.sol";
import {DataTypes} from "../libraries/DataTypes.sol";

/// @title KairosController
/// @notice Receives AI recommendations from Chainlink CRE and executes yield strategies
/// @dev Implements IReceiver to accept CRE workflow reports via the Chainlink Forwarder
contract KairosController is IReceiver, IKairosController, Ownable {
    using SafeERC20 for IERC20;

    // ============ State ============

    address public vault;
    address public forwarder; // Chainlink CRE Forwarder address

    /// @notice Protocol ID => Strategy adapter address
    mapping(DataTypes.Protocol => address) public strategies;

    // ============ Errors ============

    error OnlyForwarder();
    error InvalidReport();
    error StrategyNotRegistered();
    error ZeroAddress();
    error InvalidAllocation();
    error NoActivePosition();

    // ============ Modifiers ============

    modifier onlyForwarder() {
        if (msg.sender != forwarder) revert OnlyForwarder();
        _;
    }

    // ============ Constructor ============

    constructor(address vault_, address forwarder_, address owner_) Ownable(owner_) {
        if (vault_ == address(0) || forwarder_ == address(0)) revert ZeroAddress();
        vault = vault_;
        forwarder = forwarder_;
    }

    // ============ Admin ============

    function setStrategy(DataTypes.Protocol protocol, address strategy) external onlyOwner {
        if (strategy == address(0)) revert ZeroAddress();
        strategies[protocol] = strategy;
    }

    function setForwarder(address forwarder_) external onlyOwner {
        if (forwarder_ == address(0)) revert ZeroAddress();
        forwarder = forwarder_;
    }

    // ============ CRE Receiver ============

    /// @notice Called by Chainlink CRE Forwarder to deliver AI recommendation
    /// @param metadata CRE metadata (workflow ID, DON ID, etc.)
    /// @param report ABI-encoded recommendation data
    function onReport(bytes calldata metadata, bytes calldata report) external onlyForwarder {
        // Decode the recommendation from the CRE workflow
        (
            address user,
            uint8 protocolId,
            uint256 allocationBps,
            uint256 expectedAPY,
            string memory reasoning
        ) = abi.decode(report, (address, uint8, uint256, uint256, string));

        if (user == address(0)) revert InvalidReport();
        if (allocationBps == 0 || allocationBps > 10000) revert InvalidAllocation();
        if (protocolId > uint8(type(DataTypes.Protocol).max)) revert InvalidReport();

        DataTypes.Protocol protocol = DataTypes.Protocol(protocolId);
        address strategy = strategies[protocol];
        if (strategy == address(0)) revert StrategyNotRegistered();

        emit RecommendationReceived(user, protocol, allocationBps, expectedAPY, reasoning);

        // Calculate allocation amount using safe math
        DataTypes.UserPosition memory pos = IKairosVault(vault).getUserPosition(user);
        uint256 allocateAmount = Math.mulDiv(pos.depositAmount, allocationBps, 10000, Math.Rounding.Floor);

        // Execute strategy via vault
        IKairosVault(vault).executeStrategy(user, strategy, allocateAmount);

        emit StrategyExecuted(user, strategy, allocateAmount);
    }

    // ============ User Actions ============

    /// @notice Withdraw user funds from their active strategy
    /// @param user The user to withdraw for (can be called by user or owner)
    function withdrawFromStrategy(address user) external {
        require(msg.sender == user || msg.sender == owner(), "Not authorized");

        DataTypes.UserPosition memory pos = IKairosVault(vault).getUserPosition(user);
        if (!pos.isActive) revert NoActivePosition();

        address underlyingAsset = IERC4626(vault).asset();

        // Withdraw from protocol back to vault
        uint256 withdrawn =
            IStrategy(pos.activeStrategy).withdraw(underlyingAsset, pos.allocatedAmount, vault);

        // Notify vault that strategy is complete
        IKairosVault(vault).completeStrategy(user, withdrawn);

        emit UserWithdrawn(user, withdrawn);
    }

    // ============ View ============

    function getStrategy(DataTypes.Protocol protocol) external view returns (address) {
        return strategies[protocol];
    }
}
