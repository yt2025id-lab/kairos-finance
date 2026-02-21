// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {KairosVault} from "./vault/KairosVault.sol";
import {KairosController} from "./controller/KairosController.sol";

/// @title KairosFactory
/// @notice Deploys and links KairosVault + KairosController pair
contract KairosFactory {
    event KairosDeployed(address vault, address controller);

    function deploy(address asset, address forwarder, address owner)
        external
        returns (address vaultAddr, address controllerAddr)
    {
        KairosVault vault = new KairosVault(IERC20(asset), owner);
        KairosController controller = new KairosController(address(vault), forwarder, owner);
        vault.setController(address(controller));

        // Transfer vault ownership to the specified owner
        vault.transferOwnership(owner);

        emit KairosDeployed(address(vault), address(controller));
        return (address(vault), address(controller));
    }
}
