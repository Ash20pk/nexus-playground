'use client';

import type { NexusSDK } from '@nexus-xyz/sdk';

// Balance cache with TTL
interface CachedBalance {
  data: any[];
  timestamp: number;
}

const CACHE_TTL = 30000; // 30 seconds as recommended by SDK docs
const balanceCache = new Map<string, CachedBalance>();

/**
 * Get unified balances with caching (30-second TTL as per SDK docs) and enhanced error handling
 */
export const getCachedUnifiedBalances = async (
  nexusSdk: NexusSDK,
  includeSwappable: boolean = false
): Promise<any[]> => {
  const cacheKey = `unified_balances_${includeSwappable}`;
  const now = Date.now();
  const cached = balanceCache.get(cacheKey);

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log('🔄 Using cached balances:', { cacheKey, age: now - cached.timestamp });
    return cached.data;
  }

  console.log('🔍 Fetching fresh balances:', { cacheKey, includeSwappable });

  try {
    const balances = await nexusSdk.getUnifiedBalances(includeSwappable);

    balanceCache.set(cacheKey, {
      data: balances,
      timestamp: now
    });

    return balances;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If we have cached data and there's a network error, return stale cache with warning
    if (cached && (
      errorMessage.includes('balances cannot be retrieved') ||
      errorMessage.includes('Ankr') ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout')
    )) {
      console.warn('⚠️ Using stale cached balances due to network error:', {
        error: errorMessage,
        cacheAge: now - cached.timestamp
      });
      return cached.data;
    }

    // If no cache available, re-throw the error
    console.error('❌ Failed to fetch balances and no cache available:', error);
    throw error;
  }
};

/**
 * Clear balance cache (useful after transactions)
 */
export const clearBalanceCache = () => {
  balanceCache.clear();
  console.log('🗑️ Balance cache cleared');
};

/**
 * Standardized simulation error handler as per SDK documentation
 */
export interface SimulationErrorResult {
  isDirectOperation: boolean;
  error: string | null;
  errorType: 'INSUFFICIENT_BALANCE' | 'NO_ROUTE' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN' | null;
  shouldRetry: boolean;
}

export const handleSimulationError = (error: Error, operation: string): SimulationErrorResult => {
  const errorMessage = error.message.toLowerCase();

  // "ca not applicable" means direct operation will be used (SUCCESS case per SDK docs)
  if (errorMessage === 'ca not applicable') {
    console.log(`✅ ${operation.toUpperCase()} - Direct operation will be used (no chain abstraction needed)`);
    return {
      isDirectOperation: true,
      error: null,
      errorType: null,
      shouldRetry: false
    };
  }

  // Insufficient balance errors
  if (errorMessage.includes('insufficient balance') || errorMessage.includes('insufficient funds')) {
    return {
      isDirectOperation: false,
      error: 'Insufficient balance across all chains to complete this operation',
      errorType: 'INSUFFICIENT_BALANCE',
      shouldRetry: false
    };
  }

  // No route available
  if (errorMessage.includes('no route') || errorMessage.includes('not supported') || errorMessage.includes('route not found')) {
    return {
      isDirectOperation: false,
      error: 'No route available for this token/chain combination',
      errorType: 'NO_ROUTE',
      shouldRetry: false
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return {
      isDirectOperation: false,
      error: 'Network error occurred. Please check your connection and try again.',
      errorType: 'NETWORK',
      shouldRetry: true
    };
  }

  // Validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('validation') || errorMessage.includes('parameter')) {
    return {
      isDirectOperation: false,
      error: `Invalid ${operation} parameters: ${error.message}`,
      errorType: 'VALIDATION',
      shouldRetry: false
    };
  }

  // Unknown errors
  return {
    isDirectOperation: false,
    error: error.message || `Unknown error occurred during ${operation}`,
    errorType: 'UNKNOWN',
    shouldRetry: true
  };
};

/**
 * Standard simulation result types
 */
export interface SimulationResult {
  type: 'CA_ROUTE' | 'DIRECT_OPERATION' | 'ERROR';
  simulation: any | null;
  fees?: {
    protocol?: string;
    solver?: string;
    gasSupplied?: string;
    caGas?: string;
    total?: string;
  };
  isInsufficientBalance?: boolean;
  directOperationMode?: boolean;
  error?: string;
  errorType?: SimulationErrorResult['errorType'];
  shouldRetry?: boolean;
}

/**
 * Unified simulation handler for all preview components
 */
