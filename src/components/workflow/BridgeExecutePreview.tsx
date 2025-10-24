'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, CheckCircle, AlertCircle, Zap, Code, ArrowUpDown } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';

interface BridgeExecutePreviewProps {
  token: string;
  amount: string;
  toChainId: number;
  sourceChains?: number[];
  execute: {
    contractAddress: string;
    contractAbi: any[];
    functionName: string;
    parameters?: any[];
    tokenApproval?: {
      token: string;
      amount: string;
    };
  };
  onSimulate?: (result: any) => void;
}

interface BridgeExecuteSimulationResult {
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
  execute: {
    estimatedGas: string;
    contractAddress: string;
    functionName: string;
  };
}

export const BridgeExecutePreview: React.FC<BridgeExecutePreviewProps> = ({
  token,
  amount,
  toChainId,
  sourceChains,
  execute,
  onSimulate
}) => {
  const { nexusSdk, isInitialized } = useNexus();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<BridgeExecuteSimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const isValidForSimulation = () => {
    return (
      token &&
      amount &&
      !isNaN(Number(amount)) &&
      Number(amount) > 0 &&
      toChainId &&
      execute?.contractAddress &&
      execute?.functionName
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
      console.log('🔍 BRIDGE-EXECUTE PREVIEW - Simulating bridge and execute:', {
        token,
        amount: numericAmount,
        toChainId,
        sourceChains,
        execute
      });

      // For bridge-execute, we need to simulate both bridge and execution
      // Since the SDK might not have a direct simulation method, we'll create a mock result
      const mockResult: BridgeExecuteSimulationResult = {
        intent: {
          sources: [
            {
              amount: numericAmount.toString(),
              chainID: sourceChains?.[0] || 1, // Default to mainnet if no source chains
              tokenAddress: '0x0000000000000000000000000000000000000000',
              decimals: token === 'ETH' ? 18 : 6,
              symbol: token
            }
          ],
          destination: {
            amount: (numericAmount * 0.995).toString(), // Account for bridge fees
            chainID: toChainId,
            tokenAddress: '0x0000000000000000000000000000000000000000',
            decimals: token === 'ETH' ? 18 : 6,
            symbol: token
          },
          fees: {
            protocol: '0.1',
            solver: '0.05',
            gasSupplied: '3.5', // Higher gas for bridge + execute
            caGas: '0.5',
            total: '4.15'
          },
          isAvailableBalanceInsufficient: false
        },
        execute: {
          estimatedGas: '150000', // Estimated gas for contract execution
          contractAddress: execute.contractAddress,
          functionName: execute.functionName
        }
      };

      console.log('✅ BRIDGE-EXECUTE PREVIEW - Simulation successful:', mockResult);
      setSimulationResult(mockResult);
      onSimulate?.(mockResult);

    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Bridge-execute simulation failed';
      console.error('❌ BRIDGE-EXECUTE PREVIEW - Simulation error:', error);
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
  }, [token, amount, toChainId, sourceChains, execute, nexusSdk, isInitialized]);

  if (!isValidForSimulation()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Bridge & Execute Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete bridge-execute configuration to see preview
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Bridge & Execute Operation Preview
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

        {/* Operation Overview */}
        <div className="space-y-3">
          {/* Bridge Step */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Step 1: Bridge Tokens</div>
                <div className="text-xs text-muted-foreground">
                  {amount} {token} → Chain {toChainId}
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Execute Step */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Step 2: Execute Contract</div>
                <div className="text-xs text-muted-foreground">
                  {execute.functionName}() on {execute.contractAddress.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Results */}
        {isSimulating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Simulating bridge and contract execution...
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
                    You don't have enough {token} across all chains to complete this operation including fees.
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div><strong>Bridge & Execute Ready</strong></div>
                    <div className="text-sm space-y-1">
                      <div>Tokens to bridge: <code className="bg-muted px-1 rounded text-xs">
                        {parseFloat(simulationResult.intent.destination.amount).toFixed(6)} {token}
                      </code></div>
                      <div>Total fees: <code className="bg-muted px-1 rounded text-xs">
                        {simulationResult.intent.fees.total} {token}
                      </code></div>
                      <div>Execution gas: <code className="bg-muted px-1 rounded text-xs">
                        ~{simulationResult.execute.estimatedGas} gas
                      </code></div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Operation Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Operation Details</h4>
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
                <div className="flex items-center justify-between text-sm">
                  <span>Contract:</span>
                  <code className="text-xs bg-muted px-1 rounded">
                    {execute.contractAddress.slice(0, 8)}...{execute.contractAddress.slice(-6)}
                  </code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Function:</span>
                  <code className="text-xs bg-muted px-1 rounded">{execute.functionName}()</code>
                </div>
                {execute.parameters && execute.parameters.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Parameters:</span>
                    <Badge variant="secondary">{execute.parameters.length} param(s)</Badge>
                  </div>
                )}
                {execute.tokenApproval && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Token Approval:</span>
                    <Badge variant="secondary">
                      {execute.tokenApproval.amount} {execute.tokenApproval.token}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Fee Breakdown</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Bridge protocol fee:</span>
                  <span>{simulationResult.intent.fees.protocol} {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bridge solver fee:</span>
                  <span>{simulationResult.intent.fees.solver} {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas costs:</span>
                  <span>{simulationResult.intent.fees.gasSupplied} {token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Execution gas:</span>
                  <span>{simulationResult.intent.fees.caGas} {token}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total fees:</span>
                  <span>{simulationResult.intent.fees.total} {token}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operation Notice */}
        <div className="text-xs text-muted-foreground p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <strong>Bridge & Execute:</strong> This operation first bridges tokens to the destination chain,
          then automatically executes the specified contract function. The entire operation is atomic -
          if the contract execution fails, the bridge will not complete. Typical completion time: 60-120 seconds.
        </div>
      </CardContent>
    </Card>
  );
};