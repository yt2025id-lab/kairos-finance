// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library ProtocolRegistry {
    // ============ Base Mainnet (Chain ID: 8453) ============

    // Aave v3
    address constant AAVE_POOL = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;
    address constant AAVE_DATA_PROVIDER = 0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac;

    // Compound v3
    address constant COMPOUND_COMET_USDC = 0xb125E6687d4313864e53df431d5425969c15Eb2F;

    // Moonwell
    address constant MOONWELL_COMPTROLLER = 0xfBb21d0380beE3312B33c4353c8936a0F13EF26C;
    address constant MOONWELL_MUSDC = 0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22;

    // Morpho
    address constant MORPHO_BLUE = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;

    // Assets
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant WETH = 0x4200000000000000000000000000000000000006;

    // Chainlink Price Feeds (Base)
    address constant ETH_USD_FEED = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
    address constant USDC_USD_FEED = 0x7e860098F58bBFC8648a4311b374B1D669a2bc6B;
}
