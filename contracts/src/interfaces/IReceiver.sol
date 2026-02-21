// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Chainlink CRE IReceiver interface
/// @dev Contracts that receive reports from CRE workflows must implement this
interface IReceiver {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
