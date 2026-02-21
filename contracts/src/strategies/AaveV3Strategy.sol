// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IStrategy} from "./IStrategy.sol";
import {IAaveV3Pool} from "../interfaces/IAaveV3Pool.sol";

/// @title AaveV3Strategy
/// @notice Strategy adapter for Aave v3 lending on Base
contract AaveV3Strategy is IStrategy, Ownable {
    using SafeERC20 for IERC20;

    IAaveV3Pool public immutable pool;
    address public vault;

    error OnlyVaultOrOwner();
    error ZeroAddress();

    modifier onlyVaultOrOwner() {
        if (msg.sender != vault && msg.sender != owner()) revert OnlyVaultOrOwner();
        _;
    }

    constructor(address pool_, address vault_, address owner_) Ownable(owner_) {
        if (pool_ == address(0) || vault_ == address(0)) revert ZeroAddress();
        pool = IAaveV3Pool(pool_);
        vault = vault_;
    }

    function deposit(address asset, uint256 amount) external onlyVaultOrOwner returns (uint256) {
        IERC20(asset).safeIncreaseAllowance(address(pool), amount);
        pool.supply(asset, amount, address(this), 0);
        return amount;
    }

    function withdraw(address asset, uint256 amount, address to)
        external
        onlyVaultOrOwner
        returns (uint256)
    {
        return pool.withdraw(asset, amount, to);
    }

    function getBalance(address asset) external view returns (uint256) {
        IAaveV3Pool.ReserveData memory data = pool.getReserveData(asset);
        return IERC20(data.aTokenAddress).balanceOf(address(this));
    }

    function getAPY(address asset) external view returns (uint256) {
        IAaveV3Pool.ReserveData memory data = pool.getReserveData(asset);
        return uint256(data.currentLiquidityRate); // ray (1e27)
    }

    function protocolName() external pure returns (string memory) {
        return "Aave V3";
    }
}
