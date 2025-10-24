/**
 * DeFi Protocol Configuration
 * Updated: October 2024
 *
 * This file contains the latest contract addresses and configurations for major DeFi protocols
 * across different blockchain networks. All addresses have been verified from official sources.
 */

export interface DeFiProtocolConfig {
  name: string;
  description: string;
  icon: string;
  category: 'lending' | 'yield-farming' | 'liquid-staking';
  websites: {
    main: string;
    docs: string;
  };
  networks: {
    [chainId: number]: {
      available: boolean;
      contractAddress: string;
      functionName: string;
      abi: any[];
      apy?: {
        estimated: number;
        source: string;
        lastUpdated: string;
      };
      tvl?: string;
      recommendations?: {
        bestFor: string[];
        riskLevel: 'low' | 'medium' | 'high';
        gasEfficiency: 'low' | 'medium' | 'high';
      };
    };
  };
}

export interface ChainRecommendations {
  [chainId: number]: {
    name: string;
    bestProtocols: {
      lending: string[];
      yieldFarming: string[];
      liquidStaking: string[];
    };
    gasToken: string;
    avgGasCost: {
      supply: string;
      withdraw: string;
    };
  };
}

// Chain IDs mapping
export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  AVALANCHE: 43114,
  SCROLL: 534352,
  FANTOM: 250,
  GNOSIS: 100,
  BSC: 56
} as const;

// Standard ABI definitions
const AAVE_V3_POOL_ABI = [
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
];

const COMPOUND_V3_ABI = [
  {
    name: 'supply',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  }
];

const YEARN_V3_VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' }
    ],
    outputs: [{ name: 'shares', type: 'uint256' }]
  }
];

