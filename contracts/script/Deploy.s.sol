// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {KairosVault} from "../src/vault/KairosVault.sol";
import {KairosController} from "../src/controller/KairosController.sol";
import {AaveV3Strategy} from "../src/strategies/AaveV3Strategy.sol";
import {CompoundV3Strategy} from "../src/strategies/CompoundV3Strategy.sol";
import {MoonwellStrategy} from "../src/strategies/MoonwellStrategy.sol";
import {MorphoStrategy} from "../src/strategies/MorphoStrategy.sol";
import {DataTypes} from "../src/libraries/DataTypes.sol";
import {ProtocolRegistry} from "../src/libraries/ProtocolRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address forwarder = vm.envAddress("CRE_FORWARDER");
        address morphoVault = vm.envAddress("MORPHO_VAULT"); // MetaMorpho USDC vault on Base

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy core contracts
        KairosVault vault = new KairosVault(IERC20(ProtocolRegistry.USDC), deployer);
        KairosController controller =
            new KairosController(address(vault), forwarder, deployer);
        vault.setController(address(controller));

        console.log("Vault:", address(vault));
        console.log("Controller:", address(controller));

        // 2. Deploy strategy adapters
        AaveV3Strategy aaveStrategy =
            new AaveV3Strategy(ProtocolRegistry.AAVE_POOL, address(vault), deployer);
        CompoundV3Strategy compoundStrategy =
            new CompoundV3Strategy(ProtocolRegistry.COMPOUND_COMET_USDC, address(vault), deployer);
        MoonwellStrategy moonwellStrategy = new MoonwellStrategy(
            ProtocolRegistry.MOONWELL_MUSDC, ProtocolRegistry.USDC, address(vault), deployer
        );
        MorphoStrategy morphoStrategy =
            new MorphoStrategy(morphoVault, address(vault), deployer);

        console.log("AaveV3Strategy:", address(aaveStrategy));
        console.log("CompoundV3Strategy:", address(compoundStrategy));
        console.log("MoonwellStrategy:", address(moonwellStrategy));
        console.log("MorphoStrategy:", address(morphoStrategy));

        // 3. Register strategies in controller
        controller.setStrategy(DataTypes.Protocol.Aave, address(aaveStrategy));
        controller.setStrategy(DataTypes.Protocol.Compound, address(compoundStrategy));
        controller.setStrategy(DataTypes.Protocol.Moonwell, address(moonwellStrategy));
        controller.setStrategy(DataTypes.Protocol.Morpho, address(morphoStrategy));

        vm.stopBroadcast();
    }
}
