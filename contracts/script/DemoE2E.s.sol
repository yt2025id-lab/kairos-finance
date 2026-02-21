// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {FaucetUSDC} from "../src/mocks/FaucetUSDC.sol";
import {KairosVault} from "../src/vault/KairosVault.sol";
import {KairosController} from "../src/controller/KairosController.sol";
import {DataTypes} from "../src/libraries/DataTypes.sol";

/// @title DemoE2E — End-to-End Demonstration Script
/// @notice Proves the full Kairos Finance flow on Base Sepolia:
///   1. Claim faucet USDC
///   2. Approve + deposit to vault
///   3. Request AI strategy
///   4. Simulate CRE report delivery (deployer = forwarder)
///   5. Verify active position
///   6. Withdraw from strategy
/// @dev Run: forge script script/DemoE2E.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast -vvvv
contract DemoE2E is Script {
    // --- Base Sepolia Deployed Addresses ---
    address constant FAUCET_USDC = 0xAb8a67C042a60FBD01ca769799941cF694ff57C9;
    address constant KAIROS_VAULT = 0x884d48fcBff76A48Eb52A97cE836B36AfBbDF43F;
    address constant KAIROS_CONTROLLER = 0xB2d0Fe7d2Eb85b2A2d0eD3a5cEA6A61b5F69DBcB;

    uint256 constant DEPOSIT_AMOUNT = 50e6; // 50 USDC
    uint256 constant TIME_HORIZON = 30 days;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        FaucetUSDC usdc = FaucetUSDC(FAUCET_USDC);
        KairosVault vault = KairosVault(KAIROS_VAULT);
        KairosController controller = KairosController(KAIROS_CONTROLLER);

        console.log("=== Kairos Finance E2E Demo ===");
        console.log("Deployer (user + forwarder):", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ============================================================
        // Step 1: Claim faucet USDC
        // ============================================================
        console.log("[Step 1] Claiming faucet USDC...");
        uint256 balanceBefore = usdc.balanceOf(deployer);
        usdc.faucet();
        uint256 balanceAfter = usdc.balanceOf(deployer);
        console.log("  Balance before:", balanceBefore / 1e6, "USDC");
        console.log("  Balance after: ", balanceAfter / 1e6, "USDC");
        console.log("  Claimed:       ", (balanceAfter - balanceBefore) / 1e6, "USDC");
        console.log("");

        // ============================================================
        // Step 2: Approve + Deposit to Vault
        // ============================================================
        console.log("[Step 2] Depositing to KairosVault...");
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        uint256 shares = vault.deposit(DEPOSIT_AMOUNT, deployer);
        console.log("  Deposited:", DEPOSIT_AMOUNT / 1e6, "USDC");
        console.log("  Received: ", shares / 1e6, "kYLD shares");
        console.log("  Vault total assets:", vault.totalAssets() / 1e6, "USDC");
        console.log("");

        // ============================================================
        // Step 3: Request AI Strategy
        // ============================================================
        console.log("[Step 3] Requesting AI strategy optimization...");
        vault.requestStrategy(TIME_HORIZON);
        console.log("  Time horizon:", TIME_HORIZON / 86400, "days");
        console.log("  StrategyRequested event emitted");
        console.log("  hasActiveRequest:", vault.hasActiveRequest(deployer));
        console.log("");

        // ============================================================
        // Step 4: Simulate CRE Report (deployer = forwarder on testnet)
        // ============================================================
        console.log("[Step 4] Delivering AI recommendation via onReport...");
        bytes memory report = abi.encode(
            deployer,
            uint8(DataTypes.Protocol.Aave), // protocolId = 0
            uint256(10000),                 // allocationBps = 100%
            uint256(450),                   // expectedAPY = 4.50%
            "Aave V3 offers the best risk-adjusted yield for a 30-day horizon. "
            "Current supply APY of 4.50% exceeds Compound (3.82%), Moonwell (3.45%), "
            "and Morpho (4.12%). Aave's deep liquidity ($2.1B TVL) and battle-tested "
            "security make it the optimal choice for this timeframe."
        );
        controller.onReport("", report);
        console.log("  Protocol: Aave V3 (id=0)");
        console.log("  Allocation: 100%");
        console.log("  Expected APY: 4.50%");
        console.log("  Report delivered successfully");
        console.log("");

        // ============================================================
        // Step 5: Verify Active Position
        // ============================================================
        console.log("[Step 5] Verifying position state...");
        DataTypes.UserPosition memory pos = vault.getUserPosition(deployer);
        console.log("  isActive:       ", pos.isActive);
        console.log("  depositAmount:  ", pos.depositAmount / 1e6, "USDC");
        console.log("  allocatedAmount:", pos.allocatedAmount / 1e6, "USDC");
        console.log("  activeStrategy: ", pos.activeStrategy);
        console.log("  timeHorizon:    ", pos.timeHorizon / 86400, "days");
        require(pos.isActive, "Position should be active after report delivery");
        console.log("");

        // ============================================================
        // Step 6: Withdraw from Strategy
        // ============================================================
        console.log("[Step 6] Withdrawing from strategy...");
        uint256 vaultBalanceBefore = vault.totalAssets();
        controller.withdrawFromStrategy(deployer);
        uint256 vaultBalanceAfter = vault.totalAssets();
        DataTypes.UserPosition memory posAfter = vault.getUserPosition(deployer);
        console.log("  isActive after withdraw:", posAfter.isActive);
        console.log("  Vault assets before:", vaultBalanceBefore / 1e6, "USDC");
        console.log("  Vault assets after: ", vaultBalanceAfter / 1e6, "USDC");
        require(!posAfter.isActive, "Position should be inactive after withdrawal");
        console.log("");

        vm.stopBroadcast();

        // ============================================================
        // Summary
        // ============================================================
        console.log("=== E2E Demo Complete ===");
        console.log("All 6 steps passed successfully:");
        console.log("  1. Faucet USDC claimed");
        console.log("  2. Deposited to ERC-4626 vault");
        console.log("  3. Strategy requested (CRE trigger)");
        console.log("  4. AI recommendation delivered (onReport)");
        console.log("  5. Position verified active");
        console.log("  6. Funds withdrawn from protocol");
        console.log("");
        console.log("This proves the complete Kairos Finance flow:");
        console.log("  User Deposit -> CRE Trigger -> AI Analysis -> On-chain Execution -> Withdrawal");
    }
}