// DeFi Protocol Configurations
export const DEFI_PROTOCOLS: Record<string, DeFiProtocolConfig> = {
  aave: {
    name: 'Aave V3',
    description: 'Leading decentralized lending protocol with variable and stable interest rates',
    icon: '🏛️',
    category: 'lending',
    websites: {
      main: 'https://aave.com',
      docs: 'https://docs.aave.com'
    },
    networks: {
      [CHAIN_IDS.ETHEREUM]: {
        available: true,
        contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        functionName: 'supply',
        abi: AAVE_V3_POOL_ABI,
        apy: {
          estimated: 4.2,
          source: 'Aave API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$12.5B',
        recommendations: {
          bestFor: ['Stable yields', 'Large amounts', 'Long-term holding'],
          riskLevel: 'low',
          gasEfficiency: 'medium'
        }
      },
      [CHAIN_IDS.POLYGON]: {
        available: true,
        contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        functionName: 'supply',
        abi: AAVE_V3_POOL_ABI,
        apy: {
          estimated: 5.1,
          source: 'Aave API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$89M',
        recommendations: {
          bestFor: ['Low gas costs', 'Small amounts', 'Regular deposits'],
          riskLevel: 'low',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.ARBITRUM]: {
        available: true,
        contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        functionName: 'supply',
        abi: AAVE_V3_POOL_ABI,
        apy: {
          estimated: 4.8,
          source: 'Aave API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$245M',
        recommendations: {
          bestFor: ['Medium gas costs', 'DeFi composability', 'Active trading'],
          riskLevel: 'low',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.OPTIMISM]: {
        available: true,
        contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        functionName: 'supply',
        abi: AAVE_V3_POOL_ABI,
        apy: {
          estimated: 4.5,
          source: 'Aave API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$67M',
        recommendations: {
          bestFor: ['Low gas costs', 'Ethereum ecosystem', 'OP rewards'],
          riskLevel: 'low',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.BASE]: {
        available: true,
        contractAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
        functionName: 'supply',
        abi: AAVE_V3_POOL_ABI,
        apy: {
          estimated: 4.3,
          source: 'Aave API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$145M',
        recommendations: {
          bestFor: ['Coinbase integration', 'Low gas costs', 'USDC native'],
          riskLevel: 'low',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.AVALANCHE]: {
        available: true,
        contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        functionName: 'supply',
        abi: AAVE_V3_POOL_ABI,
        apy: {
          estimated: 5.5,
          source: 'Aave API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$23M',
        recommendations: {
          bestFor: ['High yields', 'AVAX ecosystem', 'Fast finality'],
          riskLevel: 'medium',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.SCROLL]: {
        available: true,
        contractAddress: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe',
        functionName: 'supply',
        abi: AAVE_V3_POOL_ABI,
        apy: {
          estimated: 4.0,
          source: 'Aave API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$8M',
        recommendations: {
          bestFor: ['Early adoption', 'ZK-rollup benefits', 'Low competition'],
          riskLevel: 'medium',
          gasEfficiency: 'high'
        }
      }
    }
  },

  compound: {
    name: 'Compound V3',
    description: 'Autonomous interest rate protocol with single-asset markets and improved capital efficiency',
    icon: '🏦',
    category: 'lending',
    websites: {
      main: 'https://compound.finance',
      docs: 'https://docs.compound.finance'
    },
    networks: {
      [CHAIN_IDS.ETHEREUM]: {
        available: true,
        contractAddress: '0xc3d688B66703497DAA19211EEdff47f25384cdc3', // cUSDCv3
        functionName: 'supply',
        abi: COMPOUND_V3_ABI,
        apy: {
          estimated: 3.8,
          source: 'Compound API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$2.1B',
        recommendations: {
          bestFor: ['USDC focus', 'Borrowing against collateral', 'Governance participation'],
          riskLevel: 'low',
          gasEfficiency: 'medium'
        }
      },
      [CHAIN_IDS.POLYGON]: {
        available: true,
        contractAddress: '0xF25212E676D1F7F89Cd72fFEe66158f541246445', // cUSDCv3 Polygon
        functionName: 'supply',
        abi: COMPOUND_V3_ABI,
        apy: {
          estimated: 4.5,
          source: 'Compound API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$45M',
        recommendations: {
          bestFor: ['Low gas costs', 'USDC yields', 'Regular deposits'],
          riskLevel: 'low',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.ARBITRUM]: {
        available: true,
        contractAddress: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA', // cUSDCv3 Arbitrum
        functionName: 'supply',
        abi: COMPOUND_V3_ABI,
        apy: {
          estimated: 4.1,
          source: 'Compound API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$89M',
        recommendations: {
          bestFor: ['Native USDC', 'Lower gas costs', 'Cross-chain transfers'],
          riskLevel: 'low',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.BASE]: {
        available: true,
        contractAddress: '0x46e6b214b524310239732D51387075E0e70970bf', // cUSDCv3 Base
        functionName: 'supply',
        abi: COMPOUND_V3_ABI,
        apy: {
          estimated: 4.2,
          source: 'Compound API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$78M',
        recommendations: {
          bestFor: ['Native USDC', 'Coinbase ecosystem', 'ETH/cbETH collateral'],
          riskLevel: 'low',
          gasEfficiency: 'high'
        }
      }
    }
  },

  yearn: {
    name: 'Yearn Finance',
    description: 'Yield optimization protocol with automated strategy execution and risk management',
    icon: '🌾',
    category: 'yield-farming',
    websites: {
      main: 'https://yearn.fi',
      docs: 'https://docs.yearn.fi'
    },
    networks: {
      [CHAIN_IDS.ETHEREUM]: {
        available: true,
        contractAddress: '0xd8063123BBA3B480569244AE66BFE72B6c84b00d', // Vault Original v3
        functionName: 'deposit',
        abi: YEARN_V3_VAULT_ABI,
        apy: {
          estimated: 6.5,
          source: 'Yearn API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$567M',
        recommendations: {
          bestFor: ['Yield optimization', 'Automated strategies', 'Experienced DeFi users'],
          riskLevel: 'medium',
          gasEfficiency: 'medium'
        }
      },
      [CHAIN_IDS.POLYGON]: {
        available: true,
        contractAddress: '0xcA78AF7443f3F8FA0148b746Cb18FF67383CDF3f', // Vault Original v3 Polygon
        functionName: 'deposit',
        abi: YEARN_V3_VAULT_ABI,
        apy: {
          estimated: 7.2,
          source: 'Yearn API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$34M',
        recommendations: {
          bestFor: ['High yields', 'Low gas costs', 'Multi-strategy vaults'],
          riskLevel: 'medium',
          gasEfficiency: 'high'
        }
      },
      [CHAIN_IDS.ARBITRUM]: {
        available: true,
        contractAddress: '0xd8063123BBA3B480569244AE66BFE72B6c84b00d', // Vault Original v3 Arbitrum
        functionName: 'deposit',
        abi: YEARN_V3_VAULT_ABI,
        apy: {
          estimated: 6.8,
          source: 'Yearn API',
          lastUpdated: '2024-10-24'
        },
        tvl: '$123M',
        recommendations: {
          bestFor: ['Yield optimization', 'L2 benefits', 'Advanced strategies'],
          riskLevel: 'medium',
          gasEfficiency: 'high'
        }
      }
    }
  }
};

// Chain-specific recommendations
export const CHAIN_RECOMMENDATIONS: ChainRecommendations = {
  [CHAIN_IDS.ETHEREUM]: {
    name: 'Ethereum Mainnet',
    bestProtocols: {
      lending: ['aave', 'compound'],
      yieldFarming: ['yearn'],
      liquidStaking: []
    },
    gasToken: 'ETH',
    avgGasCost: {
      supply: '0.015 ETH',
      withdraw: '0.012 ETH'
    }
  },
  [CHAIN_IDS.POLYGON]: {
    name: 'Polygon PoS',
    bestProtocols: {
      lending: ['aave', 'compound'],
      yieldFarming: ['yearn'],
      liquidStaking: []
    },
    gasToken: 'MATIC',
    avgGasCost: {
      supply: '0.001 MATIC',
      withdraw: '0.001 MATIC'
    }
  },
  [CHAIN_IDS.ARBITRUM]: {
    name: 'Arbitrum One',
    bestProtocols: {
      lending: ['aave', 'compound'],
      yieldFarming: ['yearn'],
      liquidStaking: []
    },
    gasToken: 'ETH',
    avgGasCost: {
      supply: '0.0005 ETH',
      withdraw: '0.0004 ETH'
    }
  },
  [CHAIN_IDS.OPTIMISM]: {
    name: 'Optimism',
    bestProtocols: {
      lending: ['aave'],
      yieldFarming: [],
      liquidStaking: []
    },
    gasToken: 'ETH',
    avgGasCost: {
      supply: '0.0003 ETH',
      withdraw: '0.0003 ETH'
    }
  },
  [CHAIN_IDS.BASE]: {
    name: 'Base',
    bestProtocols: {
      lending: ['aave', 'compound'],
      yieldFarming: [],
      liquidStaking: []
    },
    gasToken: 'ETH',
    avgGasCost: {
      supply: '0.0002 ETH',
      withdraw: '0.0002 ETH'
    }
  },
  [CHAIN_IDS.AVALANCHE]: {
    name: 'Avalanche C-Chain',
    bestProtocols: {
      lending: ['aave'],
      yieldFarming: [],
      liquidStaking: []
    },
    gasToken: 'AVAX',
    avgGasCost: {
      supply: '0.001 AVAX',
      withdraw: '0.001 AVAX'
    }
  },
  [CHAIN_IDS.SCROLL]: {
    name: 'Scroll',
    bestProtocols: {
      lending: ['aave'],
      yieldFarming: [],
      liquidStaking: []
    },
    gasToken: 'ETH',
    avgGasCost: {
      supply: '0.0001 ETH',
      withdraw: '0.0001 ETH'
    }
  }
};

// Utility functions
export function getProtocolsForChain(chainId: number): string[] {
  return Object.keys(DEFI_PROTOCOLS).filter(
    protocol => DEFI_PROTOCOLS[protocol].networks[chainId]?.available
  );
}

export function getBestProtocolForChain(chainId: number, category: 'lending' | 'yield-farming' | 'liquid-staking'): string | null {
  const recommendations = CHAIN_RECOMMENDATIONS[chainId];
  if (!recommendations) return null;

  const bestProtocols = recommendations.bestProtocols;
  switch (category) {
    case 'lending':
      return bestProtocols.lending[0] || null;
    case 'yield-farming':
      return bestProtocols.yieldFarming[0] || null;
    case 'liquid-staking':
      return bestProtocols.liquidStaking[0] || null;
    default:
      return null;
  }
}

export function getProtocolConfig(protocolId: string, chainId: number): DeFiProtocolConfig['networks'][number] | null {
  const protocol = DEFI_PROTOCOLS[protocolId];
  if (!protocol) return null;

  return protocol.networks[chainId] || null;
}

export function getAllProtocolsForChain(chainId: number) {
  const availableProtocols = getProtocolsForChain(chainId);
  return availableProtocols.map(protocolId => ({
    id: protocolId,
    ...DEFI_PROTOCOLS[protocolId],
    config: DEFI_PROTOCOLS[protocolId].networks[chainId]
  }));
}

export function getOptimalProtocolRecommendation(
  chainId: number,
  amount: number,
  duration: 'short' | 'medium' | 'long',
  riskTolerance: 'low' | 'medium' | 'high'
) {
  const protocols = getAllProtocolsForChain(chainId);

  // Filter by risk tolerance
  const riskFiltered = protocols.filter(p => {
    const risk = p.config.recommendations?.riskLevel || 'medium';
    if (riskTolerance === 'low') return risk === 'low';
    if (riskTolerance === 'medium') return risk === 'low' || risk === 'medium';
    return true; // high tolerance accepts all
  });

  // Sort by APY for yield optimization
  return riskFiltered.sort((a, b) => {
    const apyA = a.config.apy?.estimated || 0;
    const apyB = b.config.apy?.estimated || 0;
    return apyB - apyA;
  })[0] || null;
}