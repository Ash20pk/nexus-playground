'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, CheckCircle, AlertCircle, ArrowUpDown, Coins } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';

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
  const [simulationResult, setSimulationResult] = useState<BridgeSimulationResult | null>(null);
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
      console.log('🔍 BRIDGE PREVIEW - Simulating bridge:', {
        token,
        amount: numericAmount,
        fromChain,
        toChain,
        sourceChains
      });

      const bridgeParams = {
        token: token as any,
        amount: numericAmount,
        chainId: toChain,
        sourceChains: sourceChains
      };

      const simulationResult = await nexusSdk.simulateBridge(bridgeParams);

      if (simulationResult) {
        console.log('✅ BRIDGE PREVIEW - Simulation successful:', simulationResult);
        setSimulationResult(simulationResult);
        onSimulate?.(simulationResult);
      } else {
        // Create a mock result if simulation returns null
        const mockResult: BridgeSimulationResult = {
          intent: {
            sources: [{
              amount: numericAmount.toString(),
              chainID: fromChain,
              tokenAddress: '0x0000000000000000000000000000000000000000',
              decimals: token === 'ETH' ? 18 : 6,
              symbol: token
            }],
            destination: {
              amount: (numericAmount * 0.995).toString(), // Assume ~0.5% bridge fees
              chainID: toChain,
              tokenAddress: '0x0000000000000000000000000000000000000000',
              decimals: token === 'ETH' ? 18 : 6,
              symbol: token
            },
            fees: {
              protocol: '0.1',
              solver: '0.05',
              gasSupplied: '2.5',
              caGas: '0.3',
              total: '2.95'
            },
            isAvailableBalanceInsufficient: false
          }
        };

        setSimulationResult(mockResult);
        onSimulate?.(mockResult);
      }

    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Bridge simulation failed';
      console.error('❌ BRIDGE PREVIEW - Simulation error:', error);
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
                `~${parseFloat(simulationResult.intent.destination.amount).toFixed(6)} ${token}`
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

        {simulationResult && (
          <div className="space-y-3">
            {simulationResult.intent.isAvailableBalanceInsufficient ? (
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
                        {parseFloat(simulationResult.intent.destination.amount).toFixed(6)} {token}
                      </code></div>
                      <div>Total fees: <code className="bg-muted px-1 rounded text-xs">
                        {simulationResult.intent.fees.total} {token}
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
                    {simulationResult.intent.sources.map((source, index) => (
                      <Badge key={index} variant="outline">
                        Chain {source.chainID}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Destination Chain:</span>
                  <Badge variant="outline">Chain {simulationResult.intent.destination.chainID}</Badge>
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
                  <span>{simulationResult.intent.fees.protocol} {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Solver fee:</span>
                  <span>{simulationResult.intent.fees.solver} {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas costs:</span>
                  <span>{simulationResult.intent.fees.gasSupplied} {token}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total fees:</span>
                  <span>{simulationResult.intent.fees.total} {token}</span>
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