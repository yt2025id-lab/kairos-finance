// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DataTypes} from "../libraries/DataTypes.sol";

interface IKairosController {
    event RecommendationReceived(
        address indexed user,
        DataTypes.Protocol protocol,
        uint256 allocationBps,
        uint256 expectedAPY,
        string reasoning
    );

    event StrategyExecuted(address indexed user, address strategy, uint256 amount);

    event UserWithdrawn(address indexed user, uint256 amount);

    function withdrawFromStrategy(address user) external;

    function getStrategy(DataTypes.Protocol protocol) external view returns (address);
}
