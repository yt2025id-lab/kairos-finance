// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DataTypes} from "../libraries/DataTypes.sol";

interface IKairosVault {
    event StrategyRequested(
        address indexed user, uint256 amount, uint256 timeHorizon, uint256 timestamp
    );
    event StrategyExecuted(address indexed user, address strategy, uint256 amount);
    event StrategyCompleted(address indexed user, uint256 returned);

    function requestStrategy(uint256 timeHorizon) external;

    function executeStrategy(address user, address strategy, uint256 amount) external;

    function completeStrategy(address user, uint256 returnedAmount) external;

    function getUserPosition(address user) external view returns (DataTypes.UserPosition memory);

    function hasActiveRequest(address user) external view returns (bool);
}
