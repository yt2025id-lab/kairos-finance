// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStrategy {
    /// @notice Deposit assets into the lending protocol
    /// @param asset The token address to deposit
    /// @param amount The amount to deposit
    /// @return The actual amount deposited
    function deposit(address asset, uint256 amount) external returns (uint256);

    /// @notice Withdraw assets from the lending protocol
    /// @param asset The token address to withdraw
    /// @param amount The amount to withdraw
    /// @param to The recipient address
    /// @return The actual amount withdrawn
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);

    /// @notice Get current balance of deposited assets
    /// @param asset The token address
    /// @return The current balance including accrued interest
    function getBalance(address asset) external view returns (uint256);

    /// @notice Get the current supply APY
    /// @param asset The token address
    /// @return The current APY in ray (1e27) format
    function getAPY(address asset) external view returns (uint256);

    /// @notice Get the protocol name
    /// @return The name of the lending protocol
    function protocolName() external pure returns (string memory);
}
