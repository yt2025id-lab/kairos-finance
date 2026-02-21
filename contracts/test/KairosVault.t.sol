// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {KairosVault} from "../src/vault/KairosVault.sol";
import {KairosController} from "../src/controller/KairosController.sol";
import {AaveV3Strategy} from "../src/strategies/AaveV3Strategy.sol";
import {DataTypes} from "../src/libraries/DataTypes.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockAavePool, MockAToken} from "../src/mocks/MockAavePool.sol";

contract KairosVaultTest is Test {
    KairosVault public vault;
    KairosController public controller;
    AaveV3Strategy public aaveStrategy;
    MockERC20 public usdc;
    MockAavePool public mockPool;
    MockAToken public mockAToken;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public forwarder = makeAddr("forwarder");

    uint256 constant DEPOSIT_AMOUNT = 1000e6; // 1000 USDC
    uint256 constant TIME_HORIZON = 30 days;

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Deploy vault
        vault = new KairosVault(IERC20(address(usdc)), owner);

        // Deploy controller
        controller = new KairosController(address(vault), forwarder, owner);

        // Set controller on vault
        vm.prank(owner);
        vault.setController(address(controller));

        // Deploy mock Aave pool and strategy
        mockPool = new MockAavePool();
        mockAToken = new MockAToken(address(usdc));
        mockPool.setAToken(address(usdc), address(mockAToken));

        aaveStrategy = new AaveV3Strategy(address(mockPool), address(vault), owner);

        // Register strategy
        vm.prank(owner);
        controller.setStrategy(DataTypes.Protocol.Aave, address(aaveStrategy));

        // Fund users
        usdc.mint(user1, 10_000e6);
        usdc.mint(user2, 10_000e6);
    }

    // ============ Deposit Tests ============

    function test_deposit() public {
        vm.startPrank(user1);
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        uint256 shares = vault.deposit(DEPOSIT_AMOUNT, user1);
        vm.stopPrank();

        assertGt(shares, 0, "Should receive shares");
        assertEq(vault.totalAssets(), DEPOSIT_AMOUNT, "Total assets should match deposit");
        assertEq(usdc.balanceOf(address(vault)), DEPOSIT_AMOUNT, "Vault should hold USDC");
    }

    function test_depositMultipleUsers() public {
        vm.startPrank(user1);
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        vault.deposit(DEPOSIT_AMOUNT, user1);
        vm.stopPrank();

        vm.startPrank(user2);
        usdc.approve(address(vault), DEPOSIT_AMOUNT);
        vault.deposit(DEPOSIT_AMOUNT, user2);
        vm.stopPrank();

        assertEq(vault.totalAssets(), DEPOSIT_AMOUNT * 2);
    }

    // ============ Request Strategy Tests ============

    function test_requestStrategy() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        vm.prank(user1);
        vault.requestStrategy(TIME_HORIZON);

        assertTrue(vault.hasActiveRequest(user1), "Should have active request");
        DataTypes.UserPosition memory pos = vault.getUserPosition(user1);
        assertEq(pos.timeHorizon, TIME_HORIZON);
        assertEq(pos.depositAmount, DEPOSIT_AMOUNT);
    }

    function test_requestStrategy_revertIfNoDeposit() public {
        vm.prank(user1);
        vm.expectRevert(KairosVault.InsufficientDeposit.selector);
        vault.requestStrategy(TIME_HORIZON);
    }

    function test_requestStrategy_revertIfActiveRequest() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        vm.startPrank(user1);
        vault.requestStrategy(TIME_HORIZON);

        vm.expectRevert(KairosVault.ActiveRequestExists.selector);
        vault.requestStrategy(TIME_HORIZON);
        vm.stopPrank();
    }

    function test_requestStrategy_revertIfInvalidTimeHorizon() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        vm.prank(user1);
        vm.expectRevert(KairosVault.InvalidTimeHorizon.selector);
        vault.requestStrategy(0);
    }

    function test_requestStrategy_revertIfControllerNotSet() public {
        // Deploy a vault without controller
        KairosVault newVault = new KairosVault(IERC20(address(usdc)), owner);
        usdc.mint(user1, DEPOSIT_AMOUNT);

        vm.startPrank(user1);
        usdc.approve(address(newVault), DEPOSIT_AMOUNT);
        newVault.deposit(DEPOSIT_AMOUNT, user1);

        vm.expectRevert(KairosVault.ControllerNotSet.selector);
        newVault.requestStrategy(TIME_HORIZON);
        vm.stopPrank();
    }

    // ============ Execute Strategy Tests ============

    function test_executeStrategy() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        vm.prank(user1);
        vault.requestStrategy(TIME_HORIZON);

        // Simulate CRE report via forwarder
        bytes memory report = abi.encode(
            user1,
            uint8(0), // Aave
            uint256(10000), // 100% allocation
            uint256(350), // 3.5% APY
            "Aave has the best risk-adjusted APY for 30-day horizon"
        );

        vm.prank(forwarder);
        controller.onReport("", report);

        DataTypes.UserPosition memory pos = vault.getUserPosition(user1);
        assertTrue(pos.isActive, "Position should be active");
        assertEq(pos.activeStrategy, address(aaveStrategy));
        assertFalse(vault.hasActiveRequest(user1), "Active request should be cleared");
    }

    function test_executeStrategy_revertIfNotController() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        vm.prank(user1);
        vault.requestStrategy(TIME_HORIZON);

        vm.prank(user1);
        vm.expectRevert(KairosVault.OnlyController.selector);
        vault.executeStrategy(user1, address(aaveStrategy), DEPOSIT_AMOUNT);
    }

    // ============ Controller Tests ============

    function test_onReport_revertIfNotForwarder() public {
        bytes memory report = abi.encode(user1, uint8(0), uint256(10000), uint256(350), "test");

        vm.prank(user1);
        vm.expectRevert(KairosController.OnlyForwarder.selector);
        controller.onReport("", report);
    }

    function test_onReport_revertIfInvalidAllocation() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);
        vm.prank(user1);
        vault.requestStrategy(TIME_HORIZON);

        bytes memory report =
            abi.encode(user1, uint8(0), uint256(10001), uint256(350), "invalid bps");

        vm.prank(forwarder);
        vm.expectRevert(KairosController.InvalidAllocation.selector);
        controller.onReport("", report);
    }

    function test_onReport_revertIfStrategyNotRegistered() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);
        vm.prank(user1);
        vault.requestStrategy(TIME_HORIZON);

        // Protocol Morpho (3) has no strategy registered
        bytes memory report =
            abi.encode(user1, uint8(3), uint256(10000), uint256(350), "morpho is best");

        vm.prank(forwarder);
        vm.expectRevert(KairosController.StrategyNotRegistered.selector);
        controller.onReport("", report);
    }

    // ============ Cancel Timeout Tests ============

    function test_cancelTimedOutRequest() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        vm.prank(user1);
        vault.requestStrategy(TIME_HORIZON);

        // Warp past timeout
        vm.warp(block.timestamp + 25 hours);

        vm.prank(user1);
        vault.cancelTimedOutRequest();

        assertFalse(vault.hasActiveRequest(user1));
    }

    function test_cancelTimedOutRequest_revertIfNotTimedOut() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        vm.prank(user1);
        vault.requestStrategy(TIME_HORIZON);

        vm.prank(user1);
        vm.expectRevert(KairosVault.RequestNotTimedOut.selector);
        vault.cancelTimedOutRequest();
    }

    // ============ Withdraw Tests ============

    function test_withdraw() public {
        _depositAsUser(user1, DEPOSIT_AMOUNT);

        uint256 shares = vault.balanceOf(user1);
        vm.prank(user1);
        vault.redeem(shares, user1, user1);

        assertEq(usdc.balanceOf(user1), 10_000e6, "User should have full balance back");
    }

    // ============ Admin Tests ============

    function test_setController_revertIfNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        vault.setController(address(controller));
    }

    function test_setController_revertIfZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(KairosVault.ZeroAddress.selector);
        vault.setController(address(0));
    }

    // ============ Helpers ============

    function _depositAsUser(address user, uint256 amount) internal {
        vm.startPrank(user);
        usdc.approve(address(vault), amount);
        vault.deposit(amount, user);
        vm.stopPrank();
    }
}
