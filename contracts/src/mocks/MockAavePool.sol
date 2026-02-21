// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAaveV3Pool} from "../interfaces/IAaveV3Pool.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockAToken is MockERC20 {
    address public underlyingAsset;

    constructor(address underlying_) MockERC20("Mock aToken", "aToken", 6) {
        underlyingAsset = underlying_;
    }
}

contract MockAavePool is IAaveV3Pool {
    mapping(address => address) public aTokens;
    uint128 public mockLiquidityRate = 35000000000000000000000000; // ~3.5% APY in ray

    function setAToken(address asset, address aToken) external {
        aTokens[asset] = aToken;
    }

    function setLiquidityRate(uint128 rate) external {
        mockLiquidityRate = rate;
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external override {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        MockAToken(aTokens[asset]).mint(onBehalfOf, amount);
    }

    function withdraw(address asset, uint256 amount, address to)
        external
        override
        returns (uint256)
    {
        MockAToken(aTokens[asset]).mint(address(0), 0); // no-op, just to use aToken
        MockERC20(asset).mint(to, amount); // mint mock tokens as "withdrawal"
        return amount;
    }

    function getReserveData(address asset)
        external
        view
        override
        returns (ReserveData memory data)
    {
        data.currentLiquidityRate = mockLiquidityRate;
        data.aTokenAddress = aTokens[asset];
        return data;
    }
}
