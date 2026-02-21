// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IStrategy} from "./IStrategy.sol";
import {IMetaMorphoVault} from "../interfaces/IMorpho.sol";

/// @title MorphoStrategy
/// @notice Strategy adapter for MetaMorpho vault on Base
/// @dev MetaMorpho vaults are ERC-4626 compatible, making interaction straightforward
contract MorphoStrategy is IStrategy, Ownable {
    using SafeERC20 for IERC20;

    IMetaMorphoVault public immutable morphoVault;
    address public vault;

    error OnlyVaultOrOwner();
    error ZeroAddress();

    modifier onlyVaultOrOwner() {
        if (msg.sender != vault && msg.sender != owner()) revert OnlyVaultOrOwner();
        _;
    }

    constructor(address morphoVault_, address vault_, address owner_) Ownable(owner_) {
        if (morphoVault_ == address(0) || vault_ == address(0)) revert ZeroAddress();
        morphoVault = IMetaMorphoVault(morphoVault_);
        vault = vault_;
    }

    function deposit(address asset, uint256 amount) external onlyVaultOrOwner returns (uint256) {
        IERC20(asset).safeIncreaseAllowance(address(morphoVault), amount);
        morphoVault.deposit(amount, address(this));
        return amount;
    }

    function withdraw(address asset, uint256 amount, address to)
        external
        onlyVaultOrOwner
        returns (uint256)
    {
        uint256 shares = morphoVault.convertToShares(amount);
        uint256 withdrawn = morphoVault.redeem(shares, to, address(this));
        return withdrawn;
    }

    function getBalance(address) external view returns (uint256) {
        uint256 shares = morphoVault.balanceOf(address(this));
        return morphoVault.convertToAssets(shares);
    }

    function getAPY(address) external view returns (uint256) {
        // Morpho APY is fetched off-chain via the CRE workflow's HTTP call
        // to Morpho's GraphQL API. On-chain we return 0 as a placeholder.
        return 0;
    }

    function protocolName() external pure returns (string memory) {
        return "Morpho";
    }
}
