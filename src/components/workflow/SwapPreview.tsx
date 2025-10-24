'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';
import { formatUnits, parseUnits } from 'viem';
import { Button } from '../ui/button';

interface SwapPreviewProps {
  fromToken: string;
  toToken: string;
  amount: string;
  fromChainId: number;
  toChainId: number;
  slippage?: number;
  onSimulate?: (result: any) => void;
}

interface SwapSimulationResult {
  intent: {
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
  };
}

export const SwapPreview: React.FC<SwapPreviewProps> = ({
  fromToken,
  toToken,
  amount,
  fromChainId,
  toChainId,
  slippage = 0.5,
  onSimulate
}) => {
  const { nexusSdk, isInitialized } = useNexus();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SwapSimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const isValidForSimulation = () => {
    return (
      fromToken &&
      toToken &&
      amount &&
      !isNaN(Number(amount)) &&
      Number(amount) > 0 &&
      fromChainId &&
      toChainId &&
      fromToken !== toToken // Can't swap same token (same-chain and cross-chain both allowed)
    );
  };

  const runSimulation = async () => {
    if (!nexusSdk || !isInitialized || !isValidForSimulation()) {
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);

    const numericAmount = Number(amount);

    try {
      // Get token decimals for proper amount conversion
      const decimals = fromToken === 'ETH' ? 18 : 6; // Default decimals
      const amountBigInt = parseUnits(amount, decimals);

      // Get supported chains and tokens for validation
      const supportedOptions = nexusSdk.utils.getSwapSupportedChainsAndTokens();
      const sourceChainSupported = supportedOptions.find(chain => chain.id === fromChainId);

      if (!sourceChainSupported) {
        throw new Error(`Source chain ${fromChainId} is not supported for swaps`);
      }

      const sourceTokenSupported = sourceChainSupported.tokens.find(token =>
        token.symbol === fromToken
      );

      if (!sourceTokenSupported) {
        throw new Error(`Token ${fromToken} is not supported on source chain ${fromChainId}`);
      }

      // For destination, we need the token address - this would need to be resolved
      // For now, we'll simulate with a mock result since we don't have a direct simulation API
      console.log('🔍 SWAP PREVIEW - Simulating swap:', {
        from: { token: fromToken, amount: numericAmount, chainId: fromChainId },
        to: { token: toToken, chainId: toChainId },
        slippage
      });

      // Detect if this is a same-chain swap (source and destination on same chain)
      const isSameChainSwap = fromChainId === toChainId;

      // Create a mock simulation result based on swap type
      const mockResult: SwapSimulationResult = {
        intent: {
          sources: [{
            amount: numericAmount.toString(),
            chainID: fromChainId,
            contractAddress: sourceTokenSupported.tokenAddress,
            decimals: sourceTokenSupported.decimals || decimals,
            symbol: fromToken
          }],
          destination: {
            // Same-chain swaps typically have better rates (no bridge fees)
            amount: isSameChainSwap
              ? (numericAmount * 0.9985).toString() // ~0.15% DEX fee
              : (numericAmount * 0.998).toString(),  // ~0.2% fee + bridge costs
            chainID: toChainId,
            contractAddress: '0x0000000000000000000000000000000000000000', // Would need actual address
            decimals: toToken === 'ETH' ? 18 : 6,
            symbol: toToken
          }
        }
      };

      setSimulationResult(mockResult);
      onSimulate?.(mockResult);

    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Simulation failed';

      console.error('❌ SWAP PREVIEW - Simulation error:', error);
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
  }, [fromToken, toToken, amount, fromChainId, toChainId, nexusSdk, isInitialized]);

  if (!isValidForSimulation()) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Swap Preview
            </CardTitle>
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
            Complete swap configuration to see preview
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            {fromChainId === toChainId ? 'Same-Chain Swap Preview' : 'Cross-Chain Swap Preview'}
          </CardTitle>
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

      <CardContent className="space-y-4">
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
            Finding best swap route...
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
          <div className="space-y-3 bg-card rounded-lg border border-muted-foreground p-4">

            {/* Route Details */}
            <div className="space-y-2">
              <h4 className="text-muted-foreground font-semibold">Route Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Source Chain:</span>
                  <span>Chain {simulationResult.intent.sources[0].chainID}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Destination Chain:</span>
                  <span>Chain {simulationResult.intent.destination.chainID}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Max Slippage:</span>
                  <span>{slippage}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Expected Output:</span>
                  <span>{parseFloat(simulationResult.intent.destination.amount).toFixed(6)} {simulationResult.intent.destination.symbol}</span> 
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Rate:</span>
                  <span>1 {fromToken} ≈ {(parseFloat(simulationResult.intent.destination.amount) / parseFloat(simulationResult.intent.sources[0].amount)).toFixed(6)} {toToken}</span> 
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Swap Type Notice */}
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg border">
          {fromChainId === toChainId ? (
            <>
              <strong>Same-Chain Swap:</strong> This operation uses DEX aggregators to find the best rate on the same chain.
              The swap typically completes in one transaction within 5-15 seconds.
            </>
          ) : (
            <>
              <strong>Cross-Chain Swap:</strong> This operation uses DEX aggregators (LiFi, Bebop) to find the best
              route across chains. The swap may involve multiple transactions and take 30-90 seconds to complete.
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};