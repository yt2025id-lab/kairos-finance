// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMToken {
    function mint(uint256 mintAmount) external returns (uint256);

    function redeem(uint256 redeemTokens) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function balanceOfUnderlying(address owner) external returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function exchangeRateStored() external view returns (uint256);

    function supplyRatePerTimestamp() external view returns (uint256);

    function underlying() external view returns (address);
}

interface IMoonwellComptroller {
    function enterMarkets(address[] calldata mTokens) external returns (uint256[] memory);

    function getAllMarkets() external view returns (address[] memory);
}
