// Network configurations for Avail Nexus SDK

export const TESTNET_CHAINS = {
  // Ethereum Sepolia
  11155111: {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.drpc.org'],
    blockExplorers: ['https://sepolia.etherscan.io'],
    testnet: true
  },
  // Optimism Sepolia
  11155420: {
    id: 11155420,
    name: 'Optimism Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.optimism.io'],
    blockExplorers: ['https://sepolia-optimistic.etherscan.io'],
    testnet: true
  },
  // Polygon Amoy
  80002: {
    id: 80002,
    name: 'Polygon Amoy',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorers: ['https://amoy.polygonscan.com'],
    testnet: true
  },
  // Arbitrum Sepolia
  421614: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorers: ['https://sepolia.arbiscan.io'],
    testnet: true
  },
  // Base Sepolia
  84532: {
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorers: ['https://sepolia-explorer.base.org'],
    testnet: true
  },
  // Monad Testnet
  1014: {
    id: 1014,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: ['https://testnet1.monad.xyz'],
    blockExplorers: ['https://testnet1.monad.xyz'],
    testnet: true
  }
} as const;

export const MAINNET_CHAINS = {
  // Ethereum
  1: {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://eth.drpc.org'],
    blockExplorers: ['https://etherscan.io'],
    testnet: false
  },
  // Optimism
  10: {
    id: 10,
    name: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorers: ['https://optimistic.etherscan.io'],
    testnet: false
  },
  // Polygon
  137: {
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorers: ['https://polygonscan.com'],
    testnet: false
  },
  // Arbitrum
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorers: ['https://arbiscan.io'],
    testnet: false
  },
  // Base
  8453: {
    id: 8453,
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorers: ['https://basescan.org'],
    testnet: false
  },
  // Avalanche
  43114: {
    id: 43114,
    name: 'Avalanche',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorers: ['https://snowtrace.io'],
    testnet: false
  }
} as const;

export const SUPPORTED_TOKENS = ['ETH', 'USDC', 'USDT'] as const;

export type SupportedToken = typeof SUPPORTED_TOKENS[number];
export type TestnetChainId = keyof typeof TESTNET_CHAINS;
export type MainnetChainId = keyof typeof MAINNET_CHAINS;
export type ChainId = TestnetChainId | MainnetChainId;

export const getChainConfig = (chainId: ChainId, isTestnet: boolean = false) => {
  if (isTestnet) {
    return TESTNET_CHAINS[chainId as TestnetChainId];
  }
  return MAINNET_CHAINS[chainId as MainnetChainId];
};

export const getAvailableChains = (isTestnet: boolean = false) => {
  return isTestnet ? TESTNET_CHAINS : MAINNET_CHAINS;
};

export const DEFAULT_CHAINS = {
  testnet: {
    source: 11155111, // Sepolia
    destination: 80002 // Polygon Amoy
  },
  mainnet: {
    source: 1, // Ethereum
    destination: 137 // Polygon
  }
};