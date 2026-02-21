// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IKairosVault} from "./IKairosVault.sol";
import {IStrategy} from "../strategies/IStrategy.sol";
import {DataTypes} from "../libraries/DataTypes.sol";

/// @title KairosVault
/// @notice ERC-4626 vault for user deposits with AI-powered yield optimization
/// @dev Users deposit USDC, request a strategy with a time horizon, and the
///      CRE workflow analyzes protocols and executes the optimal strategy
contract KairosVault is ERC4626, Ownable, IKairosVault {
    using SafeERC20 for IERC20;

    // ============ State ============

    address public controller;
    mapping(address => DataTypes.UserPosition) private _positions;
    mapping(address => bool) private _activeRequests;

    /// @notice Total amount currently deployed across all strategies
    uint256 public totalDeployed;

    /// @notice Minimum deposit amount (10 USDC)
    uint256 public constant MIN_DEPOSIT = 10e6;

    /// @notice Maximum time horizon (365 days)
    uint256 public constant MAX_TIME_HORIZON = 365 days;

    /// @notice Minimum time horizon (1 day)
    uint256 public constant MIN_TIME_HORIZON = 1 days;

    /// @notice Request timeout (24 hours) - auto-cancel if CRE doesn't respond
    uint256 public constant REQUEST_TIMEOUT = 24 hours;

    // ============ Errors ============

    error OnlyController();
    error ActiveRequestExists();
    error NoActiveRequest();
    error NoActivePosition();
    error InsufficientDeposit();
    error InvalidTimeHorizon();
    error ControllerNotSet();
    error ZeroAddress();
    error RequestNotTimedOut();

    // ============ Modifiers ============

    modifier onlyController() {
        if (msg.sender != controller) revert OnlyController();
        _;
    }

    // ============ Constructor ============

    constructor(IERC20 asset_, address owner_)
        ERC4626(asset_)
        ERC20("Kairos Yield Token", "kYLD")
        Ownable(owner_)
    {}

    // ============ Admin ============

    function setController(address controller_) external onlyOwner {
        if (controller_ == address(0)) revert ZeroAddress();
        controller = controller_;
    }

    // ============ User Actions ============

    /// @notice Request AI-powered yield optimization for deposited funds
    /// @param timeHorizon The target investment duration in seconds
    function requestStrategy(uint256 timeHorizon) external {
        if (controller == address(0)) revert ControllerNotSet();
        if (_activeRequests[msg.sender]) revert ActiveRequestExists();
        if (timeHorizon < MIN_TIME_HORIZON || timeHorizon > MAX_TIME_HORIZON) {
            revert InvalidTimeHorizon();
        }

        uint256 userBalance = convertToAssets(balanceOf(msg.sender));
        if (userBalance < MIN_DEPOSIT) revert InsufficientDeposit();

        _activeRequests[msg.sender] = true;
        _positions[msg.sender] = DataTypes.UserPosition({
            depositAmount: userBalance,
            timeHorizon: timeHorizon,
            depositTimestamp: block.timestamp,
            activeStrategy: address(0),
            allocatedAmount: 0,
            isActive: false
        });

        emit StrategyRequested(msg.sender, userBalance, timeHorizon, block.timestamp);
    }

    /// @notice Cancel a timed-out strategy request
    function cancelTimedOutRequest() external {
        if (!_activeRequests[msg.sender]) revert NoActiveRequest();
        DataTypes.UserPosition storage pos = _positions[msg.sender];
        if (block.timestamp < pos.depositTimestamp + REQUEST_TIMEOUT) {
            revert RequestNotTimedOut();
        }
        _activeRequests[msg.sender] = false;
    }

    // ============ Controller Actions ============

    /// @notice Execute a strategy recommended by the AI via CRE workflow
    /// @param user The user whose funds to deploy
    /// @param strategy The strategy adapter contract address
    /// @param amount The amount of underlying asset to deploy
    function executeStrategy(address user, address strategy, uint256 amount)
        external
        onlyController
    {
        if (!_activeRequests[user]) revert NoActiveRequest();

        DataTypes.UserPosition storage pos = _positions[user];
        pos.activeStrategy = strategy;
        pos.allocatedAmount = amount;
        pos.isActive = true;
        _activeRequests[user] = false;

        // Transfer underlying asset to strategy for deployment
        IERC20(asset()).safeTransfer(strategy, amount);
        IStrategy(strategy).deposit(asset(), amount);

        totalDeployed += amount;

        emit StrategyExecuted(user, strategy, amount);
    }

    /// @notice Called when strategy is completed (withdrawal from protocol)
    /// @param user The user whose strategy completed
    /// @param returnedAmount The amount returned from the strategy
    function completeStrategy(address user, uint256 returnedAmount) external onlyController {
        DataTypes.UserPosition storage pos = _positions[user];
        if (!pos.isActive) revert NoActivePosition();

        totalDeployed -= pos.allocatedAmount;
        pos.isActive = false;
        pos.activeStrategy = address(0);
        pos.allocatedAmount = 0;

        emit StrategyCompleted(user, returnedAmount);
    }

    // ============ View Functions ============

    function getUserPosition(address user) external view returns (DataTypes.UserPosition memory) {
        return _positions[user];
    }

    function hasActiveRequest(address user) external view returns (bool) {
        return _activeRequests[user];
    }

    /// @notice Total assets includes both idle vault balance and deployed strategy funds
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalDeployed;
    }

    // ============ ERC-4626 Overrides ============

    /// @notice Offset for inflation attack prevention (USDC has 6 decimals)
    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }
}
