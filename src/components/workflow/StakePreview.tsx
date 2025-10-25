'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, CheckCircle, AlertCircle, TrendingUp, Coins, Shield, Code } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';
import { DEFI_PROTOCOLS, getProtocolConfig, CHAIN_RECOMMENDATIONS } from '@/lib/defi-config';
import { Button } from '../ui/button';

interface StakePreviewProps {
  token: string;
  amount: string;
  chainId: number;
  protocol: 'aave' | 'compound' | 'yearn';
  onSimulate?: (result: any) => void;
}

interface StakeSimulationResult {
  protocol: {
    name: string;
    contractAddress: string;
    apy: number;
    tvl: string;
    chainName: string;
  };
  staking: {
    inputAmount: string;
    expectedShares: string;
    estimatedApy: number;
    estimatedYearlyRewards: string;
  };
  fees: {
    gasEstimate: string;
    protocolFee: string;
    total: string;
  };
  isAvailableBalanceInsufficient: boolean;
  balanceCheckError?: boolean;
}

export const StakePreview: React.FC<StakePreviewProps> = ({
  token,
  amount,
  chainId,
  protocol,
  onSimulate
}) => {
  const { nexusSdk, isInitialized } = useNexus();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<StakeSimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const isValidForSimulation = () => {
    return (
      token &&
      amount &&
      !isNaN(Number(amount)) &&
      Number(amount) > 0 &&
      chainId &&
      protocol
    );
  };

  const getProtocolInfo = () => {
    return DEFI_PROTOCOLS[protocol];
  };

  const getChainName = (chainId: number) => {
    return CHAIN_RECOMMENDATIONS[chainId]?.name || `Chain ${chainId}`;
  };

  const runSimulation = async () => {
    if (!nexusSdk || !isInitialized || !isValidForSimulation()) {
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);

    const numericAmount = Number(amount);
    const protocolInfo = getProtocolInfo();

    try {
      console.log('🏦 STAKE PREVIEW - Simulating stake operation:', {
        token,
        amount: numericAmount,
        chainId,
        protocol,
        protocolInfo
      });

      // Get protocol configuration from DeFi config
      const protocolConfig = getProtocolConfig(protocol, chainId);
      if (!protocolConfig) {
        throw new Error(`${protocolInfo?.name} is not available on ${getChainName(chainId)}`);
      }

      // STEP 1: Check actual balance using Nexus SDK with enhanced error handling
      let balances;
      let availableBalance = 0;
      let hasInsufficientBalance = true;
      let balanceCheckError = false;

      try {
        balances = await nexusSdk.getUnifiedBalances(false); // Only CA-applicable tokens
        console.log('🔍 STAKE PREVIEW - Fetched balances:', balances);

        // Find the specific token balance
        const tokenBalance = balances.find(balance => balance.symbol === token);
        availableBalance = tokenBalance ? parseFloat(tokenBalance.balance) : 0;
        hasInsufficientBalance = availableBalance < numericAmount;

        console.log('💰 STAKE PREVIEW - Balance analysis:', {
          token,
          available: availableBalance,
          required: numericAmount,
          sufficient: !hasInsufficientBalance,
          hasTokenBalance: !!tokenBalance
        });
      } catch (balanceError) {
        console.warn('⚠️ STAKE PREVIEW - Balance check failed, proceeding with warning:', balanceError);
        balanceCheckError = true;

        // Check if this is a network/Ankr error
        const errorMessage = balanceError instanceof Error ? balanceError.message : 'Unknown error';
        if (errorMessage.includes('balances cannot be retrieved') ||
            errorMessage.includes('Ankr') ||
            errorMessage.includes('network')) {
          // For network errors, we'll still show the preview but with a warning
          hasInsufficientBalance = false; // Assume sufficient for preview purposes
        } else {
          // For other errors, re-throw
          throw balanceError;
        }
      }

      // STEP 2: Create simulation result with REAL balance data
      const simulationResult: StakeSimulationResult = {
        protocol: {
          name: protocolInfo.name,
          contractAddress: protocolConfig.contractAddress,
          apy: protocolConfig.apy?.estimated || 0,
          tvl: protocolConfig.tvl || 'N/A',
          chainName: getChainName(chainId)
        },
        staking: {
          inputAmount: numericAmount.toString(),
          expectedShares: (numericAmount * 0.99).toFixed(6), // Account for small protocol fees
          estimatedApy: protocolConfig.apy?.estimated || 0,
          estimatedYearlyRewards: (numericAmount * ((protocolConfig.apy?.estimated || 0) / 100)).toFixed(6)
        },
        fees: {
          gasEstimate: CHAIN_RECOMMENDATIONS[chainId]?.avgGasCost.supply || '0.001 ETH',
          protocolFee: '0', // Most protocols don't charge fees for supply
          total: CHAIN_RECOMMENDATIONS[chainId]?.avgGasCost.supply || '0.001 ETH'
        },
        isAvailableBalanceInsufficient: hasInsufficientBalance, // REAL balance check
        balanceCheckError: balanceCheckError
      };

      console.log('✅ STAKE PREVIEW - Simulation successful:', simulationResult);
      setSimulationResult(simulationResult);
      onSimulate?.(simulationResult);

    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Staking simulation failed';
      console.error('❌ STAKE PREVIEW - Simulation error:', error);
      setSimulationError(errorMessage);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (isValidForSimulation()) {
      const timer = setTimeout(() => {
        runSimulation();
      }, 500); // Debounce simulation calls

      return () => clearTimeout(timer);
    } else {
      setSimulationResult(null);
      setSimulationError(null);
    }
  }, [token, amount, chainId, protocol, nexusSdk, isInitialized]);

  const protocolInfo = getProtocolInfo();

  if (!isValidForSimulation()) {
    return (
      <Card>
        <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Staking Preview</CardTitle>
                <Button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  size="sm"
                  variant="outline"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete staking configuration to see preview
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!protocolInfo) {
    return (
      <Card>
        <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Staking Preview</CardTitle>
                <Button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  size="sm"
                  variant="outline"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unknown protocol: {protocol}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{protocolInfo.name} Staking Preview</CardTitle>
            <Button
              onClick={runSimulation}
              disabled={isSimulating}
              size="sm"
              variant="outline"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Simulating...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!isInitialized && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              SDK not initialized. Please connect your wallet.
            </AlertDescription>
          </Alert>
        )}

        {/* Simulation Results */}
        {isSimulating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching latest rates and calculating rewards...
          </div>
        )}

        {simulationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Simulation Failed:</strong> {simulationError}
            </AlertDescription>
          </Alert>
        )}

        {simulationResult && (
          <div className="space-y-4">
            {simulationResult.balanceCheckError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Balance Check Unavailable</strong>
                  <div className="mt-1 text-sm">
                    Unable to verify {token} balance due to network connectivity issues.
                    Preview shown for estimation only. Please ensure you have sufficient {token} before executing.
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {!simulationResult.balanceCheckError && simulationResult.isAvailableBalanceInsufficient && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Insufficient Balance</strong>
                  <div className="mt-1 text-sm">
                    You don't have enough {token} to complete this staking operation.
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {/* Protocol Information */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Protocol Information
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm space-y-1">
                <div className="text-gray-600 dark:text-gray-400">
                  <span>Current APY:</span>
                  <span className="text-green-600 font-medium ml-2">
                    {simulationResult.protocol.apy.toFixed(2)}%
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span>Total Value Locked:</span>
                  <span className="font-medium ml-2">{simulationResult.protocol.tvl}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span>Network:</span>
                  <span className="font-medium ml-2">{simulationResult.protocol.chainName}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span>Gas Cost:</span>
                  <span className="font-medium ml-2">{simulationResult.fees.gasEstimate}</span>
                </div>
              </div>
            </div>

            {/* Rewards Analysis */}
            <div className="p-4 bg-card rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">Rewards Breakdown</span>
              </div>

              <div className="space-y-3">
                {/* Input Summary */}
                <div className="flex justify-between items-center py-2 border-b border-muted-foreground">
                  <span className="text-sm font-medium">Stake Amount</span>
                  <span className="font-semibold">{parseFloat(simulationResult.staking.inputAmount).toLocaleString()} {token}</span>
                </div>

                {/* Rewards Timeline */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Daily Rewards</span>
                    <span className="font-medium text-green-600">
                      +{(parseFloat(simulationResult.staking.estimatedYearlyRewards) / 365).toFixed(4)} {token}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Monthly Rewards</span>
                    <span className="font-medium text-green-600">
                      +{(parseFloat(simulationResult.staking.estimatedYearlyRewards) / 12).toFixed(2)} {token}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-t border-muted-foreground pt-2">
                    <span>Yearly Rewards</span>
                    <span className="text-green-600">+{simulationResult.staking.estimatedYearlyRewards} {token}</span>
                  </div>
                </div>

                {/* Portfolio Projection */}
                <div className="mt-3 p-3 bg-white rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Portfolio Value After 1 Year</div>
                  <div className="text-lg font-bold text-muted-foreground">
                    {(parseFloat(simulationResult.staking.inputAmount) + parseFloat(simulationResult.staking.estimatedYearlyRewards)).toLocaleString()} {token}
                  </div>
                  <div className="text-xs text-green-600">
                    +{simulationResult.staking.estimatedApy.toFixed(2)}% growth
                  </div>
                </div>

                {/* Expected Shares */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Expected receipt tokens: </span>
                  <code className="text-xs bold">
                    {simulationResult.staking.expectedShares} shares
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};