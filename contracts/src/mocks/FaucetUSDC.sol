// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title FaucetUSDC
/// @notice Testnet mock USDC with a public faucet for hackathon judges to claim tokens
/// @dev Each wallet can claim 100 USDC per call, with a cooldown of 1 hour
contract FaucetUSDC is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 100e6; // 100 USDC
    uint256 public constant COOLDOWN = 1 hours;

    mapping(address => uint256) public lastClaimed;

    error CooldownActive(uint256 availableAt);

    constructor() ERC20("Test USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Claim 100 test USDC. Can be called once per hour per wallet.
    function faucet() external {
        if (block.timestamp < lastClaimed[msg.sender] + COOLDOWN) {
            revert CooldownActive(lastClaimed[msg.sender] + COOLDOWN);
        }
        lastClaimed[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Check seconds remaining until next claim is available
    function cooldownRemaining(address account) external view returns (uint256) {
        uint256 nextClaim = lastClaimed[account] + COOLDOWN;
        if (block.timestamp >= nextClaim) return 0;
        return nextClaim - block.timestamp;
    }
}
