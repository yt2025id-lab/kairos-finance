// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IStrategy} from "./IStrategy.sol";
import {IComet} from "../interfaces/IComet.sol";

/// @title CompoundV3Strategy
/// @notice Strategy adapter for Compound v3 (Comet) lending on Base
contract CompoundV3Strategy is IStrategy, Ownable {
    using SafeERC20 for IERC20;

    IComet public immutable comet;
    address public vault;

    error OnlyVaultOrOwner();
    error ZeroAddress();

    modifier onlyVaultOrOwner() {
        if (msg.sender != vault && msg.sender != owner()) revert OnlyVaultOrOwner();
        _;
    }

    constructor(address comet_, address vault_, address owner_) Ownable(owner_) {
        if (comet_ == address(0) || vault_ == address(0)) revert ZeroAddress();
        comet = IComet(comet_);
        vault = vault_;
    }

    function deposit(address asset, uint256 amount) external onlyVaultOrOwner returns (uint256) {
        IERC20(asset).safeIncreaseAllowance(address(comet), amount);
        comet.supply(asset, amount);
        return amount;
    }

    function withdraw(address asset, uint256 amount, address to)
        external
        onlyVaultOrOwner
        returns (uint256)
    {
        comet.withdraw(asset, amount);
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    function getBalance(address) external view returns (uint256) {
        return comet.balanceOf(address(this));
    }

    function getAPY(address) external view returns (uint256) {
        uint256 utilization = comet.getUtilization();
        uint64 supplyRate = comet.getSupplyRate(utilization);
        // Convert per-second rate to ray (1e27) APY
        // supplyRate is per second with 18 decimals
        return uint256(supplyRate) * 365 days * 1e9; // scale to ray
    }

    function protocolName() external pure returns (string memory) {
        return "Compound V3";
    }
}
