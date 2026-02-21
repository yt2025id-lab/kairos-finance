// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library DataTypes {
    enum Protocol {
        Aave,
        Morpho,
        Compound,
        Moonwell
    }

    struct UserPosition {
        uint256 depositAmount;
        uint256 timeHorizon; // in seconds
        uint256 depositTimestamp;
        address activeStrategy;
        uint256 allocatedAmount;
        bool isActive;
    }

    struct Recommendation {
        address user;
        Protocol protocol;
        uint256 allocationBps; // basis points (10000 = 100%)
        uint256 expectedAPY; // basis points (450 = 4.5%)
        string reasoning;
    }

    struct ProtocolInfo {
        address strategy;
        bool isActive;
    }
}
