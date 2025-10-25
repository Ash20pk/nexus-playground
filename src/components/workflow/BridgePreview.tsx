'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, CheckCircle, AlertCircle, ArrowUpDown, Coins } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';
import {
  handleSimulationResult,
  checkDirectOperationBalance,
  estimateDirectOperationGas,
  type SimulationResult
} from '@/lib/workflow/simulationUtils';

interface BridgePreviewProps {
  token: string;
  amount: string;
  fromChain: number;
  toChain: number;
  sourceChains?: number[];
  onSimulate?: (result: any) => void;
}

interface BridgeSimulationResult {
  intent: {
    sources: Array<{
      amount: string;
      chainID: number;
      tokenAddress: string;
      decimals: number;
      symbol: string;
    }>;
    destination: {
      amount: string;
      chainID: number;
      tokenAddress: string;
      decimals: number;
      symbol: string;
    };
    fees: {
      protocol: string;
      solver: string;
      gasSupplied: string;
      caGas: string;
      total: string;
    };
    isAvailableBalanceInsufficient: boolean;
  };
}

export const BridgePreview: React.FC<BridgePreviewProps> = ({
  token,
  amount,
  fromChain,
  toChain,
  sourceChains,
  onSimulate
}) => {
  const { nexusSdk, isInitialized } = useNexus();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const isValidForSimulation = () => {
    return (
      token &&
      amount &&
      !isNaN(Number(amount)) &&
      Number(amount) > 0 &&
      fromChain &&
      toChain &&
      fromChain !== toChain // Bridge requires different chains
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
      console.log('🔍 BRIDGE PREVIEW - Starting simulation:', {
        token,
        amount: numericAmount,
        fromChain,
        toChain,
        sourceChains
      });

      const bridgeParams = {
        token: token as any,
        amount: numericAmount,
        chainId: toChain as any,
        sourceChains: sourceChains as any
      };

      // Use unified simulation handler
      const result = await handleSimulationResult(
        () => nexusSdk.simulateBridge(bridgeParams),
        'bridge',
        estimateDirectOperationGas('bridge', toChain)
      );

      if (result.type === 'ERROR') {
        setSimulationError(result.error || 'Bridge simulation failed');
        return;
      }

      // For bridge operations, there's typically no "direct" mode
      // If SDK returns null, it means no bridge route is available
      if (result.type === 'DIRECT_OPERATION') {
        setSimulationError('No bridge route available for this token/chain combination');
        return;
      }

      // Check balance for CA route if needed
      if (result.type === 'CA_ROUTE' && !result.isInsufficientBalance) {
        const balanceCheck = await checkDirectOperationBalance(nexusSdk, token, numericAmount);
        if (!balanceCheck.sufficient) {
          // Update the simulation result to reflect insufficient balance
          result.isInsufficientBalance = true;
          result.simulation.intent.isAvailableBalanceInsufficient = true;
        }
      }

      console.log('✅ BRIDGE PREVIEW - Simulation completed:', result);
      setSimulationResult(result);
      onSimulate?.(result.simulation);

    } catch (error) {
      console.error('❌ BRIDGE PREVIEW - Simulation error:', error);
      setSimulationError(error instanceof Error ? error.message : 'Bridge simulation failed');
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
  }, [token, amount, fromChain, toChain, sourceChains, nexusSdk, isInitialized]);

  if (!isValidForSimulation()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Bridge Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {fromChain === toChain
              ? "Bridge requires different source and destination chains"
              : "Complete bridge configuration to see preview"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Cross-Chain Bridge Preview
        </CardTitle>
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

        {/* Bridge Overview */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="font-medium">{amount} {token}</div>
            <div className="text-sm text-muted-foreground">From Chain {fromChain}</div>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground" />

          <div className="text-center">
            <div className="font-medium">
              {isSimulating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating...
                </div>
              ) : simulationResult ? (
                `~${parseFloat(simulationResult.simulation?.intent?.destination?.amount || '0').toFixed(6)} ${token}`
              ) : (
                `? ${token}`
              )}
            </div>
            <div className="text-sm text-muted-foreground">To Chain {toChain}</div>
          </div>
        </div>

        {/* Simulation Results */}
        {isSimulating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finding optimal bridge route...
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

        {simulationResult && simulationResult.simulation && (
          <div className="space-y-3">
            {simulationResult.isInsufficientBalance ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Insufficient Balance</strong>
                  <div className="mt-1 text-sm">
                    You don't have enough {token} across all chains to complete this bridge including fees.
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div><strong>Bridge Route Ready</strong></div>
                    <div className="text-sm space-y-1">
                      <div>You'll receive: <code className="bg-muted px-1 rounded text-xs">
                        {parseFloat(simulationResult.simulation?.intent?.destination?.amount || '0').toFixed(6)} {token}
                      </code></div>
                      <div>Total fees: <code className="bg-muted px-1 rounded text-xs">
                        {simulationResult.simulation?.intent?.fees?.total || '0'} {token}
                      </code></div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Route Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Bridge Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Source Chains:</span>
                  <div className="flex gap-1">
                    {simulationResult.simulation?.intent?.sources?.map((source: any, index: number) => (
                      <Badge key={index} variant="outline">
                        Chain {source.chainID}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Destination Chain:</span>
                  <Badge variant="outline">Chain {simulationResult.simulation?.intent?.destination?.chainID || toChain}</Badge>
                </div>
                {sourceChains && sourceChains.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Restricted Sources:</span>
                    <div className="flex gap-1">
                      {sourceChains.map((chainId, index) => (
                        <Badge key={index} variant="secondary">
                          Chain {chainId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Fee Breakdown</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Protocol fee:</span>
                  <span>{simulationResult.simulation?.intent?.fees?.protocol || '0'} {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Solver fee:</span>
                  <span>{simulationResult.simulation?.intent?.fees?.solver || '0'} {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas costs:</span>
                  <span>{simulationResult.simulation?.intent?.fees?.gasSupplied || '0'} {token}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total fees:</span>
                  <span>{simulationResult.simulation?.intent?.fees?.total || '0'} {token}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bridge Notice */}
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg border">
          <strong>Cross-Chain Bridge:</strong> This operation consolidates tokens from one or more source
          chains to the destination chain. The bridge typically takes 30-90 seconds and automatically
          selects optimal source chains based on balance and fees.
        </div>
      </CardContent>
    </Card>
  );
};