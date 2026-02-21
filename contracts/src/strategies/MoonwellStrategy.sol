// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IStrategy} from "./IStrategy.sol";
import {IMToken} from "../interfaces/IMoonwell.sol";

/// @title MoonwellStrategy
/// @notice Strategy adapter for Moonwell lending on Base (Compound v2 fork)
contract MoonwellStrategy is IStrategy, Ownable {
    using SafeERC20 for IERC20;

    IMToken public immutable mToken;
    address public immutable underlyingAsset;
    address public vault;

    error OnlyVaultOrOwner();
    error ZeroAddress();
    error MintFailed();
    error RedeemFailed();

    modifier onlyVaultOrOwner() {
        if (msg.sender != vault && msg.sender != owner()) revert OnlyVaultOrOwner();
        _;
    }

    constructor(address mToken_, address underlying_, address vault_, address owner_)
        Ownable(owner_)
    {
        if (mToken_ == address(0) || vault_ == address(0)) revert ZeroAddress();
        mToken = IMToken(mToken_);
        underlyingAsset = underlying_;
        vault = vault_;
    }

    function deposit(address asset, uint256 amount) external onlyVaultOrOwner returns (uint256) {
        IERC20(asset).safeIncreaseAllowance(address(mToken), amount);
        uint256 result = mToken.mint(amount);
        if (result != 0) revert MintFailed();
        return amount;
    }

    function withdraw(address asset, uint256 amount, address to)
        external
        onlyVaultOrOwner
        returns (uint256)
    {
        uint256 result = mToken.redeemUnderlying(amount);
        if (result != 0) revert RedeemFailed();
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    function getBalance(address) external view returns (uint256) {
        // balance = mToken balance * exchange rate / 1e18
        uint256 mBalance = mToken.balanceOf(address(this));
        uint256 exchangeRate = mToken.exchangeRateStored();
        return (mBalance * exchangeRate) / 1e18;
    }

    function getAPY(address) external view returns (uint256) {
        uint256 ratePerTimestamp = mToken.supplyRatePerTimestamp();
        // Convert per-second rate to ray APY
        // ratePerTimestamp is scaled by 1e18
        return ratePerTimestamp * 365 days * 1e9; // scale to ray
    }

    function protocolName() external pure returns (string memory) {
        return "Moonwell";
    }
}
