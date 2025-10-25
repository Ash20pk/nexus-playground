'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Wallet,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Coins
} from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { getCachedUnifiedBalances, clearBalanceCache } from '@/lib/workflow/simulationUtils';

interface UnifiedBalanceCardProps {
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  balanceInFiat?: number;
  breakdown?: Array<{
    chain?: {
      id: number;
      name: string;
    };
    balance: string;
    balanceInFiat?: number;
  }>;
}

const CHAIN_NAMES: { [key: number]: string } = {
  1: 'Ethereum',
  10: 'Optimism',
  137: 'Polygon',
  42161: 'Arbitrum',
  43114: 'Avalanche',
  8453: 'Base',
  534352: 'Scroll',
  56: 'BNB Chain'
};

const getChainName = (chainId: number) => {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
};

const formatBalance = (balance: string, decimals: number = 6) => {
  const num = parseFloat(balance);
  if (num === 0) return '0';
  if (num < 0.000001) return '< 0.000001';
  return num.toFixed(decimals);
};

const formatUSD = (amount?: number) => {
  if (!amount || amount === 0) return '$0.00';
  if (amount < 0.01) return '< $0.01';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const UnifiedBalanceCard: React.FC<UnifiedBalanceCardProps> = ({
  isVisible,
  onClose,
  className
}) => {
  const { nexusSdk, isInitialized } = useNexus();
  const { address: walletAddress } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number>(0);

  const loadBalances = async () => {
    if (!nexusSdk || !isInitialized) {
      setError('SDK not initialized. Please connect your wallet.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 UNIFIED BALANCE - Loading balances...');

      // Get unified balances for all tokens using cache
      const unifiedBalances = await getCachedUnifiedBalances(nexusSdk, false);
      console.log('💰 UNIFIED BALANCE - Raw balances:', unifiedBalances);

      // Calculate total portfolio value
      const totalValue = unifiedBalances.reduce((sum, balance) => {
        return sum + (balance.balanceInFiat || 0);
      }, 0);

      setBalances(unifiedBalances);
      setTotalPortfolioValue(totalValue);

      console.log('✅ UNIFIED BALANCE - Balances loaded successfully:', {
        tokenCount: unifiedBalances.length,
        totalValue
      });

    } catch (error) {
      console.error('❌ UNIFIED BALANCE - Failed to load balances:', error);
      setError(error instanceof Error ? error.message : 'Failed to load balances');
    } finally {
      setIsLoading(false);
    }
  };

  // Load balances when component mounts or SDK state changes
  useEffect(() => {
    if (isVisible && nexusSdk && isInitialized) {
      loadBalances();
    }
  }, [isVisible, nexusSdk, isInitialized]);

  const handleRefresh = () => {
    // Clear cache to force fresh data
    clearBalanceCache();
    loadBalances();
  };

  const toggleTokenExpanded = (tokenSymbol: string) => {
    const newExpanded = new Set(expandedTokens);
    if (newExpanded.has(tokenSymbol)) {
      newExpanded.delete(tokenSymbol);
    } else {
      newExpanded.add(tokenSymbol);
    }
    setExpandedTokens(newExpanded);
  };

  // Filter balances based on zero balance preference
  const displayedBalances = showZeroBalances
    ? balances
    : balances.filter(balance => parseFloat(balance.balance) > 0);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={cn(
        "w-full max-w-2xl max-h-[80vh] overflow-hidden",
        "border-2 border-black shadow-[-8px_8px_0_0_#000000] bg-white",
        className
      )}>
        <CardHeader className="pb-3 border-b-2 border-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 border-2 border-black rounded">
                <Wallet className="h-4 w-4 text-black" />
              </div>
              <CardTitle className="text-lg font-bold text-black">Unified Balance Overview</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-2 border-black shadow-[-4px_4px_0_0_#000000] hover:shadow-[-2px_2px_0_0_#000000] transition-all bg-white hover:bg-gray-50"
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0 border-2 border-black shadow-[-4px_4px_0_0_#000000] hover:shadow-[-2px_2px_0_0_#000000] transition-all bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Wallet Info & Portfolio Summary */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Wallet:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 border border-black font-mono">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
              </code>
            </div>

            {totalPortfolioValue > 0 && (
              <div className="p-3 bg-green-50 border-2 border-black shadow-[-4px_4px_0_0_#000000]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black">Total Portfolio Value</span>
                  <span className="text-lg font-bold text-black">{formatUSD(totalPortfolioValue)}</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto max-h-[60vh] p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-black">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Loading balances across all chains...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3 bg-red-50 border-2 border-black shadow-[-4px_4px_0_0_#000000]">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-black font-medium">{error}</div>
              </div>
            </div>
          )}

          {/* Balance Controls */}
          {!isLoading && !error && balances.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black">
              <div className="flex items-center gap-2">
                <span className="text-sm text-black font-medium">
                  Showing {displayedBalances.length} of {balances.length} tokens
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowZeroBalances(!showZeroBalances)}
                className="text-xs border-2 border-black shadow-[-2px_2px_0_0_#000000] hover:shadow-[-1px_1px_0_0_#000000] transition-all bg-white hover:bg-gray-100"
              >
                {showZeroBalances ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide Zero Balances
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Zero Balances
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Balance List */}
          {!isLoading && !error && (
            <div className="space-y-2">
              {displayedBalances.length === 0 ? (
                <div className="text-center py-8 text-black">
                  <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No token balances found</p>
                  <p className="text-xs text-gray-600">Make sure your wallet is connected and has tokens</p>
                </div>
              ) : (
                displayedBalances.map((tokenBalance, index) => {
                  const hasBreakdown = tokenBalance.breakdown && tokenBalance.breakdown.length > 0;
                  const isExpanded = expandedTokens.has(tokenBalance.symbol);
                  const balance = parseFloat(tokenBalance.balance);
                  const hasBalance = balance > 0;

                  return (
                    <div key={index} className="border-2 border-black p-3 space-y-2 bg-white shadow-[-4px_4px_0_0_#000000]">
                      {/* Token Summary */}
                      <div
                        className={cn(
                          "flex items-center justify-between",
                          hasBreakdown && "cursor-pointer hover:bg-gray-50 -m-1 p-1 transition-colors"
                        )}
                        onClick={() => hasBreakdown && toggleTokenExpanded(tokenBalance.symbol)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 flex items-center justify-center text-xs font-bold border-2 border-black",
                            hasBalance ? "bg-green-100 text-black" : "bg-gray-100 text-gray-500"
                          )}>
                            {tokenBalance.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-black">{tokenBalance.symbol}</div>
                            <div className="text-xs text-gray-600 font-medium">
                              {hasBreakdown ? `${tokenBalance.breakdown.length} chains` : 'Single chain'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-black">
                            {formatBalance(tokenBalance.balance)} {tokenBalance.symbol}
                          </div>
                          {tokenBalance.balanceInFiat && tokenBalance.balanceInFiat > 0 && (
                            <div className="text-xs text-gray-600 font-medium">
                              {formatUSD(tokenBalance.balanceInFiat)}
                            </div>
                          )}
                        </div>

                        {hasBreakdown && (
                          <div className="ml-2">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-black" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-black" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Chain Breakdown */}
                      {hasBreakdown && isExpanded && (
                        <div className="space-y-1 pl-4 border-l-2 border-black ml-4">
                          {tokenBalance.breakdown!.map((chainBalance, chainIndex) => {
                            const chainBalance_num = parseFloat(chainBalance.balance);
                            const chainName = getChainName(chainBalance.chain?.id || 0);

                            return (
                              <div key={chainIndex} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="text-xs bg-gray-100 border border-black px-2 py-1 font-bold">
                                    {chainName}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={cn(
                                    "font-bold",
                                    chainBalance_num > 0 ? "text-black" : "text-gray-400"
                                  )}>
                                    {formatBalance(chainBalance.balance)} {tokenBalance.symbol}
                                  </div>
                                  {chainBalance.balanceInFiat && chainBalance.balanceInFiat > 0 && (
                                    <div className="text-xs text-gray-600 font-medium">
                                      {formatUSD(chainBalance.balanceInFiat)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Info Notice */}
          {!isLoading && !error && balances.length > 0 && (
            <div className="text-xs text-black p-3 bg-blue-50 border-2 border-black shadow-[-4px_4px_0_0_#000000]">
              <strong className="font-bold">Real-time Balances:</strong> This shows your actual token balances across all connected chains.
              Data is fetched directly from the blockchain and updates when you refresh.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};