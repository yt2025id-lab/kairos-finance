// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {FaucetUSDC} from "../src/mocks/FaucetUSDC.sol";
import {KairosVault} from "../src/vault/KairosVault.sol";
import {KairosController} from "../src/controller/KairosController.sol";
import {AaveV3Strategy} from "../src/strategies/AaveV3Strategy.sol";
import {CompoundV3Strategy} from "../src/strategies/CompoundV3Strategy.sol";
import {MoonwellStrategy} from "../src/strategies/MoonwellStrategy.sol";
import {MorphoStrategy} from "../src/strategies/MorphoStrategy.sol";
import {DataTypes} from "../src/libraries/DataTypes.sol";

/// @notice Testnet deployment script for Base Sepolia
/// @dev Deploys FaucetUSDC so hackathon judges can claim test tokens
contract DeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        // On testnet, deployer acts as forwarder for demo purposes
        address forwarder = vm.envOr("CRE_FORWARDER", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy FaucetUSDC (testnet only)
        FaucetUSDC usdc = new FaucetUSDC();
        console.log("FaucetUSDC:", address(usdc));

        // 2. Deploy core contracts using FaucetUSDC as underlying asset
        KairosVault vault = new KairosVault(IERC20(address(usdc)), deployer);
        KairosController controller =
            new KairosController(address(vault), forwarder, deployer);
        vault.setController(address(controller));

        console.log("Vault:", address(vault));
        console.log("Controller:", address(controller));

        // 3. Deploy strategy adapters
        // On testnet, strategies point to mock addresses (won't interact with real protocols)
        // For demo, we use the deployer address as a placeholder
        AaveV3Strategy aaveStrategy =
            new AaveV3Strategy(deployer, address(vault), deployer);
        CompoundV3Strategy compoundStrategy =
            new CompoundV3Strategy(deployer, address(vault), deployer);
        MoonwellStrategy moonwellStrategy =
            new MoonwellStrategy(deployer, address(usdc), address(vault), deployer);
        MorphoStrategy morphoStrategy =
            new MorphoStrategy(deployer, address(vault), deployer);

        console.log("AaveV3Strategy:", address(aaveStrategy));
        console.log("CompoundV3Strategy:", address(compoundStrategy));
        console.log("MoonwellStrategy:", address(moonwellStrategy));
        console.log("MorphoStrategy:", address(morphoStrategy));

        // 4. Register strategies
        controller.setStrategy(DataTypes.Protocol.Aave, address(aaveStrategy));
        controller.setStrategy(DataTypes.Protocol.Compound, address(compoundStrategy));
        controller.setStrategy(DataTypes.Protocol.Moonwell, address(moonwellStrategy));
        controller.setStrategy(DataTypes.Protocol.Morpho, address(morphoStrategy));

        vm.stopBroadcast();

        // Summary
        console.log("");
        console.log("=== Testnet Deployment Summary ===");
        console.log("FaucetUSDC:", address(usdc));
        console.log("KairosVault:", address(vault));
        console.log("KairosController:", address(controller));
        console.log("");
        console.log("Judges can call FaucetUSDC.faucet() to claim 100 test USDC");
    }
}