export const handleSimulationResult = async (
  simulationMethod: () => Promise<any>,
  operation: string,
  fallbackFees?: { gasSupplied: string; total: string }
): Promise<SimulationResult> => {
  try {
    console.log(`🔍 ${operation.toUpperCase()} - Starting simulation...`);

    const simulation = await simulationMethod();

    if (simulation) {
      // Chain abstraction route available
      console.log(`✅ ${operation.toUpperCase()} - CA route available:`, simulation);
      return {
        type: 'CA_ROUTE',
        simulation,
        fees: simulation.intent?.fees,
        isInsufficientBalance: simulation.intent?.isAvailableBalanceInsufficient || false
      };
    } else {
      // SDK returned null - direct operation will be used
      console.log(`⚡ ${operation.toUpperCase()} - Direct operation will be used (SDK optimization)`);
      return {
        type: 'DIRECT_OPERATION',
        simulation: null,
        fees: fallbackFees || { gasSupplied: '0.01', total: '0.01' },
        directOperationMode: true,
        isInsufficientBalance: false // Will be checked separately for direct operations
      };
    }
  } catch (error) {
    const handled = handleSimulationError(error as Error, operation);

    if (handled.isDirectOperation) {
      // "ca not applicable" case - this is actually success, not an error
      console.log(`✅ ${operation.toUpperCase()} - Direct operation will be used (no chain abstraction needed)`);
      return {
        type: 'DIRECT_OPERATION',
        simulation: null,
        fees: fallbackFees || { gasSupplied: '0.01', total: '0.01' },
        directOperationMode: true,
        isInsufficientBalance: false // Will be checked separately
      };
    } else {
      // Actual error that needs to be logged
      console.error(`❌ ${operation.toUpperCase()} - Simulation error:`, error);
      return {
        type: 'ERROR',
        simulation: null,
        error: handled.error || 'Unknown error',
        errorType: handled.errorType,
        shouldRetry: handled.shouldRetry
      };
    }
  }
};

/**
 * Check if user has sufficient balance for direct operations with enhanced error handling
 */
export const checkDirectOperationBalance = async (
  nexusSdk: NexusSDK,
  token: string,
  amount: number,
  chainId?: number
): Promise<{ sufficient: boolean; available: number; error?: string }> => {
  try {
    const balances = await getCachedUnifiedBalances(nexusSdk, false);
    const tokenBalance = balances.find(balance => balance.symbol === token);

    if (!tokenBalance) {
      return {
        sufficient: false,
        available: 0,
        error: `No ${token} balance found across any connected chains`
      };
    }

    const availableBalance = parseFloat(tokenBalance.balance);
    const sufficient = availableBalance >= amount;

    console.log(`💰 Direct operation balance check:`, {
      token,
      required: amount,
      available: availableBalance,
      sufficient,
      chainId
    });

    return {
      sufficient,
      available: availableBalance,
      error: sufficient ? undefined : `Insufficient ${token}. Need ${amount}, have ${availableBalance}`
    };
  } catch (error) {
    console.error('❌ Balance check failed:', error);

    // Enhanced error handling for specific balance retrieval issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('balances cannot be retrieved') ||
        errorMessage.includes('Ankr') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout')) {
      return {
        sufficient: false,
        available: 0,
        error: `Balance check temporarily unavailable. Network connectivity issue detected. Please try again in a moment.`
      };
    }

    return {
      sufficient: false,
      available: 0,
      error: `Failed to check balance: ${errorMessage}`
    };
  }
};

/**
 * Estimate gas costs for direct operations (fallback when simulation unavailable)
 */
export const estimateDirectOperationGas = (
  operation: string,
  chainId: number,
  token: string = 'ETH'
): { gasSupplied: string; total: string } => {
  // Gas estimates based on operation type and chain
  const gasEstimates: Record<string, Record<number, string>> = {
    transfer: {
      1: '0.005',    // Ethereum
      10: '0.001',   // Optimism
      137: '0.002',  // Polygon
      42161: '0.001', // Arbitrum
      8453: '0.001', // Base
    },
    swap: {
      1: '0.008',    // Ethereum
      10: '0.002',   // Optimism
      137: '0.003',  // Polygon
      42161: '0.002', // Arbitrum
      8453: '0.002', // Base
    },
    stake: {
      1: '0.012',    // Ethereum
      10: '0.003',   // Optimism
      137: '0.004',  // Polygon
      42161: '0.003', // Arbitrum
      8453: '0.003', // Base
    }
  };

  const estimate = gasEstimates[operation]?.[chainId] || '0.005';

  return {
    gasSupplied: estimate,
    total: estimate
  };
};