# Avail Nexus SDK - Comprehensive Developer Documentation

> I rewrote the documentation covering every detail from the SDK code which can be used by any developer to build using Avail Nexus SDK.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Feature 1: Initialization & Configuration](#feature-1-initialization--configuration)
6. [Feature 2: Balance Management](#feature-2-balance-management)
7. [Feature 3: Bridge Operations](#feature-3-bridge-operations)
8. [Feature 4: Transfer Operations](#feature-4-transfer-operations)
9. [Feature 5: Execute Operations](#feature-5-execute-operations)
10. [Feature 6: Bridge & Execute Operations](#feature-6-bridge--execute-operations)
11. [Feature 7: Cross-Chain Swap Operations](#feature-7-cross-chain-swap-operations)
12. [Feature 8: Allowance Management](#feature-8-allowance-management)
13. [Feature 9: Intent Management](#feature-9-intent-management)
14. [Feature 10: Event System & Progress Tracking](#feature-10-event-system--progress-tracking)
15. [Feature 11: Utilities & Helpers](#feature-11-utilities--helpers)
16. [Feature 12: React Widgets Package](#feature-12-react-widgets-package)
17. [Advanced Patterns](#advanced-patterns)
18. [Error Handling & Debugging](#error-handling--debugging)
19. [Performance Optimization](#performance-optimization)
20. [Network Architecture](#network-architecture)
21. [Security Best Practices](#security-best-practices)
22. [Migration Guides](#migration-guides)
23. [FAQ](#faq)
24. [API Reference](#api-reference)

---

## Introduction

### What is Avail Nexus SDK?

The **Avail Nexus SDK** is a comprehensive TypeScript library that provides **chain abstraction** functionality for EVM-based blockchains. It enables developers to build cross-chain applications without worrying about the underlying complexity of managing multiple chains, bridges, and token standards.

### Key Value Propositions

1. **True Chain Abstraction**: Users don't need to know which chain they're on
2. **Unified Balance View**: See all your assets across all chains in one call
3. **Automatic Routing**: SDK intelligently routes transactions across chains
4. **Direct Transfer Optimization**: Automatically uses direct transfers when possible (cheaper & faster)
5. **Smart Contract Execution**: Execute contracts on any chain with automatic bridging
6. **Token Swaps**: Swap tokens within the same chain OR across different chains seamlessly
7. **Production Ready**: Battle-tested in mainnet with real transactions

### Use Cases

- **DeFi Aggregators**: Build yield optimization platforms that work across all chains
- **Cross-Chain DEXs**: Enable trading between any token on any chain
- **Multi-Chain Wallets**: Create wallets that present a unified balance view
- **Payment Solutions**: Accept payments in any token on any chain
- **DApp Builders**: Remove chain complexity from your user experience
- **Bridge Aggregators**: Build sophisticated cross-chain routing systems

### Package Structure

The SDK consists of two main packages:

```
@avail-project/nexus-core       # Headless SDK (no React dependencies)
@avail-project/nexus-widgets    # Pre-built React components
@nexus/commons                  # Internal shared code (bundled, not published)
```

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Application                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Nexus SDK (@avail-project/nexus-core)          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Public API Layer (NexusSDK class)                   │   │
│  │  - bridge(), transfer(), execute()                   │   │
│  │  - swapWithExactIn(), swapWithExactOut()            │   │
│  │  - getUnifiedBalances(), setAllowance()              │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │  Chain Abstraction Layer (CA Base)                   │   │
│  │  - Intent creation & management                      │   │
│  │  - Source chain selection & optimization             │   │
│  │  - Fee calculation & routing                         │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │  Request Handlers                                     │   │
│  │  - EVM Handler (ERC20, Native)                       │   │
│  │  - Fuel Handler                                       │   │
│  │  - Route selection logic                             │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │  Wallet Integration Layer                            │   │
│  │  - Viem wallet client                                │   │
│  │  - Cosmos wallet (for CA backend)                    │   │
│  │  - Provider abstraction                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Ethereum   │  │   Arbitrum   │  │   Polygon    │
│     L1       │  │   Optimism   │  │     Base     │
│              │  │     etc.     │  │     etc.     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Component Responsibilities

**NexusSDK Class**
- User-facing API
- Parameter validation
- Result formatting
- Error handling & wrapping

**CA (Chain Abstraction) Base**
- Core business logic
- Intent creation
- Source optimization
- Fee calculation
- Cosmos wallet management

**ChainAbstractionAdapter**
- Bridges SDK methods to CA layer
- Execute operations
- Bridge & Execute flows
- Transaction simulation

**Request Handlers**
- Protocol-specific implementations
- EVM transaction building
- Token approval handling
- Direct transfer optimization

---

## Installation & Setup

### Prerequisites

**Required:**
- Node.js 18+ or 20+
- TypeScript 5.0+
- A wallet provider (MetaMask, Coinbase Wallet, WalletConnect, etc.)

**Peer Dependencies:**
- `react` 18+ (only for widgets)
- `react-dom` 18+ (only for widgets)
- `viem` 2.x+

### Installation Methods

#### Method 1: NPM

```bash
# Core SDK only
npm install @avail-project/nexus-core

# With React Widgets
npm install @avail-project/nexus-core @avail-project/nexus-widgets

# Install peer dependencies for widgets
npm install react react-dom viem
```

#### Method 2: Yarn

```bash
yarn add @avail-project/nexus-core
yarn add @avail-project/nexus-widgets react react-dom viem
```

#### Method 3: PNPM

```bash
pnpm add @avail-project/nexus-core
pnpm add @avail-project/nexus-widgets react react-dom viem
```

### Version Compatibility Matrix

| Package                          | Version  | React | Viem | TypeScript |
|----------------------------------|----------|-------|------|------------|
| @avail-project/nexus-core        | 0.x      | N/A   | 2.x  | 5.0+       |
| @avail-project/nexus-widgets     | 0.x      | 18+   | 2.x  | 5.0+       |

---

## Core Concepts

### Chain Abstraction

**Chain Abstraction (CA)** means users don't need to:
- Know which blockchain they're on
- Hold gas tokens on every chain
- Manually bridge assets
- Manage multiple wallets per chain

The SDK handles all of this automatically by:
1. **Unified Balance Aggregation**: Showing all assets across all chains as one balance
2. **Intelligent Routing**: Automatically selecting the best source chains for transactions
3. **Automatic Bridging**: Moving assets between chains transparently
4. **Gas Abstraction**: Deducting gas fees from the tokens being transferred

### Intents System

An **Intent** is a declaration of what you want to achieve, not how to achieve it.

```typescript
// Traditional approach (what you DON'T do with Nexus)
1. Check balance on Chain A
2. If insufficient, bridge from Chain B to Chain A
3. Wait for bridge confirmation
4. Approve token on Chain A
5. Execute transaction on Chain A

// Intent-based approach (what Nexus does)
1. Declare intent: "I want 100 USDC on Polygon"
2. SDK handles everything automatically
```

**Intent Structure:**
```typescript
interface Intent {
  destination: {
    chainID: number;          // Target chain
    amount: bigint;           // Desired amount
    tokenContract: string;    // Token address
  };
  sources: Array<{           // SDK automatically selects optimal sources
    chainID: number;
    amount: bigint;
    tokenContract: string;
  }>;
  fees: {
    protocol: string;         // Protocol fees
    solver: string;           // Solver fees
    gasSupplied: string;      // Gas costs
    caGas: string;            // Chain abstraction gas
  };
}
```

### Smart Optimizations

#### 1. Direct Transfer Optimization

When you call `transfer()`, the SDK automatically determines whether to use direct transfer or chain abstraction based on your balances.

**For ERC-20 Tokens (USDC, USDT):**

The SDK checks if you have:
- Sufficient token balance on destination chain (`amount <= balance`)
- Sufficient gas token on destination chain (`2x estimatedGas <= gasBalance`)
  - **Note**: SDK requires **2x** the estimated gas as a safety buffer (3x on Sophon)

If **both** conditions are met → Direct transfer (fast, cheap)
If **either** condition fails → Chain abstraction (bridges from other chains)

```typescript
// Example: You want to send 50 USDC to someone on Arbitrum
// Estimated gas: 0.0005 ETH (SDK needs 0.001 ETH as 2x buffer)

// Scenario 1: You have 100 USDC + 0.002 ETH on Arbitrum
//   → SDK uses direct transfer (1 transaction, ~5 seconds)

// Scenario 2: You have 100 USDC + 0.0008 ETH on Arbitrum
//   → Insufficient gas! SDK uses chain abstraction

// Scenario 3: You only have 50 USDC on Optimism
//   → SDK uses chain abstraction (bridges + transfers, ~30 seconds)
```

**For Native Tokens (ETH, MATIC, AVAX, etc.):**

The SDK checks if you have:
- Sufficient native token to cover **both** transfer amount **and** gas fees
- Check: `(transferAmount + 2x estimatedGas) <= balance`

Since the gas token IS the token being transferred, they're checked together.

```typescript
// Example: You want to send 0.1 ETH on Ethereum
// Estimated gas: 0.0001 ETH (SDK needs 0.0002 ETH as 2x buffer)

// Scenario 1: You have 0.15 ETH on Ethereum
//   → 0.1 + 0.0002 = 0.1002 <= 0.15 ✓
//   → SDK uses direct transfer

// Scenario 2: You have 0.105 ETH on Ethereum  
//   → 0.1 + 0.0002 = 0.1002 <= 0.105 ✓
//   → SDK uses direct transfer

// Scenario 3: You have 0.1001 ETH on Ethereum
//   → 0.1 + 0.0002 = 0.1002 > 0.1001 ✗
//   → Insufficient for transfer + gas! SDK uses chain abstraction
```

#### 2. Bridge Skip Optimization

When you call `bridgeAndExecute()`, the SDK checks if you have sufficient balance on the destination chain.

If yes, it skips the bridge step entirely and just executes the contract.

```typescript
// You want to supply 100 USDC to Aave on Ethereum
// If you already have 100 USDC + gas on Ethereum:
//   → SDK skips bridge, directly executes Aave supply
// If you only have USDC on other chains:
//   → SDK bridges first, then executes
```

#### 3. Source Chain Selection

The SDK automatically selects optimal source chains based on:
- **Balance availability**: Chains with sufficient balance
- **Fee efficiency**: Lowest total fees (bridge + gas)
- **Liquidity**: Solver availability for the route
- **Speed**: Expected confirmation time

You can override this with the `sourceChains` parameter.

### Supported Networks

**Mainnet Chains (11):**
- Ethereum (1)
- Optimism (10)
- Polygon (137)
- Arbitrum (42161)
- Avalanche (43114)
- Base (8453)
- Scroll (534352)
- Sophon (50104)
- Kaia (8217)
- BNB Chain (56)
- HyperEVM (999)

**Testnet Chains (6):**
- Sepolia (11155111)
- Optimism Sepolia (11155420)
- Polygon Amoy (80002)
- Arbitrum Sepolia (421614)
- Base Sepolia (84532)
- Monad Testnet (10143)

**Supported Tokens:**
- **ETH**: Native on all EVM chains
- **USDC**: 6 decimals, on all chains
- **USDT**: 6 decimals, on all chains

---

## Feature 1: Initialization & Configuration

### Overview

Before using any SDK functionality, you must:
1. Create an SDK instance
2. Initialize it with a wallet provider

The initialization process:
- Connects to your user's wallet
- Creates internal wallets for chain abstraction
- Sets up event listeners
- Validates network configuration

### Basic Initialization

```typescript
import { NexusSDK } from '@avail-project/nexus-core';

// 1. Create SDK instance
const sdk = new NexusSDK({ 
  network: 'mainnet',  // or 'testnet'
  debug: false         // Set true for verbose logging
});

// 2. Initialize with provider
await sdk.initialize(window.ethereum); // MetaMask or any EIP-1193 provider

// 3. SDK is now ready to use
const balances = await sdk.getUnifiedBalances();
```

### Configuration Options

```typescript
interface SDKConfig {
  network?: 'mainnet' | 'testnet';  // Default: 'testnet'
  debug?: boolean;                   // Default: false
}
```

#### Network Configuration

**Mainnet (`mainnet`):**
- Uses mainnet chains (Ethereum, Arbitrum, etc.)
- Real tokens with real value
- Production-ready
- Connected to Avail's mainnet infrastructure

**Testnet (`testnet`):**
- Uses testnet chains (Sepolia, Arbitrum Sepolia, etc.)
- Test tokens (no real value)
- Free faucets available
- Safe for development & testing

```typescript
// Mainnet configuration
const mainnetSDK = new NexusSDK({ network: 'mainnet' });

// Testnet configuration  
const testnetSDK = new NexusSDK({ network: 'testnet' });
```

#### Debug Mode

Enable debug logging to see internal SDK operations:

```typescript
const sdk = new NexusSDK({ 
  network: 'testnet',
  debug: true  // Enables verbose console logging
});

// You'll see logs like:
// [Nexus SDK] Initializing with config: { network: 'testnet' }
// [Nexus SDK] Creating cosmos wallet...
// [Nexus SDK] Initialization complete
```

### Provider Compatibility

The SDK accepts any **EIP-1193 compliant provider**:

#### MetaMask
```typescript
await sdk.initialize(window.ethereum);
```

#### Coinbase Wallet
```typescript
await sdk.initialize(window.coinbaseWalletExtension);
```

#### WalletConnect (via wagmi)
```typescript
import { useAccount } from 'wagmi';

const { connector } = useAccount();
const provider = await connector.getProvider();
await sdk.initialize(provider);
```

#### Custom Provider
```typescript
import { createWalletClient, custom } from 'viem';

const client = createWalletClient({
  transport: custom(window.ethereum)
});
await sdk.initialize(window.ethereum);
```

### Initialization Lifecycle

```typescript
// Initial state
console.log(sdk.isInitialized()); // false

// Start initialization
await sdk.initialize(provider);
  // ↳ Connects to wallet
  // ↳ Gets user address
  // ↳ Creates Cosmos wallet (for CA backend)
  // ↳ Sets up event listeners
  // ↳ Checks for pending refunds

// Initialized
console.log(sdk.isInitialized()); // true

// Can now use SDK methods
const balances = await sdk.getUnifiedBalances();
```

### Account Changes

The SDK automatically handles account switching:

```typescript
sdk.onAccountChanged((account) => {
  console.log('Active account:', account);
  // SDK automatically deinitializes and reinitializes
});
```

### Chain Changes

The SDK tracks chain changes:

```typescript
sdk.onChainChanged((chainId) => {
  console.log('Active chain:', chainId);
});
```

### Deinitialization

Clean up SDK resources when done:

```typescript
// Clean up
await sdk.deinit();
  // ↳ Removes event listeners
  // ↳ Clears internal state
  // ↳ Stops refund interval

// SDK can be reinitialized later
await sdk.initialize(provider);
```

### Advanced: Custom Network Configuration

For advanced users, you can provide custom network configuration:

```typescript
import { Environment } from '@arcana/ca-common';

const customConfig = {
  COSMOS_URL: 'https://custom-cosmos.example.com',
  EXPLORER_URL: 'https://custom-explorer.example.com',
  FAUCET_URL: 'https://custom-faucet.example.com',
  GRPC_URL: 'https://custom-grpc.example.com',
  NETWORK_HINT: Environment.CORAL,
  SIMULATION_URL: 'https://custom-simulation.example.com',
  VSC_DOMAIN: 'custom-vsc.example.com',
};

const sdk = new NexusSDK({ network: customConfig });
```

### Best Practices

✅ **DO:**
- Initialize once at app startup
- Handle initialization errors gracefully
- Clean up with `deinit()` when component unmounts
- Use testnet for development
- Enable debug mode during development

❌ **DON'T:**
- Initialize multiple times unnecessarily
- Forget to await `initialize()`
- Skip error handling
- Use mainnet during active development
- Leave debug mode enabled in production

### Common Initialization Errors

```typescript
// Error: Provider not set
try {
  await sdk.initialize(null);
} catch (error) {
  // Error: use setEVMProvider before calling init()
}

// Error: User rejected connection
try {
  await sdk.initialize(window.ethereum);
} catch (error) {
  // Error: User denied account access
}

// Error: Network mismatch
const sdk = new NexusSDK({ network: 'mainnet' });
// But wallet is connected to testnet
await sdk.initialize(window.ethereum);
// SDK will still initialize, but operations may fail
```

### Initialization Checklist

Before using the SDK, ensure:

- [ ] SDK instance created with appropriate network
- [ ] Wallet provider available and connected
- [ ] User approved wallet connection
- [ ] `initialize()` completed successfully
- [ ] `isInitialized()` returns `true`
- [ ] Event listeners configured (if needed)

---

## Feature 2: Balance Management

### Overview

Balance management in Nexus SDK provides a **unified view** of all your assets across all supported chains. Instead of checking balances chain-by-chain, you get a single aggregated response.

**Key Capabilities:**
- View all token balances across all chains
- Filter by specific token
- Include/exclude swappable balances
- Get fiat values for balances
- See per-chain breakdowns

### Core Methods

#### `getUnifiedBalances()`

Returns all token balances across all chains.

```typescript
async getUnifiedBalances(includeSwappableBalances = false): Promise<UserAsset[]>
```

**Parameters:**
- `includeSwappableBalances` (boolean, optional)
  - `false` (default): Only returns CA-applicable tokens (ETH, USDC, USDT)
  - `true`: Returns all tokens including those available for swaps

**Returns:** `Promise<UserAsset[]>`

```typescript
interface UserAsset {
  symbol: string;              // Token symbol (e.g., 'USDC')
  balance: string;             // Total balance across all chains
  balanceInFiat: number;       // USD value of total balance
  decimals: number;            // Token decimals
  icon?: string;               // Token icon URL
  breakdown: Array<{           // Per-chain breakdown
    balance: string;           // Balance on this chain
    balanceInFiat: number;     // USD value on this chain
    chain: {
      id: number;              // Chain ID
      name: string;            // Chain name
      logo: string;            // Chain logo URL
    };
    contractAddress: string;   // Token contract address
    decimals: number;
    isNative?: boolean;        // True for native tokens (ETH, MATIC, etc.)
    universe: 'ETHEREUM' | 'FUEL';
  }>;
}
```

**Example:**

```typescript
// Get CA-applicable balances
const balances = await sdk.getUnifiedBalances();
console.log(balances);

/*
[
  {
    symbol: 'USDC',
    balance: '250.50',
    balanceInFiat: 250.50,
    decimals: 6,
    icon: 'https://...',
    breakdown: [
      {
        balance: '100.00',
        balanceInFiat: 100.00,
        chain: { id: 1, name: 'Ethereum', logo: 'https://...' },
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        isNative: false,
        universe: 'ETHEREUM'
      },
      {
        balance: '150.50',
        balanceInFiat: 150.50,
        chain: { id: 137, name: 'Polygon', logo: 'https://...' },
        contractAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        decimals: 6,
        isNative: false,
        universe: 'ETHEREUM'
      }
    ]
  },
  {
    symbol: 'ETH',
    balance: '0.5',
    balanceInFiat: 1250.00,
    decimals: 18,
    icon: 'https://...',
    breakdown: [
      // ... per-chain breakdown
    ]
  }
]
*/

// Get all balances including swappable tokens
const allBalances = await sdk.getUnifiedBalances(true);
// Now includes tokens that can be swapped but not used directly in CA
```

#### `getUnifiedBalance(symbol, includeSwappableBalances)`

Get balance for a specific token across all chains.

```typescript
async getUnifiedBalance(
  symbol: string, 
  includeSwappableBalances = false
): Promise<UserAsset | undefined>
```

**Parameters:**
- `symbol` (string): Token symbol (case-insensitive)
- `includeSwappableBalances` (boolean): Same as `getUnifiedBalances()`

**Returns:** `Promise<UserAsset | undefined>`
- Returns `UserAsset` if token is found
- Returns `undefined` if token not found or no balance

**Example:**

```typescript
// Get USDC balance only
const usdcBalance = await sdk.getUnifiedBalance('USDC');
if (usdcBalance) {
  console.log(`Total USDC: ${usdcBalance.balance}`);
  console.log(`Worth: $${usdcBalance.balanceInFiat}`);
  
  // Check balance on specific chain
  const polygonUSDC = usdcBalance.breakdown.find(b => b.chain.id === 137);
  if (polygonUSDC) {
    console.log(`USDC on Polygon: ${polygonUSDC.balance}`);
  }
}

// Check if user has ETH
const ethBalance = await sdk.getUnifiedBalance('ETH');
if (!ethBalance || parseFloat(ethBalance.balance) === 0) {
  console.log('No ETH balance found');
}
```

### Understanding Balance Filtering

#### CA-Applicable Tokens (`includeSwappableBalances = false`)

These are tokens that can be used **directly** in chain abstraction operations:
- **ETH** (native on all EVM chains)
- **USDC** (6 decimals, on all chains)
- **USDT** (6 decimals, on all chains)

Use this when:
- Building bridge/transfer UIs
- Checking available balances for transactions
- Showing balances for CA operations

```typescript
const caBalances = await sdk.getUnifiedBalances(false);
// Only shows ETH, USDC, USDT
```

#### All Tokens (`includeSwappableBalances = true`)

Includes CA-applicable tokens **plus** any other tokens that can be swapped:
- All ERC-20 tokens with liquidity
- Tokens supported by swap aggregators (LiFi, Bebop)
- Custom tokens on supported chains

Use this when:
- Building portfolio dashboards
- Showing complete wallet overview
- Enabling swap functionality
- Displaying all user assets

```typescript
const allBalances = await sdk.getUnifiedBalances(true);
// Shows ETH, USDC, USDT, plus AAVE, UNI, PEPE, etc.
```

### Best Practices

✅ **DO:**
- Cache balances with appropriate TTL
- Show loading states during fetches
- Handle zero balance cases
- Display chain-specific breakdowns
- Refresh after transactions
- Use `getUnifiedBalance()` for single token queries

❌ **DON'T:**
- Fetch balances on every render
- Ignore balance fetch errors
- Assume balances are always available
- Parse balances without error handling
- Forget to handle `undefined` returns from `getUnifiedBalance()`

### FAQ

**Q: How often should I refresh balances?**  
A: Every 30-60 seconds for dashboards, or after successful transactions.

**Q: Why is my token not showing up?**  
A: Make sure `includeSwappableBalances = true` if it's not ETH/USDC/USDT.

**Q: Can I get balances for a specific chain only?**  
A: Use `getUnifiedBalance()` and filter the `breakdown` array.

**Q: Are fiat values real-time?**  
A: Yes, SDK fetches current USD prices from oracles.

**Q: What if a chain's RPC is down?**  
A: That chain will be skipped in the balance response.



## Feature 3: Bridge Operations

### Overview

Bridge operations move tokens from one or more source chains to a single destination chain. The SDK automatically:
- Selects optimal source chains based on balance and fees
- Calculates total transaction costs
- Routes transactions through solvers
- Handles gas abstraction (pays gas from the tokens being transferred)

**Use Cases:**
- Consolidating tokens to a single chain
- Moving liquidity to cheaper chains
- Preparing funds for a specific chain operation

### Core Method: `bridge()`

```typescript
async bridge(params: BridgeParams): Promise<BridgeResult>
```

**Parameters:**

```typescript
interface BridgeParams {
  token: 'ETH' | 'USDC' | 'USDT';     // Token to bridge
  amount: number | string;             // Amount in token units (not wei!)
  chainId: number;                     // Destination chain ID
  gas?: bigint;                        // Optional: Custom gas limit
  sourceChains?: number[];             // Optional: Specific source chains to use
}
```

**Returns:**

```typescript
type BridgeResult =
  | { success: true; explorerUrl: string; transactionHash?: string }
  | { success: false; error: string };
```

### Basic Examples

**Example 1: Simple Bridge**

```typescript
// Bridge 100 USDC to Polygon
const result = await sdk.bridge({
  token: 'USDC',
  amount: 100,
  chainId: 137  // Polygon
});

if (result.success) {
  console.log('✅ Bridge successful!');
  console.log('View transaction:', result.explorerUrl);
} else {
  console.error('❌ Bridge failed:', result.error);
}
```

**Example 2: Bridge with Source Chain Selection**

```typescript
// Only use USDC from Optimism and Arbitrum (ignore other chains)
const result = await sdk.bridge({
  token: 'USDC',
  amount: 100,
  chainId: 137,
  sourceChains: [10, 42161]  // Optimism, Arbitrum only
});

// SDK will only pull USDC from these two chains
// Useful when you want to keep balance on other chains
```

**Example 3: Bridge Native Token (ETH)**

```typescript
// Bridge 0.5 ETH to Base
const result = await sdk.bridge({
  token: 'ETH',
  amount: 0.5,
  chainId: 8453  // Base
});
```

### Simulation: `simulateBridge()`

Preview costs and sources before executing:

```typescript
const simulation = await sdk.simulateBridge({
  token: 'USDC',
  amount: 100,
  chainId: 137
});

// Examine the intent
console.log('Destination:', simulation.intent.destination);
console.log('Sources:', simulation.intent.sources);
console.log('Fees:', simulation.intent.fees);

/*
Fees breakdown:
{
  protocol: '0.1',      // Protocol fee
  solver: '0.05',       // Solver fee
  gasSupplied: '2.5',   // Gas costs
  caGas: '0.3',         // Chain abstraction gas
  total: '2.95'         // Total fees
}
*/

// Check if you have sufficient balance
if (simulation.intent.isAvailableBalanceInsufficient) {
  console.log('⚠️ Insufficient balance for this bridge');
}

// See which chains will be used
simulation.intent.sources.forEach(source => {
  console.log(`Using ${source.amount} from chain ${source.chainID}`);
});
```

### Bridge Flow

Understanding what happens during a bridge:

```
1. Intent Creation
   ↓
2. Source Selection (SDK automatically picks optimal chains)
   ↓
3. User Approval (onIntentHook called)
   ↓
4. Allowance Check (if needed, onAllowanceHook called)
   ↓
5. Source Collection (deposit tokens on source chains)
   ↓
6. Intent Submission (submitted to Avail network)
   ↓
7. Solver Fulfillment (solver delivers tokens on destination)
   ↓
8. Completion (transaction confirmed, funds available)
```

**Typical Timeline:**
- Simple bridge (1 source): ~30-45 seconds
- Multi-source bridge: ~45-90 seconds
- High congestion: up to 2-3 minutes

---

### Bridge Routing & Route Selection

#### How Bridge Routes Work

The Avail Nexus SDK uses a **dynamic routing system** where available routes are fetched in real-time from Avail's backend, not hardcoded in the SDK.

**Route Structure:**

Each bridge route is a specific path defined by:
```typescript
{
  sourceChainID: number;           // e.g., 137 (Polygon)
  sourceTokenAddress: `0x${string}`;  // e.g., USDC on Polygon
  destinationChainID: number;      // e.g., 42161 (Arbitrum)
  destinationTokenAddress: `0x${string}`; // e.g., USDC on Arbitrum
  feeBP: number;                   // Fee in basis points (e.g., 10 = 0.1%)
}
```

**Key Characteristics:**

✨ **Dynamic Routes:**
- Routes are fetched from Avail's backend in real-time
- New routes can be added without SDK updates
- Route availability depends on active solvers
- Different routes available on mainnet vs testnet

✨ **No Hardcoded Restrictions:**
- SDK doesn't restrict which chains can bridge to which
- Route availability determined by solver network
- All supported chains in `chainList` are potential sources/destinations

✨ **Route Validation:**
```typescript
// From SDK source: api.utils.ts
const solverFeeBP = this.data.solverRoutes.find((route) => {
  return (
    Number(route.sourceChainID) === sourceChainID &&
    Number(route.destinationChainID) === destinationChainID &&
    equalFold(route.sourceTokenAddress, sourceTokenAddress) &&
    equalFold(route.destinationTokenAddress, destinationTokenAddress)
  );
})?.feeBP ?? 0;  // Defaults to 0 if no route exists
```

**⚠️ Important:** If a matching route doesn't exist in the solver network, the bridge may fail during execution.

---

#### Source Chain Selection with `sourceChains`

You can optionally control which chains the SDK uses as sources for bridging:

**Parameter:**
```typescript
interface BridgeParams {
  token: SUPPORTED_TOKENS;
  amount: number | string;
  chainId: SUPPORTED_CHAINS_IDS;
  sourceChains?: number[];  // Optional: restrict source chains
}
```

**How It Works:**

```typescript
// From SDK source: base.ts
const allowedSources = allSources.filter((balance) => {
  if (input.sourceChains.length === 0) {
    return true;  // Empty array = use ALL available source chains
  }
  return input.sourceChains.includes(balance.chainID);  // Only use specified chains
});
```

**Example 1: Use All Available Sources (Default)**

```typescript
// SDK automatically selects optimal sources from ALL chains
const result = await sdk.bridge({
  token: 'USDC',
  amount: 100,
  chainId: 42161,
  sourceChains: []  // Empty or omit = use any chain with USDC
});

// SDK might pull from: Polygon (60 USDC) + Optimism (40 USDC)
```

**Example 2: Restrict to Specific Chains**

```typescript
// Only use USDC from Polygon and Base
const result = await sdk.bridge({
  token: 'USDC',
  amount: 100,
  chainId: 1,  // Ethereum
  sourceChains: [137, 8453]  // Only Polygon (137) and Base (8453)
});

// SDK will ONLY pull from these two chains
// Even if you have USDC on other chains, they won't be used
```

**Example 3: Keep Balance on Specific Chain**

```typescript
// Bridge to Arbitrum but preserve Ethereum balance
const result = await sdk.bridge({
  token: 'USDC',
  amount: 100,
  chainId: 42161,
  sourceChains: [137, 10, 8453]  // Exclude chain 1 (Ethereum)
});

// Your Ethereum USDC stays untouched
```

**Use Cases for `sourceChains`:**

1. **Preserve balances** - Keep funds on specific chains for future use
2. **Lower fees** - Use chains with cheaper collection fees
3. **Faster execution** - Use chains with faster finality
4. **Strategic rebalancing** - Control which chains get drained

---

#### How the SDK Selects Sources

When you call `bridge()` without specifying `sourceChains`, the SDK automatically selects sources:

**Selection Algorithm:**

1. **Get all balances** - Fetch your token balance across all chains
2. **Apply filters:**
   - Skip destination chain (no bridge needed for funds already there)
   - Apply `sourceChains` filter if provided
   - Skip Fuel chain if base asset < 0.000003 (insufficient for gas)
3. **Calculate requirements:**
   - Amount needed: `bridgeAmount + protocolFee + solverFee + fulfilmentFee`
   - For each source: Add `collectionFee` per chain
4. **Iterate sources:**
   - Keep adding sources until total covers amount + all fees
   - Optimize by checking solver routes exist for each (source → dest) pair
5. **Return intent** with selected sources

**Example Selection:**

```typescript
// You have:
// - 50 USDC on Polygon (chain 137)
// - 30 USDC on Optimism (chain 10)
// - 40 USDC on Arbitrum (chain 42161)

// You want to bridge 100 USDC to Ethereum (chain 1)

await sdk.bridge({
  token: 'USDC',
  amount: 100,
  chainId: 1
});

// SDK selects:
// Source 1: 50 USDC from Polygon (solverFee: 0.05 USDC)
// Source 2: 30 USDC from Optimism (solverFee: 0.03 USDC)
// Source 3: 22 USDC from Arbitrum (solverFee: 0.02 USDC)
// Total: 102.1 USDC (includes fees)
```

---

#### Checking Available Routes

**Currently, there's no direct method to query available routes before attempting a bridge.** Routes are validated during the bridge transaction execution.

**Workaround - Test with Simulation:**

```typescript
try {
  const simulation = await sdk.simulateBridge({
    token: 'USDC',
    amount: 100,
    chainId: 137,
    sourceChains: [10, 42161]  // Test specific sources
  });
  
  // If simulation succeeds, routes exist for these sources
  console.log('✅ Routes available for sources:', simulation.intent.sources);
  
  // Check solver fees (indicates route quality)
  console.log('Solver fee:', simulation.intent.fees.solver);
  
} catch (error) {
  // Simulation failed - routes may not exist or insufficient balance
  console.error('Route validation failed:', error.message);
}
```

**Best Practices:**

✅ **DO:**
- Use `simulateBridge()` first to validate routes and fees
- Check `intent.fees.solver` - higher fees may indicate less optimal routes
- Start with empty `sourceChains` to let SDK find optimal paths
- Use `sourceChains` filter only when you have specific requirements

❌ **DON'T:**
- Assume any chain→chain route exists without testing
- Specify `sourceChains` without checking you have sufficient balance
- Bridge large amounts without simulating first
- Expect instant route availability changes (backend updates periodically)

---

### Progress Tracking

Track bridge progress in real-time:

```typescript
// Listen for expected steps
sdk.nexusEvents.on('expected_steps', (steps) => {
  console.log('Total steps:', steps.length);
  console.log('Steps:', steps.map(s => s.typeID));
  // Example: ['CS', 'AL', 'BS', 'IS']
});

// Listen for completed steps
sdk.nexusEvents.on('step_complete', (step) => {
  console.log('Completed step:', step.typeID);
  
  switch (step.typeID) {
    case 'CS':
      console.log('Chain switched');
      break;
    case 'AL':
      console.log('Allowance set');
      break;
    case 'BS':
      console.log('Balance sufficient');
      break;
    case 'IS':
      console.log('Intent successful!');
      if (step.data?.explorerURL) {
        console.log('Transaction:', step.data.explorerURL);
      }
      break;
  }
});
```

### Advanced Patterns

**Pattern 1: Bridge with Progress UI**

```typescript
function BridgeWithProgress() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let totalSteps = 0;
    let completedSteps = 0;
    
    const unsubExpected = sdk.nexusEvents.on('expected_steps', (steps) => {
      totalSteps = steps.length;
    });
    
    const unsubComplete = sdk.nexusEvents.on('step_complete', (step) => {
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);
      
      if (step.typeID === 'IS') {
        setStatus('complete');
      }
    });
    
    return () => {
      unsubExpected();
      unsubComplete();
    };
  }, []);
  
  const handleBridge = async () => {
    setStatus('bridging');
    const result = await sdk.bridge({
      token: 'USDC',
      amount: 100,
      chainId: 137
    });
    
    if (!result.success) {
      setStatus('error');
    }
  };
  
  return (
    <div>
      <button onClick={handleBridge}>Bridge USDC</button>
      {status === 'bridging' && (
        <div>
          <p>Bridging... {progress.toFixed(0)}%</p>
          <progress value={progress} max="100" />
        </div>
      )}
    </div>
  );
}
```

**Pattern 2: Retry Failed Bridge**

```typescript
async function bridgeWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await sdk.bridge(params);
      if (result.success) {
        return result;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

**Pattern 3: Multi-Step Bridge Workflow**

```typescript
async function consolidateToMainnet() {
  // Step 1: Check balances across chains
  const balances = await sdk.getUnifiedBalance('USDC');
  
  // Step 2: Calculate total
  const total = parseFloat(balances.balance);
  console.log(`Consolidating ${total} USDC to Ethereum`);
  
  // Step 3: Execute bridge
  const result = await sdk.bridge({
    token: 'USDC',
    amount: total,
    chainId: 1  // Ethereum
  });
  
  // Step 4: Verify final balance
  if (result.success) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const newBalances = await sdk.getUnifiedBalance('USDC');
    const ethBalance = newBalances.breakdown.find(b => b.chain.id === 1);
    console.log(`New Ethereum balance: ${ethBalance?.balance}`);
  }
}
```

### Best Practices

✅ **DO:**
- Simulate before bridging to check fees
- Handle progress events for better UX
- Validate sufficient balance before calling bridge
- Show explorer URL to users
- Implement retry logic for failed bridges

❌ **DON'T:**
- Bridge without checking simulation first
- Ignore the `isAvailableBalanceInsufficient` flag
- Bridge amounts close to your total balance (leave buffer for fees)
- Call bridge repeatedly without waiting for completion
- Forget to handle the error case

### Common Errors

```typescript
// Error 1: Insufficient balance
try {
  await sdk.bridge({ token: 'USDC', amount: 10000, chainId: 137 });
} catch (error) {
  // Error: Insufficient balance across all chains
}

// Error 2: User denied intent
try {
  await sdk.bridge({ token: 'USDC', amount: 100, chainId: 137 });
} catch (error) {
  // Error: User denied intent approval in onIntentHook
}

// Error 3: Unsupported chain
try {
  await sdk.bridge({ token: 'USDC', amount: 100, chainId: 99999 });
} catch (error) {
  // Error: Chain not supported
}
```

### FAQ

**Q: How much do bridge operations cost?**  
A: Typically 0.1-0.5% in protocol fees, plus gas costs (which are deducted from your tokens).

**Q: Can I bridge between any two chains?**  
A: Yes, as long as both chains are supported by the SDK **and a solver route exists** between them. Routes are dynamic and fetched from Avail's backend in real-time. Use `simulateBridge()` first to verify route availability.

**Q: How do I know which bridge routes are available?**  
A: The SDK doesn't provide a direct method to query routes. Use `simulateBridge()` to test if a specific route exists. Routes are determined by the active solver network and are updated dynamically by Avail. See the [Bridge Routing & Route Selection](#bridge-routing--route-selection) section for details.

**Q: What happens if a bridge fails mid-way?**  
A: If funds were deposited but not fulfilled, they can be refunded after the intent expires.

**Q: How long does a bridge take?**  
A: Usually 30-90 seconds depending on chain congestion and number of source chains.

**Q: Can I cancel a bridge once started?**  
A: No, once the intent is submitted, it must complete or expire for refund.

**Q: How does the SDK decide which chains to pull tokens from?**  
A: The SDK automatically selects optimal source chains based on your balances, available routes, and fees. You can override this with the `sourceChains` parameter to specify exactly which chains to use. See [How the SDK Selects Sources](#how-the-sdk-selects-sources) for the algorithm details.

**Q: Can I keep my balance on specific chains while bridging?**  
A: Yes! Use the `sourceChains` parameter to exclude certain chains. For example, to preserve your Ethereum balance while bridging from other chains: `sourceChains: [137, 10, 8453]` (excludes chain 1).

---

## Feature 4: Transfer Operations

### Overview

Transfer operations send tokens to a specific recipient address on a destination chain. The SDK features **intelligent optimization**:

- **Direct Transfer**: If you have both the token AND gas on the destination chain → uses direct EVM transfer (faster, cheaper, single transaction)
- **Chain Abstraction**: If insufficient balance/gas on destination → automatically bridges from other chains

### Core Method: `transfer()`

```typescript
async transfer(params: TransferParams): Promise<TransferResult>
```

**Parameters:**

```typescript
interface TransferParams {
  token: 'ETH' | 'USDC' | 'USDT';
  amount: number | string;
  chainId: number;                    // Destination chain
  recipient: `0x${string}`;           // Recipient address (must be valid address)
  sourceChains?: number[];            // Optional: Specific source chains
}
```

**Returns:**

```typescript
type TransferResult =
  | { success: true; transactionHash: string; explorerUrl: string }
  | { success: false; error: string };
```

### Basic Examples

**Example 1: Simple Transfer**

```typescript
// Send 50 USDC to someone on Arbitrum
const result = await sdk.transfer({
  token: 'USDC',
  amount: 50,
  chainId: 42161,  // Arbitrum
  recipient: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45'
});

if (result.success) {
  console.log('✅ Transfer successful!');
  console.log('Transaction hash:', result.transactionHash);
  console.log('View on explorer:', result.explorerUrl);
}
```

**Example 2: Payment Integration**

```typescript
// E-commerce payment flow
async function processPayment(orderId, amount, merchantAddress) {
  const result = await sdk.transfer({
    token: 'USDC',
    amount: amount,
    chainId: 137,  // Polygon for low fees
    recipient: merchantAddress
  });
  
  if (result.success) {
    // Update order status
    await updateOrderStatus(orderId, 'paid', result.transactionHash);
    return { success: true, txHash: result.transactionHash };
  } else {
    return { success: false, error: result.error };
  }
}
```

**Example 3: Batch Transfers**

```typescript
// Send to multiple recipients
async function batchTransfer(recipients) {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sdk.transfer({
      token: 'USDC',
      amount: recipient.amount,
      chainId: recipient.chainId,
      recipient: recipient.address
    });
    
    results.push({
      address: recipient.address,
      success: result.success,
      txHash: result.success ? result.transactionHash : null
    });
    
    // Wait between transfers
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}
```

### Direct Transfer Optimization

The SDK automatically detects when direct transfer is possible and chooses the optimal path.

**When Direct Transfer is Used:**

For **ERC-20 tokens**:
1. Sufficient token balance on destination chain (`amount <= balance`)
2. Sufficient gas token on destination chain (`2x estimatedGas <= gasBalance`)
3. Results in single blockchain transaction
4. Takes ~5-15 seconds
5. Only pays gas fees (no protocol fees)

For **native tokens** (ETH, MATIC, etc.):
1. Sufficient balance to cover transfer + gas (`amount + 2x estimatedGas <= balance`)
2. Results in single blockchain transaction  
3. Takes ~5-15 seconds
4. Only pays gas fees (no protocol fees)

**When Chain Abstraction is Used:**
1. Insufficient token or gas on destination chain
2. SDK automatically sources from other chains
3. Multiple transactions involved (deposits + fulfillment)
4. Takes ~30-90 seconds
5. Includes protocol fees + solver fees + gas

```typescript
// Example: Checking which path will be used
const simulation = await sdk.simulateTransfer({
  token: 'USDC',
  amount: 50,
  chainId: 42161,
  recipient: '0x...'
});

// Check fees to determine path
if (parseFloat(simulation.intent.fees.caGas) === 0) {
  console.log('✨ Will use optimized direct transfer');
  console.log('Cost:', simulation.intent.fees.gasSupplied);
} else {
  console.log('🌉 Will use chain abstraction');
  console.log('Total fees:', simulation.intent.fees.total);
}
```

### Simulation: `simulateTransfer()`

```typescript
const simulation = await sdk.simulateTransfer({
  token: 'USDC',
  amount: 50,
  chainId: 42161,
  recipient: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45'
});

console.log('Estimated fees:', simulation.intent.fees);
console.log('Source chains:', simulation.intent.sources);

// Show user cost breakdown
const totalCost = parseFloat(simulation.intent.fees.total);
const actualAmount = 50;
const totalWithFees = actualAmount + totalCost;

console.log(`Sending ${actualAmount} USDC`);
console.log(`Fees: ${totalCost} USDC`);
console.log(`Total cost: ${totalWithFees} USDC`);
```

### Progress Tracking

```typescript
sdk.nexusEvents.on('expected_steps', (steps) => {
  // For direct transfers: usually ['CS', 'TS', 'IS'] (3 steps)
  // For CA transfers: more steps like ['CS', 'AL', 'BS', 'IS']
  console.log('Transfer steps:', steps.map(s => s.typeID));
});

sdk.nexusEvents.on('step_complete', (step) => {
  if (step.typeID === 'IS' && step.data?.explorerURL) {
    console.log('✅ Transfer complete!');
    console.log('Transaction:', step.data.explorerURL);
    console.log('Hash:', step.data.transactionHash);
  }
});
```

### Advanced Patterns

**Pattern 1: Transfer with Confirmation**

```typescript
async function transferWithConfirmation(params) {
  // Step 1: Simulate
  const simulation = await sdk.simulateTransfer(params);
  
  // Step 2: Show user confirmation
  const isDirect = parseFloat(simulation.intent.fees.caGas) === 0;
  const message = isDirect
    ? `Direct transfer: ${simulation.intent.fees.gasSupplied} gas fee`
    : `Chain abstraction: ${simulation.intent.fees.total} total fees`;
  
  const confirmed = confirm(`${message}\n\nProceed?`);
  if (!confirmed) return { success: false, error: 'User cancelled' };
  
  // Step 3: Execute
  const result = await sdk.transfer(params);
  return result;
}
```

**Pattern 2: Transfer with Balance Check**

```typescript
async function safeTransfer(token, amount, chainId, recipient) {
  // Check if user has enough balance
  const balance = await sdk.getUnifiedBalance(token);
  const totalBalance = parseFloat(balance.balance);
  const requestedAmount = parseFloat(amount);
  
  if (totalBalance < requestedAmount) {
    return {
      success: false,
      error: `Insufficient balance. Have: ${totalBalance}, Need: ${requestedAmount}`
    };
  }
  
  // Leave 5% buffer for fees
  const maxTransfer = totalBalance * 0.95;
  if (requestedAmount > maxTransfer) {
    return {
      success: false,
      error: `Amount too high. Recommended max: ${maxTransfer} (5% buffer for fees)`
    };
  }
  
  // Execute transfer
  return await sdk.transfer({
    token,
    amount,
    chainId,
    recipient
  });
}
```

**Pattern 3: Transfer with Retry**

```typescript
async function transferWithRetry(params, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Transfer attempt ${attempt}/${maxAttempts}`);
      const result = await sdk.transfer(params);
      
      if (result.success) {
        return result;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxAttempts) {
        return { success: false, error: error.message };
      }
    }
  }
}
```

### Use Cases

**Use Case 1: P2P Payments**

```typescript
function SendMoney() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  
  const handleSend = async () => {
    setSending(true);
    try {
      const result = await sdk.transfer({
        token: 'USDC',
        amount: parseFloat(amount),
        chainId: 137,
        recipient: recipient as `0x${string}`
      });
      
      if (result.success) {
        alert(`Sent! Transaction: ${result.transactionHash}`);
      } else {
        alert(`Failed: ${result.error}`);
      }
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div>
      <input
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend} disabled={sending}>
        {sending ? 'Sending...' : 'Send USDC'}
      </button>
    </div>
  );
}
```

**Use Case 2: Subscription Payments**

```typescript
async function processSubscription(userId, planAmount, merchantAddress) {
  const result = await sdk.transfer({
    token: 'USDC',
    amount: planAmount,
    chainId: 8453,  // Base for low fees
    recipient: merchantAddress
  });
  
  if (result.success) {
    // Record subscription payment
    await database.subscriptions.update(userId, {
      status: 'active',
      lastPayment: new Date(),
      transactionHash: result.transactionHash
    });
  }
  
  return result;
}
```

### Best Practices

✅ **DO:**
- Validate recipient address before transferring
- Simulate transfers to show users estimated fees
- Use Polygon or Base for frequent small transfers (lower fees)
- Keep 5-10% buffer in balance for fees
- Store transaction hashes for records

❌ **DON'T:**
- Transfer without validating recipient address
- Transfer your entire balance (leave buffer for fees)
- Assume direct transfer will always be used
- Forget to handle user cancellation
- Transfer to zero address

### FAQ

**Q: How do I know if direct transfer will be used?**  
A: Call `simulateTransfer()` and check if `fees.caGas === '0'`.

**Q: Can I transfer to any address?**  
A: Yes, any valid Ethereum address works. SDK doesn't verify if it's a contract or EOA.

**Q: What's the minimum transfer amount?**  
A: No strict minimum, but very small amounts may have high fee ratios.

**Q: Can I specify gas price?**  
A: No, the SDK uses optimal gas pricing automatically.

**Q: How do refunds work if transfer fails?**  
A: If funds were deposited but transfer failed, they can be refunded after intent expires.


## Feature 7: Swap Operations (Same-Chain & Cross-Chain)

### Overview

Swap operations enable token swapping **within the same chain OR across different chains** using integrated DEX aggregators (LiFi, Bebop). The SDK supports two modes:

- **EXACT_IN**: Specify exact input amount, output varies based on market rates
- **EXACT_OUT**: Specify exact output amount, input varies based on market rates

**Key Features:**
- ✨ **Same-chain swaps** (e.g., USDC → ETH on Ethereum)
- ✨ **Cross-chain swaps** (e.g., USDC on Polygon → ETH on Arbitrum)
- Multiple DEX aggregator integration
- Best route selection with automatic optimization
- Slippage protection
- Real-time price quotes

### How the SDK Determines Swap Type

The SDK automatically detects whether a same-chain or cross-chain swap is needed:

**Same-Chain Swap (No Bridging):**
- When: All source tokens are already on the destination chain
- Example: Swap 100 USDC → ETH on Ethereum (both on chain 1)
- Process: Direct swap using DEX aggregators
- Speed: ~30 seconds
- Fees: Only swap fees (no bridge fees)

**Cross-Chain Swap (With Bridging):**
- When: Source tokens are on different chain(s) than destination
- Example: Swap 100 USDC on Polygon → ETH on Arbitrum
- Process: Source swap (if needed) → Bridge → Destination swap
- Speed: ~60-120 seconds
- Fees: Swap fees + bridge fees + protocol fees

**Smart Detection:**
```typescript
// Code from route.ts line 639:
const isBridgeRequired = !srcBalances.every((b) => b.chainID === input.toChainId);

// If ALL source tokens are on destination chain:
//   → Same-chain swap (no bridge)
// If ANY source token is on different chain:
//   → Cross-chain swap (with bridge)
```

### Methods

#### `swapWithExactIn()`

Swap exact input amount, receive variable output:

```typescript
async swapWithExactIn(
  input: ExactInSwapInput,
  options?: SwapInputOptionalParams
): Promise<SwapResult>
```

**Parameters:**

```typescript
interface ExactInSwapInput {
  from: Array<{
    chainId: number;
    tokenAddress: string | 'USDC' | 'USDT' | 'ETH';  // Can use symbol
    amount: bigint;  // Amount in wei
  }>;
  toChainId: number;
  toTokenAddress: `0x${string}`;
}

interface SwapInputOptionalParams {
  swapIntentHook?: SwapIntentHook;
}

type SwapIntentHook = (data: {
  intent: SwapIntent;
  allow: () => void;
  deny: () => void;
  refresh: () => Promise<SwapIntent>;
}) => Promise<void>;
```

**Example 1: Cross-Chain Swap (100 USDC on Polygon to LDO on Arbitrum)**

```typescript
import { parseUnits } from 'viem';

const result = await sdk.swapWithExactIn(
  {
    from: [
      {
        chainId: 137,  // Polygon
        tokenAddress: 'USDC',  // Can use symbol for known tokens
        amount: parseUnits('100', 6)  // 100 USDC
      }
    ],
    toChainId: 42161,  // Arbitrum (different chain!)
    toTokenAddress: '0x13ad51ed4f1b7e9dc168d8a00cb3f4ddd85efa60'  // LDO
  },
  {
    swapIntentHook: async ({ intent, allow, deny, refresh }) => {
      // Show user swap details
      console.log('You will receive approximately:', intent.destination.amount);
      console.log('From sources:', intent.sources);
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(async () => {
        const updated = await refresh();
        console.log('Updated output:', updated.destination.amount);
      }, 5000);
      
      // User approves after 3 seconds
      setTimeout(() => {
        clearInterval(interval);
        allow();
      }, 3000);
    }
  }
);

if (result.success) {
  console.log('✅ Cross-chain swap successful!');
  console.log('Source swaps:', result.result.sourceSwaps);
  console.log('Destination swap:', result.result.destinationSwap);
  console.log('Explorer:', result.result.explorerURL);
} else {
  console.error('❌ Swap failed:', result.error);
}
```

**Example 2: Same-Chain Swap (100 USDC to ETH on Ethereum)**

```typescript
import { parseUnits } from 'viem';

const result = await sdk.swapWithExactIn(
  {
    from: [
      {
        chainId: 1,  // Ethereum
        tokenAddress: 'USDC',
        amount: parseUnits('100', 6)  // 100 USDC
      }
    ],
    toChainId: 1,  // Ethereum (SAME chain!)
    toTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  // WETH
  },
  {
    swapIntentHook: async ({ intent, allow, deny }) => {
      console.log('💡 Same-chain swap detected - no bridging needed');
      console.log('You will receive approximately:', intent.destination.amount, 'WETH');
      console.log('Source:', intent.sources);
      
      // Note: intent.sources will show chainID: 1 (same as destination)
      // SDK automatically skips bridging step
      
      const confirmed = confirm('Proceed with swap?');
      if (confirmed) {
        allow();
      } else {
        deny();
      }
    }
  }
);

if (result.success) {
  console.log('✅ Same-chain swap successful!');
  console.log('No bridge transaction needed!');
  console.log('Swap transaction:', result.result.destinationSwap);
} else {
  console.error('❌ Swap failed:', result.error);
}
```

#### `swapWithExactOut()`

Specify exact output amount, input varies:

```typescript
async swapWithExactOut(
  input: ExactOutSwapInput,
  options?: SwapInputOptionalParams
): Promise<SwapResult>
```

**Parameters:**

```typescript
interface ExactOutSwapInput {
  toChainId: number;
  toTokenAddress: `0x${string}`;
  toAmount: bigint;  // Exact amount to receive (in wei)
}
```

**Example: Get exactly 1 WETH on Ethereum**

```typescript
const result = await sdk.swapWithExactOut(
  {
    toChainId: 1,  // Ethereum
    toTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',  // WETH
    toAmount: parseUnits('1', 18)  // Exactly 1 WETH
  },
  {
    swapIntentHook: async ({ intent, allow, deny }) => {
      console.log('This will cost:', intent.sources);
      
      const confirmed = confirm('Proceed with swap?');
      if (confirmed) {
        allow();
      } else {
        deny();
      }
    }
  }
);
```

### Discovering Available Swap Options

```typescript
import { DESTINATION_SWAP_TOKENS } from '@avail-project/nexus-core';

// Get supported source chains and tokens
const options = sdk.utils.getSwapSupportedChainsAndTokens();

console.log('Available source chains and tokens:');
options.forEach(chain => {
  console.log(`\n${chain.name} (Chain ID: ${chain.id})`);
  chain.tokens.forEach(token => {
    console.log(`  - ${token.symbol}: ${token.tokenAddress}`);
  });
});

// Get popular destination tokens (reference only)
const optimismDestinations = DESTINATION_SWAP_TOKENS.get(10);
const arbitrumDestinations = DESTINATION_SWAP_TOKENS.get(42161);
const baseDestinations = DESTINATION_SWAP_TOKENS.get(8453);

console.log('\nPopular destination tokens:');
console.log('Optimism:', optimismDestinations);
console.log('Arbitrum:', arbitrumDestinations);
console.log('Base:', baseDestinations);
```

**Important Notes:**
- **Source chains/tokens**: RESTRICTED to `getSwapSupportedChainsAndTokens()` results
- **Destination chains/tokens**: ANY supported chain and token address
- **DESTINATION_SWAP_TOKENS**: Helpful reference, NOT exhaustive list

### Swap Progress Events

```typescript
sdk.nexusEvents.on('swap_step', (step) => {
  console.log('Swap step:', step.type);
  
  switch (step.type) {
    case 'SWAP_START':
      console.log('🔄 Swap initiated');
      break;
    case 'DETERMINING_SWAP':
      console.log('🔍 Finding best route...');
      break;
    case 'SOURCE_SWAP_HASH':
      console.log('📤 Source swap tx:', step.explorerURL);
      break;
    case 'DESTINATION_SWAP_HASH':
      console.log('📥 Destination swap tx:', step.explorerURL);
      break;
    case 'SWAP_COMPLETE':
      console.log('✅ Swap completed!');
      break;
  }
});
```

### Swap Intent Structure

```typescript
interface SwapIntent {
  sources: Array<{
    amount: string;
    chainID: number;
    contractAddress: string;
    decimals: number;
    symbol: string;
  }>;
  destination: {
    amount: string;
    chainID: number;
    contractAddress: string;
    decimals: number;
    symbol: string;
  };
}
```

### Best Practices

✅ **DO:**
- Use `swapIntentHook` to show users expected output
- Implement refresh mechanism (every 5-10 seconds)
- Show source chains being used
- Handle slippage appropriately
- Test swaps on testnet first

❌ **DON'T:**
- Swap without showing user the expected output
- Forget to refresh intent (prices change)
- Use unsupported source chains
- Ignore swap failures
- Execute large swaps without simulation

---

## Feature 8: Allowance Management

### Overview

Manage ERC-20 token allowances for the Nexus vault contract on each chain. Required for bridge, transfer, and execute operations involving ERC-20 tokens.

### Methods

#### `getAllowance()`

Check current allowances:

```typescript
async getAllowance(
  chainId?: number,
  tokens?: string[]
): Promise<AllowanceResponse[]>
```

**Example:**

```typescript
// Check USDC and USDT allowances on Polygon
const allowances = await sdk.getAllowance(137, ['USDC', 'USDT']);

allowances.forEach(a => {
  console.log(`${a.token} allowance on chain ${a.chainID}:`);
  console.log(`  Current: ${a.allowance}`);
  console.log(`  Readable: ${formatUnits(a.allowance, 6)}`);
});

// Check all tokens on all chains
const allAllowances = await sdk.getAllowance();
```

#### `setAllowance()`

Set token allowances:

```typescript
async setAllowance(
  chainId: number,
  tokens: string[],
  amount: bigint
): Promise<void>
```

**Example:**

```typescript
import { parseUnits } from 'viem';

// Approve 1000 USDC on Polygon
await sdk.setAllowance(
  137,
  ['USDC'],
  parseUnits('1000', 6)
);

// Approve max uint256 (unlimited)
await sdk.setAllowance(
  137,
  ['USDC', 'USDT'],
  BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
);
```

#### `revokeAllowance()`

Revoke (set to 0) token allowances:

```typescript
async revokeAllowance(
  chainId: number,
  tokens: string[]
): Promise<void>
```

**Example:**

```typescript
// Revoke USDC allowance on Polygon
await sdk.revokeAllowance(137, ['USDC']);

// Revoke multiple tokens
await sdk.revokeAllowance(1, ['USDC', 'USDT']);
```

### Allowance Hooks

Control allowance approval flow:

```typescript
sdk.setOnAllowanceHook(({ allow, deny, sources }) => {
  console.log('Allowance required for:');
  
  sources.forEach(source => {
    console.log(`\n${source.token.symbol} on ${source.chain.name}`);
    console.log(`  Current: ${source.allowance.current}`);
    console.log(`  Minimum needed: ${source.allowance.minimum}`);
  });
  
  // Options for allow():
  // - Array of: 'max' | 'min' | bigint | string
  // - Length must match sources.length
  
  // Approve max for all
  allow(sources.map(() => 'max'));
  
  // OR approve minimum for all
  // allow(sources.map(() => 'min'));
  
  // OR custom amounts
  // allow([parseUnits('1000', 6), 'max', parseUnits('500', 6)]);
  
  // OR deny
  // deny();
});
```

### Practical Patterns

```typescript
// Pattern 1: Check before operations
async function ensureAllowance(chainId, token, amount) {
  const allowances = await sdk.getAllowance(chainId, [token]);
  const current = allowances[0]?.allowance || 0n;
  
  if (current < amount) {
    console.log('Setting allowance...');
    await sdk.setAllowance(chainId, [token], amount);
  } else {
    console.log('Sufficient allowance already set');
  }
}

// Pattern 2: Security-conscious approval
sdk.setOnAllowanceHook(({ allow, deny, sources }) => {
  const totalValue = sources.reduce((sum, s) => {
    return sum + parseFloat(s.allowance.minimum);
  }, 0);
  
  if (totalValue > 10000) {
    const confirmed = confirm(`High value approval: $${totalValue}. Proceed?`);
    if (confirmed) {
      allow(sources.map(() => 'min'));  // Use minimum, not max
    } else {
      deny();
    }
  } else {
    allow(sources.map(() => 'max'));
  }
});
```

---

## Feature 9: Intent Management

### Overview

View and manage transaction intents created through the Nexus system.

### Method: `getMyIntents()`

```typescript
async getMyIntents(page: number = 1): Promise<RequestForFunds[]>
```

**Example:**

```typescript
// Get first page of intents
const intents = await sdk.getMyIntents(1);

intents.forEach(intent => {
  console.log('\nIntent ID:', intent.id);
  console.log('Destination Chain:', intent.destinationChainID);
  console.log('Deposited:', intent.deposited);
  console.log('Fulfilled:', intent.fulfilled);
  console.log('Refunded:', intent.refunded);
  console.log('Expiry:', new Date(intent.expiry * 1000));
  
  console.log('Sources:');
  intent.sources.forEach(source => {
    console.log(`  Chain ${source.chainID}: ${source.value} tokens`);
  });
  
  console.log('Destinations:');
  intent.destinations.forEach(dest => {
    console.log(`  ${dest.tokenAddress}: ${dest.value}`);
  });
});

// Get second page
const moreIntents = await sdk.getMyIntents(2);
```

### Intent States

- **Created**: Intent submitted, awaiting deposit
- **Deposited**: User deposited source tokens
- **Fulfilled**: Solver delivered destination tokens
- **Refunded**: Intent expired, funds returned to user
- **Pending**: In progress

### Intent Lifecycle

```
1. Intent Created (user submits request)
   ↓
2. User Deposits (on source chains)
   ↓
3. Solver Fulfills (on destination chain)
   ↓
4. Complete (user receives funds)

OR

3. Intent Expires (no solver fulfills)
   ↓
4. User Claims Refund
```

---

## Feature 10: Event System & Progress Tracking

### Overview

The SDK provides comprehensive event system for tracking all operations in real-time.

### Event Constants

```typescript
import { NEXUS_EVENTS } from '@avail-project/nexus-core';

// Bridge & Transfer events
NEXUS_EVENTS.EXPECTED_STEPS              // 'expected_steps'
NEXUS_EVENTS.STEP_COMPLETE               // 'step_complete'

// Bridge & Execute events
NEXUS_EVENTS.BRIDGE_EXECUTE_EXPECTED_STEPS     // 'bridge_execute_expected_steps'
NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS    // 'bridge_execute_completed_steps'

// Swap events
NEXUS_EVENTS.SWAP_STEPS                  // 'swap_step'
```

### Progress Step Structure

```typescript
interface ProgressStep {
  typeID: string;  // Short identifier
  type: string;    // Human-readable description
  data?: {
    explorerURL?: string;
    transactionHash?: string;
    chainName?: string;
    amount?: string;
    symbol?: string;
    confirmations?: { confirmed: number; total: number };
    error?: string;
  };
}
```

### Step Type IDs

- **CS**: Chain Switch
- **TS**: Token Switch
- **BS**: Balance Sufficient
- **AL**: Allowance Set
- **AR**: Approval Required
- **IS**: Intent Successful
- **EX**: Execute Complete
- **BF**: Bridge Failed
- **EF**: Execute Failed

### Complete Event Tracking Example

```typescript
function useNexusProgress() {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [completed, setCompleted] = useState<ProgressStep[]>([]);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  
  useEffect(() => {
    // Bridge & Transfer progress
    const unsubExpected = sdk.nexusEvents.on(
      NEXUS_EVENTS.EXPECTED_STEPS,
      (expectedSteps) => {
        setSteps(expectedSteps);
        setCompleted([]);
      }
    );
    
    const unsubComplete = sdk.nexusEvents.on(
      NEXUS_EVENTS.STEP_COMPLETE,
      (step) => {
        setCompleted(prev => [...prev, step]);
        
        if (step.typeID === 'IS') {
          setCurrentOperation('Bridge completed!');
        }
      }
    );
    
    // Bridge & Execute progress
    const unsubBEExpected = sdk.nexusEvents.on(
      NEXUS_EVENTS.BRIDGE_EXECUTE_EXPECTED_STEPS,
      (expectedSteps) => {
        setSteps(expectedSteps);
        setCompleted([]);
      }
    );
    
    const unsubBEComplete = sdk.nexusEvents.on(
      NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS,
      (step) => {
        setCompleted(prev => [...prev, step]);
        
        if (step.typeID === 'EX') {
          setCurrentOperation('Execute completed!');
        }
      }
    );
    
    // Swap progress
    const unsubSwap = sdk.nexusEvents.on(
      NEXUS_EVENTS.SWAP_STEPS,
      (step) => {
        if (step.type === 'SWAP_COMPLETE') {
          setCurrentOperation('Swap completed!');
        }
      }
    );
    
    return () => {
      unsubExpected();
      unsubComplete();
      unsubBEExpected();
      unsubBEComplete();
      unsubSwap();
    };
  }, []);
  
  const progress = steps.length > 0 
    ? (completed.length / steps.length) * 100 
    : 0;
  
  return {
    steps,
    completed,
    progress,
    currentOperation
  };
}
```

### Account & Chain Change Events

```typescript
// Account changed
sdk.onAccountChanged((account) => {
  console.log('Account changed:', account);
  // SDK automatically deinitializes and reinitializes
  // Update your UI accordingly
});

// Chain changed
sdk.onChainChanged((chainId) => {
  console.log('Chain changed:', chainId);
  // Update UI to reflect new chain
});
```

---

## Feature 11: Utilities & Helpers

### Overview

All utility functions available under `sdk.utils`.

### Address Utilities

```typescript
// Validate address
const isValid = sdk.utils.isValidAddress('0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45');
console.log(isValid);  // true

// Truncate for display
const short = sdk.utils.truncateAddress('0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45');
console.log(short);  // '0x742d...b45'
```

### Balance Formatting

```typescript
// Format with decimals
const formatted = sdk.utils.formatBalance('1000000', 6);
console.log(formatted);  // '1.0'

// Parse to bigint
const units = sdk.utils.parseUnits('100.5', 6);
console.log(units);  // 100500000n

// Format bigint to string
const readable = sdk.utils.formatUnits(100500000n, 6);
console.log(readable);  // '100.5'
```

### Token Amount Formatting

```typescript
// Format with symbol
const amount = sdk.utils.formatTokenAmount('1000000', 'USDC');
console.log(amount);  // '1.0 USDC'

// Testnet formatting
const testnetAmount = sdk.utils.formatTestnetTokenAmount('1000000', 'USDC');
console.log(testnetAmount);  // '1.0 USDC'
```

### Chain & Token Metadata

```typescript
// Chain metadata
const chainMeta = sdk.utils.getChainMetadata(137);
console.log(chainMeta.name);  // 'Polygon'
console.log(chainMeta.nativeCurrency.symbol);  // 'MATIC'
console.log(chainMeta.blockExplorerUrls[0]);  // 'https://polygonscan.com'

// Token metadata
const tokenMeta = sdk.utils.getTokenMetadata('USDC');
console.log(tokenMeta.decimals);  // 6
console.log(tokenMeta.name);  // 'USD Coin'

// Mainnet-specific
const mainnetToken = sdk.utils.getMainnetTokenMetadata('USDC');

// Testnet-specific
const testnetToken = sdk.utils.getTestnetTokenMetadata('USDC');
```

### Validation

```typescript
// Check chain support
const isSupported = sdk.utils.isSupportedChain(137);
console.log(isSupported);  // true

// Check token support
const isSupportedToken = sdk.utils.isSupportedToken('USDC');
console.log(isSupportedToken);  // true
```

### Get Supported Chains

```typescript
const chains = sdk.utils.getSupportedChains();
chains.forEach(chain => {
  console.log(`${chain.name} (ID: ${chain.id})`);
  console.log(`  Logo: ${chain.logo}`);
});
```

### Chain ID Conversion

```typescript
// Decimal to hex
const hexChainId = sdk.utils.chainIdToHex(137);
console.log(hexChainId);  // '0x89'

// Hex to decimal
const decimalChainId = sdk.utils.hexToChainId('0x89');
console.log(decimalChainId);  // 137
```

### Swap Discovery

```typescript
const swapOptions = sdk.utils.getSwapSupportedChainsAndTokens();
console.log('Swap-enabled chains:', swapOptions);
```



## Feature 12: React Widgets Package

### Overview

`@avail-project/nexus-widgets` provides pre-built React components that wrap SDK functionality with built-in UI flows. Perfect for quickly adding cross-chain functionality to React applications.

**Installation:**

```bash
npm install @avail-project/nexus-widgets react react-dom viem
```

### NexusProvider Setup

Wrap your app with `NexusProvider`:

```tsx
import { NexusProvider } from '@avail-project/nexus-widgets';

export default function App() {
  return (
    <NexusProvider
      config={{
        network: 'testnet',  // or 'mainnet'
        debug: false         // Enable debug logs
      }}
    >
      <YourApp />
    </NexusProvider>
  );
}
```

### Wallet Integration

Forward wallet provider to SDK:

```tsx
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNexus } from '@avail-project/nexus-widgets';

export function WalletBridge() {
  const { connector, isConnected } = useAccount();
  const { setProvider } = useNexus();
  
  useEffect(() => {
    if (isConnected && connector?.getProvider) {
      connector.getProvider().then(setProvider);
    }
  }, [isConnected, connector, setProvider]);
  
  return null;
}
```

### Manual SDK Initialization (Optional)

For direct SDK access before using UI components:

```tsx
import { useNexus } from '@avail-project/nexus-widgets';

function MyComponent() {
  const { initializeSdk, sdk, isSdkInitialized } = useNexus();
  
  const handleInitialize = async () => {
    const provider = await window.ethereum;
    await initializeSdk(provider);
    
    // Now use SDK directly
    const balances = await sdk.getUnifiedBalances();
    console.log('Balances:', balances);
  };
  
  return (
    <button onClick={handleInitialize} disabled={isSdkInitialized}>
      {isSdkInitialized ? 'SDK Ready' : 'Initialize SDK'}
    </button>
  );
}
```

---

## Widget 1: BridgeButton

### API

```tsx
interface BridgeButtonProps {
  title?: string;
  prefill?: Partial<BridgeParams>;
  className?: string;
  children(props: { 
    onClick(): void; 
    isLoading: boolean 
  }): React.ReactNode;
}
```

### Examples

**Basic Usage:**

```tsx
import { BridgeButton } from '@avail-project/nexus-widgets';

<BridgeButton prefill={{ chainId: 137, token: 'USDC', amount: '100' }}>
  {({ onClick, isLoading }) => (
    <button onClick={onClick} disabled={isLoading}>
      {isLoading ? 'Bridging…' : 'Bridge 100 USDC → Polygon'}
    </button>
  )}
</BridgeButton>
```

**With Custom Styling:**

```tsx
<BridgeButton 
  prefill={{ chainId: 42161, token: 'ETH', amount: '0.1' }}
  className="my-bridge-button"
>
  {({ onClick, isLoading }) => (
    <div className="gradient-button" onClick={onClick}>
      {isLoading ? (
        <div className="flex items-center">
          <Spinner />
          <span>Bridging ETH...</span>
        </div>
      ) : (
        <span>Bridge 0.1 ETH to Arbitrum</span>
      )}
    </div>
  )}
</BridgeButton>
```

**Dynamic Amount:**

```tsx
function DynamicBridge() {
  const [amount, setAmount] = useState('100');
  
  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      
      <BridgeButton prefill={{ 
        chainId: 137, 
        token: 'USDC', 
        amount 
      }}>
        {({ onClick, isLoading }) => (
          <button onClick={onClick} disabled={isLoading}>
            Bridge {amount} USDC
          </button>
        )}
      </BridgeButton>
    </div>
  );
}
```

---

## Widget 2: TransferButton

### API

```tsx
interface TransferButtonProps {
  title?: string;
  prefill?: Partial<TransferParams>;
  className?: string;
  children(props: { 
    onClick(): void; 
    isLoading: boolean 
  }): React.ReactNode;
}
```

### Examples

**Basic Transfer:**

```tsx
import { TransferButton } from '@avail-project/nexus-widgets';

<TransferButton
  prefill={{
    chainId: 42161,
    token: 'USDC',
    amount: '50',
    recipient: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45'
  }}
>
  {({ onClick, isLoading }) => (
    <button onClick={onClick} disabled={isLoading}>
      {isLoading ? 'Sending…' : 'Send 50 USDC'}
    </button>
  )}
</TransferButton>
```

**Payment Flow:**

```tsx
function PaymentButton({ orderId, amount, merchantAddress }) {
  const [status, setStatus] = useState('pending');
  
  return (
    <TransferButton
      prefill={{
        chainId: 137,  // Polygon for low fees
        token: 'USDC',
        amount: amount.toString(),
        recipient: merchantAddress
      }}
    >
      {({ onClick, isLoading }) => (
        <button
          onClick={async () => {
            await onClick();
            setStatus('paid');
          }}
          disabled={isLoading || status === 'paid'}
          className="payment-button"
        >
          {isLoading ? 'Processing...' : 
           status === 'paid' ? 'Payment Complete ✓' : 
           `Pay $${amount} USDC`}
        </button>
      )}
    </TransferButton>
  );
}
```

---

## Widget 3: BridgeAndExecuteButton

### API

```tsx
type DynamicParamBuilder = (
  token: SUPPORTED_TOKENS,
  amount: string,
  chainId: SUPPORTED_CHAINS_IDS,
  userAddress: `0x${string}`
) => {
  functionParams: readonly unknown[];
  value?: string;
};

interface BridgeAndExecuteButtonProps {
  title?: string;
  contractAddress: `0x${string}`;          // REQUIRED
  contractAbi: Abi;                        // REQUIRED
  functionName: string;                    // REQUIRED
  buildFunctionParams: DynamicParamBuilder; // REQUIRED
  prefill?: { 
    toChainId?: number; 
    token?: SUPPORTED_TOKENS; 
    amount?: string 
  };
  className?: string;
  children(props: { 
    onClick(): void; 
    isLoading: boolean; 
    disabled: boolean 
  }): React.ReactNode;
}
```

### Examples

**Aave Supply Integration:**

```tsx
import { BridgeAndExecuteButton, TOKEN_METADATA, TOKEN_CONTRACT_ADDRESSES } from '@avail-project/nexus-widgets';
import { parseUnits } from 'viem';

<BridgeAndExecuteButton
  contractAddress="0x794a61358D6845594F94dc1DB02A252b5b4814aD"
  contractAbi={[
    {
      name: 'supply',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'asset', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'onBehalfOf', type: 'address' },
        { name: 'referralCode', type: 'uint16' }
      ],
      outputs: []
    }
  ] as const}
  functionName="supply"
  buildFunctionParams={(token, amount, chainId, userAddress) => {
    const decimals = TOKEN_METADATA[token].decimals;
    const amountWei = parseUnits(amount, decimals);
    const tokenAddr = TOKEN_CONTRACT_ADDRESSES[token][chainId];
    
    return { 
      functionParams: [tokenAddr, amountWei, userAddress, 0] 
    };
  }}
  prefill={{
    toChainId: 42161,
    token: 'USDT'
  }}
>
  {({ onClick, isLoading, disabled }) => (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className="w-full bg-purple-600 hover:bg-purple-700"
    >
      {isLoading ? 'Processing…' : 'Bridge & Supply to Aave'}
    </button>
  )}
</BridgeAndExecuteButton>
```

**Compound V3 Supply:**

```tsx
<BridgeAndExecuteButton
  contractAddress="0xc3d688B66703497DAA19211EEdff47f25384cdc3"
  contractAbi={[
    {
      inputs: [
        { name: 'asset', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'supply',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ] as const}
  functionName="supply"
  buildFunctionParams={(token, amount, chainId) => {
    const amountWei = parseUnits(amount, TOKEN_METADATA[token].decimals);
    const tokenAddr = TOKEN_CONTRACT_ADDRESSES[token][chainId];
    return { functionParams: [tokenAddr, amountWei] };
  }}
  prefill={{ toChainId: 1, token: 'USDC' }}
>
  {({ onClick, isLoading }) => (
    <button onClick={onClick} disabled={isLoading}>
      {isLoading ? 'Processing…' : 'Supply to Compound'}
    </button>
  )}
</BridgeAndExecuteButton>
```

**DeFi Dashboard Integration:**

```tsx
function DeFiProtocolCard({ protocol }) {
  return (
    <div className="protocol-card">
      <h3>{protocol.name}</h3>
      <p>APY: {protocol.apy}%</p>
      
      <BridgeAndExecuteButton
        contractAddress={protocol.contractAddress}
        contractAbi={protocol.abi}
        functionName={protocol.depositFunction}
        buildFunctionParams={protocol.buildParams}
        prefill={{ 
          toChainId: protocol.chainId,
          token: 'USDC'
        }}
      >
        {({ onClick, isLoading }) => (
          <button 
            onClick={onClick} 
            disabled={isLoading}
            className="deposit-button"
          >
            {isLoading ? 'Depositing...' : `Deposit & Earn ${protocol.apy}%`}
          </button>
        )}
      </BridgeAndExecuteButton>
    </div>
  );
}
```

---

## Widget 4: SwapButton

### API

```tsx
interface SwapButtonProps {
  title?: string;
  prefill?: Omit<SwapInputData, 'toAmount'>;
  className?: string;
  children(props: { 
    onClick(): void; 
    isLoading: boolean 
  }): React.ReactNode;
}

interface SwapInputData {
  fromChainID?: number;
  toChainID?: number;
  fromTokenAddress?: string;
  toTokenAddress?: string;
  fromAmount?: string | number;
}
```

### Examples

**Basic Swap:**

```tsx
import { SwapButton } from '@avail-project/nexus-widgets';

<SwapButton
  prefill={{
    fromChainID: 137,    // Polygon
    fromTokenAddress: 'USDC',
    toChainID: 42161,    // Arbitrum
    toTokenAddress: '0x13ad51ed4f1b7e9dc168d8a00cb3f4ddd85efa60',  // LDO
    fromAmount: '100'
  }}
>
  {({ onClick, isLoading }) => (
    <button onClick={onClick} disabled={isLoading}>
      {isLoading ? 'Swapping…' : 'Swap 100 USDC → LDO'}
    </button>
  )}
</SwapButton>
```

**Flexible Swap UI:**

```tsx
function SwapInterface() {
  return (
    <div className="swap-card">
      <h2>Cross-Chain Swap</h2>
      <p>Swap tokens across any supported chains</p>
      
      <SwapButton>
        {({ onClick, isLoading }) => (
          <button
            onClick={onClick}
            disabled={isLoading}
            className="gradient-button"
          >
            {isLoading ? (
              <div className="flex items-center">
                <Spinner className="mr-2" />
                Processing Swap...
              </div>
            ) : (
              'Start Swap'
            )}
          </button>
        )}
      </SwapButton>
    </div>
  );
}
```

---

## Widget Utilities & Exports

### Constants Available

```tsx
import {
  TOKEN_CONTRACT_ADDRESSES,
  TOKEN_METADATA,
  SUPPORTED_CHAINS,
  DESTINATION_SWAP_TOKENS,
  NEXUS_EVENTS
} from '@avail-project/nexus-widgets';

// Use in your components
const usdcOnPolygon = TOKEN_CONTRACT_ADDRESSES.USDC[137];
const usdcDecimals = TOKEN_METADATA.USDC.decimals;
```

### Type Exports

```tsx
import type {
  SUPPORTED_TOKENS,
  SUPPORTED_CHAIN_IDS,
  BridgeParams,
  TransferParams,
  UserAsset
} from '@avail-project/nexus-widgets';
```

---

## Advanced Widget Patterns

### Pattern 1: Widget with Balance Display

```tsx
function BridgeWithBalance() {
  const { sdk, isSdkInitialized } = useNexus();
  const [balance, setBalance] = useState<string>('0');
  
  useEffect(() => {
    if (isSdkInitialized) {
      sdk.getUnifiedBalance('USDC').then(b => {
        setBalance(b?.balance || '0');
      });
    }
  }, [sdk, isSdkInitialized]);
  
  return (
    <div>
      <p>Your USDC Balance: {balance}</p>
      
      <BridgeButton prefill={{ chainId: 137, token: 'USDC', amount: '100' }}>
        {({ onClick, isLoading }) => (
          <button onClick={onClick} disabled={isLoading || parseFloat(balance) < 100}>
            {isLoading ? 'Bridging...' : 'Bridge 100 USDC'}
          </button>
        )}
      </BridgeButton>
    </div>
  );
}
```

### Pattern 2: Multi-Protocol Dashboard

```tsx
function YieldDashboard() {
  const protocols = [
    {
      name: 'Aave V3',
      chainId: 42161,
      apy: 5.2,
      contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      // ... abi and buildParams
    },
    {
      name: 'Compound V3',
      chainId: 1,
      apy: 4.8,
      // ...
    }
  ];
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {protocols.map(protocol => (
        <div key={protocol.name} className="card">
          <h3>{protocol.name}</h3>
          <p>APY: {protocol.apy}%</p>
          <p>Chain: {protocol.chainId}</p>
          
          <BridgeAndExecuteButton
            contractAddress={protocol.contractAddress}
            contractAbi={protocol.abi}
            functionName="supply"
            buildFunctionParams={protocol.buildParams}
            prefill={{ toChainId: protocol.chainId, token: 'USDC' }}
          >
            {({ onClick, isLoading }) => (
              <button onClick={onClick} disabled={isLoading}>
                Deposit
              </button>
            )}
          </BridgeAndExecuteButton>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Error Handling

```tsx
function BridgeWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);
  
  return (
    <div>
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <BridgeButton prefill={{ chainId: 137, token: 'USDC', amount: '100' }}>
        {({ onClick, isLoading }) => (
          <button
            onClick={async () => {
              try {
                setError(null);
                await onClick();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Bridge failed');
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Bridge USDC'}
          </button>
        )}
      </BridgeButton>
    </div>
  );
}
```

---

## Prefill Behavior

Values in `prefill` are **locked** in the widget UI and appear as read-only fields:

| Widget                   | Prefill Keys                                              | Behavior     |
|-------------------------|----------------------------------------------------------|--------------|
| BridgeButton            | `chainId`, `token`, `amount`                              | Read-only    |
| TransferButton          | `chainId`, `token`, `amount`, `recipient`                 | Read-only    |
| BridgeAndExecuteButton  | `toChainId`, `token`, `amount`                            | Read-only    |
| SwapButton              | `fromChainID`, `toChainID`, `fromTokenAddress`, `toTokenAddress`, `fromAmount` | Read-only |

**Why Prefill?**
- Enforce specific flows
- Simplify UX for targeted actions
- Reduce user errors
- Create branded experiences

---

## Best Practices for Widgets

✅ **DO:**
- Initialize SDK before using widgets
- Handle loading states properly
- Show clear error messages
- Validate wallet connection
- Test on testnet first
- Use appropriate chain for fees (Polygon/Base for frequent operations)

❌ **DON'T:**
- Use widgets without NexusProvider
- Forget to forward wallet provider
- Ignore error handling
- Use mainnet without testing
- Assume user has balance
- Skip simulation on large amounts

---

## Complete React App Example

```tsx
// App.tsx
import { NexusProvider } from '@avail-project/nexus-widgets';
import { WalletProvider } from './WalletProvider';
import { Dashboard } from './Dashboard';

export default function App() {
  return (
    <NexusProvider config={{ network: 'testnet', debug: true }}>
      <WalletProvider>
        <Dashboard />
      </WalletProvider>
    </NexusProvider>
  );
}

// Dashboard.tsx
import { BridgeButton, TransferButton, useNexus } from '@avail-project/nexus-widgets';
import { useEffect, useState } from 'react';

export function Dashboard() {
  const { sdk, isSdkInitialized } = useNexus();
  const [balances, setBalances] = useState([]);
  
  useEffect(() => {
    if (isSdkInitialized) {
      sdk.getUnifiedBalances().then(setBalances);
    }
  }, [sdk, isSdkInitialized]);
  
  if (!isSdkInitialized) {
    return <div>Initializing SDK...</div>;
  }
  
  return (
    <div className="dashboard">
      <h1>My Cross-Chain Wallet</h1>
      
      <section className="balances">
        <h2>Balances</h2>
        {balances.map(asset => (
          <div key={asset.symbol}>
            {asset.symbol}: {asset.balance} (${asset.balanceInFiat})
          </div>
        ))}
      </section>
      
      <section className="actions">
        <BridgeButton prefill={{ chainId: 137, token: 'USDC', amount: '100' }}>
          {({ onClick, isLoading }) => (
            <button onClick={onClick} disabled={isLoading}>
              Bridge to Polygon
            </button>
          )}
        </BridgeButton>
        
        <TransferButton prefill={{ chainId: 42161, token: 'USDC', amount: '50' }}>
          {({ onClick, isLoading }) => (
            <button onClick={onClick} disabled={isLoading}>
              Send to Friend
            </button>
          )}
        </TransferButton>
      </section>
    </div>
  );
}
```

---

## Summary & Quick Reference

### Installation

```bash
# Core SDK
npm install @avail-project/nexus-core

# React Widgets
npm install @avail-project/nexus-widgets react react-dom viem
```

### Core SDK Quick Start

```typescript
import { NexusSDK } from '@avail-project/nexus-core';

const sdk = new NexusSDK({ network: 'mainnet' });
await sdk.initialize(window.ethereum);

// Get balances
const balances = await sdk.getUnifiedBalances();

// Bridge
await sdk.bridge({ token: 'USDC', amount: 100, chainId: 137 });

// Transfer
await sdk.transfer({ 
  token: 'USDC', 
  amount: 50, 
  chainId: 42161, 
  recipient: '0x...' 
});

// Execute
await sdk.execute({
  toChainId: 1,
  contractAddress: '0x...',
  contractAbi: [...],
  functionName: 'supply',
  buildFunctionParams: (token, amount, chainId, user) => ({
    functionParams: [...]
  }),
  tokenApproval: { token: 'USDC', amount: '1000000' }
});
```

### React Widgets Quick Start

```tsx
import { NexusProvider, BridgeButton } from '@avail-project/nexus-widgets';

function App() {
  return (
    <NexusProvider config={{ network: 'mainnet' }}>
      <BridgeButton prefill={{ token: 'USDC', amount: '100', chainId: 137 }}>
        {({ onClick, isLoading }) => (
          <button onClick={onClick} disabled={isLoading}>
            Bridge USDC
          </button>
        )}
      </BridgeButton>
    </NexusProvider>
  );
}
```

### Supported Networks

**Mainnet:** Ethereum, Optimism, Polygon, Arbitrum, Avalanche, Base, Scroll, Sophon, Kaia, BNB, HyperEVM  
**Testnet:** Sepolia, Optimism Sepolia, Polygon Amoy, Arbitrum Sepolia, Base Sepolia, Monad Testnet

### Supported Tokens

**ETH, USDC, USDT** across all chains

---

## Error Handling & Debugging

This section documents all possible errors you may encounter when using the Nexus SDK, organized by feature.

### Common Error Types

The SDK uses standardized error types:

```typescript
// From viem
UserRejectedRequestError   // User denied action in wallet
InternalRpcError           // Internal RPC/blockchain error

// From SDK
Error                      // Standard JavaScript Error
```

---

### Feature 1: Initialization Errors

#### ❌ `"use setEVMProvider before calling init()"`

**When it occurs:**
- Calling `sdk.initialize()` without providing a provider

**Solution:**
```typescript
// ❌ Wrong
await sdk.initialize();

// ✅ Correct
await sdk.initialize(window.ethereum);
```

#### ❌ `"Backend initialization failed"`

**When it occurs:**
- Cannot connect to Avail's simulation backend
- Network connectivity issues

**Solution:**
```typescript
try {
  await sdk.initialize(window.ethereum);
} catch (error) {
  console.error('SDK initialization failed:', error);
  // Check network connection
  // Retry initialization
}
```

---

### Feature 2: Balance Management Errors

#### ❌ `"Adapter not initialized"`

**When it occurs:**
- Calling `getUnifiedBalances()` before SDK is initialized

**Solution:**
```typescript
// ❌ Wrong
const sdk = new NexusSDK({ network: 'mainnet' });
const balances = await sdk.getUnifiedBalances(); // Error!

// ✅ Correct
const sdk = new NexusSDK({ network: 'mainnet' });
await sdk.initialize(window.ethereum);
const balances = await sdk.getUnifiedBalances(); // Works
```

#### ❌ `"Token SYMBOL not supported on chain CHAIN_NAME"`

**When it occurs:**
- Querying balance for unsupported token on specific chain

**Solution:**
```typescript
try {
  const balance = await sdk.getUnifiedBalance('RANDOM_TOKEN');
} catch (error) {
  console.error('Token not supported:', error.message);
  // Fall back to supported tokens: ETH, USDC, USDT
}
```

---

### Feature 3: Transfer Errors

#### ❌ `"ca not applicable"`

**This is the most common error for transfers. It occurs when:**

1. **Transaction is not recognized as a token transfer**
   - Not an ERC-20 `transfer()` call
   - Not a native token transfer
   - Transaction data doesn't match expected format

2. **Transaction handler returns null**
   - Token not supported on the chain
   - Transaction structure is invalid

3. **Direct transfer is possible (not actually an error)**
   - SDK skips chain abstraction when you have sufficient balance + gas on destination
   - In this case, `simulateTransfer()` returns `null` for `handler`
   - The transfer still executes via direct EVM transaction

**Solution:**
```typescript
try {
  const result = await sdk.simulateTransfer({
    token: 'USDC',
    amount: 50,
    chainId: 137,
    recipient: '0x...'
  });
  
  // If result is null, direct transfer will be used
  if (!result) {
    console.log('Direct transfer - no chain abstraction needed');
  }
} catch (error) {
  if (error.message === 'ca not applicable') {
    console.log('This transaction cannot use chain abstraction');
    console.log('Possible reasons:');
    console.log('- Token not supported');
    console.log('- Invalid transaction format');
    console.log('- Direct transfer available');
  }
}
```

**When "ca not applicable" means success:**
```typescript
// You have 100 USDC + 0.01 ETH on Arbitrum
// You want to send 50 USDC on Arbitrum

const simulation = await sdk.simulateTransfer({
  token: 'USDC',
  amount: 50,
  chainId: 42161,  // Arbitrum
  recipient: '0x...'
});

// simulation returns null because direct transfer is optimal!
// The SDK will use direct EVM transfer instead of chain abstraction

const result = await sdk.transfer({
  token: 'USDC',
  amount: 50,
  chainId: 42161,
  recipient: '0x...'
});
// ✅ Transfer succeeds via direct transaction
```

#### ❌ `"Token not supported on this chain."`

**When it occurs:**
- Transferring unsupported token
- Token symbol doesn't exist on target chain

**Solution:**
```typescript
// ❌ Wrong
await sdk.transfer({
  token: 'RANDOM_TOKEN',  // Not supported
  amount: 100,
  chainId: 137,
  recipient: '0x...'
});

// ✅ Correct - use supported tokens
await sdk.transfer({
  token: 'USDC',  // ✅ Supported
  amount: 100,
  chainId: 137,
  recipient: '0x...'
});
```

#### ❌ `"Insufficient balance."`

**When it occurs:**
- Total balance across all chains is less than transfer amount + fees
- Check `intent.isAvailableBalanceInsufficient` flag

**Solution:**
```typescript
try {
  const simulation = await sdk.simulateTransfer({
    token: 'USDC',
    amount: 1000,
    chainId: 137,
    recipient: '0x...'
  });
  
  if (simulation.intent.isAvailableBalanceInsufficient) {
    console.error('Insufficient balance across all chains');
    console.log('Required:', 1000 + parseFloat(simulation.intent.fees.total));
    console.log('Available:', /* check balances */);
    return;
  }
  
  await sdk.transfer({/* ... */});
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    console.error('Not enough tokens!');
  }
}
```

#### ❌ `"transfer: missing params"`

**When it occurs:**
- Required parameters are missing from transfer request

**Solution:**
```typescript
// ❌ Wrong
await sdk.transfer({
  token: 'USDC',
  amount: 100
  // Missing chainId and recipient!
});

// ✅ Correct
await sdk.transfer({
  token: 'USDC',
  amount: 100,
  chainId: 137,
  recipient: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45'
});
```

#### ❌ `"User denied intent."`

**When it occurs:**
- User rejects the intent confirmation in your UI
- Happens when calling `deny()` in `onIntent` hook

**Solution:**
```typescript
sdk.setOnIntentHook(({ intent, allow, deny }) => {
  const confirmed = confirm(
    `Transfer ${intent.destination.amount} USDC?\n` +
    `Total fees: ${intent.fees.total}`
  );
  
  if (confirmed) {
    allow();
  } else {
    deny(); // Throws "User denied intent."
  }
});

try {
  await sdk.transfer({/* ... */});
} catch (error) {
  if (error.message.includes('User denied intent')) {
    console.log('User cancelled the transfer');
  }
}
```

---

### Feature 4: Bridge Errors

Bridge operations share most errors with Transfer. Additional bridge-specific errors:

#### ❌ `"Bridge failed: REASON"`

**When it occurs:**
- Bridge operation fails during execution

**Solution:**
```typescript
try {
  const result = await sdk.bridge({
    token: 'USDC',
    amount: 100,
    chainId: 137
  });
  
  if (!result.success) {
    console.error('Bridge failed:', result.error);
  }
} catch (error) {
  console.error('Bridge error:', error.message);
  // Implement retry logic
}
```

---

### Feature 5: Execute Errors

#### ❌ `"No accounts available"`

**When it occurs:**
- Wallet is not connected
- No account selected in wallet

**Solution:**
```typescript
// Check wallet connection first
const accounts = await sdk.getEVMClient().getAddresses();
if (!accounts || accounts.length === 0) {
  console.error('Please connect your wallet');
  return;
}

await sdk.execute({/* ... */});
```

#### ❌ `"chain not supported"`

**When it occurs:**
- Trying to execute on unsupported chain

**Solution:**
```typescript
// Supported chains: 1, 10, 137, 42161, 43114, 8453, 534352, etc.
await sdk.execute({
  toChainId: 137,  // ✅ Polygon supported
  // NOT 56 (BSC not supported for execute)
  /* ... */
});
```

#### ❌ `"Invalid contract parameters: REASON"`

**When it occurs:**
- `buildFunctionParams` returns invalid parameters
- Parameter types don't match ABI

**Solution:**
```typescript
await sdk.execute({
  toChainId: 1,
  contractAddress: '0x...',
  contractAbi: AaveABI,
  functionName: 'supply',
  buildFunctionParams: (token, amount, chainId, userAddress) => {
    // ❌ Wrong - missing required fields
    return { functionParams: [] };
    
    // ✅ Correct - match ABI exactly
    return {
      functionParams: [
        tokenAddress,      // address
        BigInt(amount),    // uint256
        userAddress,       // address
        0                  // uint16 referralCode
      ]
    };
  },
  tokenApproval: { token: 'USDC', amount: '1000000' }
});
```

#### ❌ `"Failed to encode contract call: REASON"`

**When it occurs:**
- Contract ABI doesn't match function name
- Function doesn't exist in ABI
- Parameter types mismatch

**Solution:**
```typescript
// ❌ Wrong
await sdk.execute({
  contractAbi: [...],
  functionName: 'supplyy',  // Typo!
  /* ... */
});

// ✅ Correct
await sdk.execute({
  contractAbi: AaveABI,
  functionName: 'supply',  // ✅ Exact match
  /* ... */
});
```

#### ❌ `"Transaction simulation failed: REASON"`

**When it occurs:**
- Contract call will revert
- Gas estimation fails
- Invalid parameters

**Solution:**
```typescript
try {
  await sdk.execute({/* ... */});
} catch (error) {
  if (error.message.includes('simulation failed')) {
    console.error('Transaction will fail:', error.message);
    // Check:
    // - Sufficient token approval
    // - Valid parameters
    // - Contract not paused
  }
}
```

#### ❌ `"Transaction rejected by user"`

**When it occurs:**
- User rejects transaction in MetaMask/wallet

**Solution:**
```typescript
try {
  await sdk.execute({/* ... */});
} catch (error) {
  if (error.code === 4001 || error.message.includes('rejected by user')) {
    console.log('User cancelled transaction');
    // Don't show error, just acknowledge cancellation
  }
}
```

#### ❌ `"Insufficient funds for transaction"`

**When it occurs:**
- Not enough gas token on execution chain
- Trying to send more tokens than balance

**Solution:**
```typescript
// Check gas balance before executing
const balance = await sdk.getUnifiedBalance('ETH');
const ethOnTargetChain = balance?.breakdown.find(b => b.chain.id === 1);

if (!ethOnTargetChain || parseFloat(ethOnTargetChain.balance) < 0.01) {
  console.error('Insufficient gas on Ethereum');
  // Bridge ETH first or use bridgeAndExecute
  return;
}

await sdk.execute({/* ... */});
```

---

### Feature 6: BridgeAndExecute Errors

Combines bridge + execute errors, plus:

#### ❌ `"Execute transaction failed: REASON"`

**When it occurs:**
- Execute phase fails after successful bridge
- This is critical as tokens are already on destination chain

**Solution:**
```typescript
try {
  const result = await sdk.bridgeAndExecute({/* ... */});
  
  if (!result.success) {
    console.error('Bridge and execute failed:', result.error);
    
    // Tokens may be on destination chain
    // Check balance and retry execute manually
    const balances = await sdk.getUnifiedBalances();
    console.log('Check if tokens arrived:', balances);
  }
} catch (error) {
  console.error('Critical error:', error.message);
  // Implement recovery logic
}
```

---

### Feature 7: Swap Errors

#### ❌ `"destination chain not supported"`

**When it occurs:**
- Swapping to/from unsupported chain for swaps

**Solution:**
```typescript
// ❌ Wrong
await sdk.swapWithExactIn({
  inputToken: 'USDC',
  outputToken: 'PEPE',
  fromChainId: 999,  // Unsupported chain
  toChainId: 1,
  inputAmount: '100'
});

// ✅ Correct - use supported chains
await sdk.swapWithExactIn({
  inputToken: 'USDC',
  outputToken: 'PEPE',
  fromChainId: 137,  // ✅ Polygon
  toChainId: 1,      // ✅ Ethereum
  inputAmount: '100'
});
```

#### ❌ `"Token(ADDRESS) not found on chain: CHAIN_ID"`

**When it occurs:**
- Swapping unsupported token
- Token doesn't exist on specified chain

**Solution:**
```typescript
// Check supported tokens first
const { supportedChains, supportedTokens } = 
  await sdk.getSwapSupportedChainsAndTokens();

console.log('Supported tokens:', supportedTokens);

// Use only tokens from supportedTokens list
```

#### ❌ `"Insufficient balance: available:X, required:Y"`

**When it occurs:**
- Not enough balance for swap input amount
- **Token address mismatch**: Using incorrect token addresses that don't match SDK expectations

**Solutions:**

**1. Check actual balance:**
```typescript
try {
  await sdk.swapWithExactIn({
    inputToken: 'USDC',
    outputToken: 'ETH',
    fromChainId: 137,
    toChainId: 1,
    inputAmount: '10000'  // Too much!
  });
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    const match = error.message.match(/available:([\d.]+)/);
    const available = match ? match[1] : 'unknown';
    console.error(`You only have ${available} USDC`);
  }
}
```

**2. Fix token address mismatch (if required:0):**
```typescript
// If error shows "required:0", check token addresses match SDK expectations
const supportedOptions = sdk.utils.getSwapSupportedChainsAndTokens();
const polygonChain = supportedOptions.find(chain => chain.id === 137);
const supportedUSDC = polygonChain.tokens.find(token => token.symbol === 'USDC');

console.log('SDK expects USDC address:', supportedUSDC.contractAddress);
// Use the SDK's expected address in your swap call
```

#### ❌ `"COT not found on chain CHAIN_ID"`

**When it occurs:**
- Internal swap routing error
- Chain doesn't support required currency

**Solution:**
```typescript
// This is rare - report to Avail team
console.error('Swap routing failed - unsupported route');
// Try different token pair or chains
```

---

### Feature 8: Allowance Errors

#### ❌ `"User denied allowance."`

**When it occurs:**
- User rejects allowance in `onAllowance` hook
- User cancels approval transaction

**Solution:**
```typescript
sdk.setOnAllowanceHook(({ sources, allow, deny }) => {
  const confirmed = confirm('Approve token spending?');
  
  if (confirmed) {
    allow(['max', 'max']); // Approve all
  } else {
    deny(); // Throws "User denied allowance."
  }
});

try {
  await sdk.transfer({/* ... */});
} catch (error) {
  if (error.message.includes('User denied allowance')) {
    console.log('User declined token approval');
    // Show explanation of why approval is needed
  }
}
```

#### ❌ `"Token contract address not found for TOKEN on chain CHAIN_ID"`

**When it occurs:**
- Setting allowance for unsupported token

**Solution:**
```typescript
// Only set allowance for supported tokens
const allowance = await sdk.getAllowance({
  token: 'USDC',  // ✅ Supported
  chainId: 137
});
```

---

### Feature 9: General Transaction Errors

#### ❌ `"Chain CHAIN_ID is not configured in wallet"`

**When it occurs:**
- Wallet doesn't have target chain added
- User needs to add chain manually

**Solution:**
```typescript
try {
  await sdk.bridge({ token: 'USDC', amount: 100, chainId: 42161 });
} catch (error) {
  if (error.code === 4902 || error.message.includes('not configured')) {
    console.log('Please add Arbitrum to your wallet');
    // Provide "Add Chain" button using wallet_addEthereumChain
  }
}
```

#### ❌ `"Unknown handler"`

**When it occurs:**
- Internal routing error
- Transaction type not recognized

**Solution:**
```typescript
// This should not happen - report bug to Avail
console.error('Internal SDK error:', error);
```

---

### Best Practices for Error Handling

```typescript
// ✅ Comprehensive error handling pattern
async function safeTransfer(params) {
  try {
    // 1. Check initialization
    if (!sdk.isInitialized()) {
      throw new Error('SDK not initialized');
    }
    
    // 2. Validate parameters
    if (!params.token || !params.amount || !params.chainId || !params.recipient) {
      throw new Error('Missing required parameters');
    }
    
    // 3. Check balance
    const balance = await sdk.getUnifiedBalance(params.token);
    const totalAvailable = parseFloat(balance?.balance || '0');
    
    if (totalAvailable < params.amount) {
      throw new Error(`Insufficient balance: have ${totalAvailable}, need ${params.amount}`);
    }
    
    // 4. Simulate first
    let simulation;
    try {
      simulation = await sdk.simulateTransfer(params);
    } catch (simError) {
      if (simError.message === 'ca not applicable') {
        console.log('Will use direct transfer - continuing');
      } else {
        throw simError;
      }
    }
    
    // 5. Check simulation results
    if (simulation?.intent?.isAvailableBalanceInsufficient) {
      const fees = parseFloat(simulation.intent.fees.total);
      throw new Error(`Insufficient balance including fees: need ${params.amount + fees}`);
    }
    
    // 6. Execute transfer
    const result = await sdk.transfer(params);
    
    // 7. Check result
    if (!result.success) {
      throw new Error(result.error || 'Transfer failed');
    }
    
    return result;
    
  } catch (error) {
    // 8. Handle specific errors
    if (error.message.includes('User denied')) {
      console.log('User cancelled');
      return { success: false, cancelled: true };
    }
    
    if (error.message.includes('Insufficient')) {
      console.error('Not enough tokens:', error.message);
      return { success: false, error: 'insufficient_balance' };
    }
    
    if (error.message.includes('not supported')) {
      console.error('Unsupported token or chain:', error.message);
      return { success: false, error: 'unsupported' };
    }
    
    // 9. Unknown error
    console.error('Transfer failed:', error);
    return { success: false, error: error.message };
  }
}
```

### Error Recovery Patterns

**Pattern 1: Retry with Exponential Backoff**
```typescript
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Don't retry user rejections
      if (error.message.includes('User denied')) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
await retryOperation(() => sdk.bridge({ token: 'USDC', amount: 100, chainId: 137 }));
```

**Pattern 2: Graceful Degradation**
```typescript
async function smartTransfer(params) {
  try {
    // Try chain abstraction first
    return await sdk.transfer(params);
  } catch (error) {
    if (error.message === 'ca not applicable') {
      // Fall back to direct transfer if possible
      console.log('Using direct transfer fallback');
      // SDK already does this automatically
      return await sdk.transfer(params);
    }
    throw error;
  }
}
```

**Pattern 3: User-Friendly Error Messages**
```typescript
function getUserFriendlyError(error: Error): string {
  const msg = error.message.toLowerCase();
  
  if (msg.includes('insufficient balance')) {
    return 'You don\'t have enough tokens for this transaction.';
  }
  if (msg.includes('user denied')) {
    return 'Transaction was cancelled.';
  }
  if (msg.includes('not supported')) {
    return 'This token or chain is not supported.';
  }
  if (msg.includes('ca not applicable')) {
    return 'Direct transfer will be used instead.';
  }
  if (msg.includes('insufficient funds')) {
    return 'You don\'t have enough gas (ETH) for this transaction.';
  }
  if (msg.includes('simulation failed')) {
    return 'This transaction would fail. Please check your parameters.';
  }
  
  return 'Transaction failed. Please try again.';
}

// Usage
try {
  await sdk.transfer({/* ... */});
} catch (error) {
  alert(getUserFriendlyError(error));
}
```