'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, CheckCircle, AlertCircle, Zap, Code, ArrowUpDown } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';
import {
  handleSimulationResult,
  checkDirectOperationBalance,
  estimateDirectOperationGas,
  type SimulationResult
} from '@/lib/workflow/simulationUtils';

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
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
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
      console.log('🔍 BRIDGE-EXECUTE PREVIEW - Starting simulation:', {
        token,
        amount: numericAmount,
        toChainId,
        sourceChains,
        execute
      });

      // Bridge-execute uses bridgeAndExecute method for simulation
      const bridgeExecuteParams = {
        token: token as any,
        amount: numericAmount,
        toChainId: toChainId,
        sourceChains: sourceChains,
        execute: {
          contractAddress: execute.contractAddress,
          contractAbi: execute.contractAbi,
          functionName: execute.functionName,
          parameters: execute.parameters || [],
          tokenApproval: execute.tokenApproval
        }
      };

      // Use unified simulation handler
      const result = await handleSimulationResult(
        async () => {
          // SDK might not have a direct bridgeAndExecute simulation method
          // Try to simulate the bridge part first
          try {
            return await nexusSdk.simulateBridge({
              token: token as any,
              amount: numericAmount,
              chainId: toChainId as any,
              sourceChains: sourceChains as any
            });
          } catch (error) {
            // If bridge simulation fails, bridge-execute might still work
            console.log('🔄 Bridge simulation failed, continuing with balance check...');
            return null;
          }
        },
        'bridge-execute',
        estimateDirectOperationGas('bridge', toChainId)
      );

      if (result.type === 'ERROR') {
        setSimulationError(result.error || 'Bridge-execute simulation failed');
        return;
      }

      // For bridge-execute, if no bridge route, check if user has funds on target chain for direct execute
      if (result.type === 'DIRECT_OPERATION') {
        const balanceCheck = await checkDirectOperationBalance(nexusSdk, token, numericAmount, toChainId);
        if (!balanceCheck.sufficient) {
          setSimulationError(`Insufficient balance for bridge-execute operation. ${balanceCheck.error}`);
          return;
        }

        // Create a custom result for direct execute scenario
        result.simulation = {
          intent: {
            sources: [],
            destination: {
              amount: numericAmount.toString(),
              chainID: toChainId,
              symbol: token
            },
            fees: result.fees
          },
          execute: {
            estimatedGas: '150000',
            contractAddress: execute.contractAddress,
            functionName: execute.functionName
          }
        };
        result.directOperationMode = true;
      }

      // Additional balance check for CA route
      if (result.type === 'CA_ROUTE' && !result.isInsufficientBalance) {
        const balanceCheck = await checkDirectOperationBalance(nexusSdk, token, numericAmount);
        if (!balanceCheck.sufficient) {
          result.isInsufficientBalance = true;
          if (result.simulation) {
            result.simulation.intent.isAvailableBalanceInsufficient = true;
          }
        }
      }

      console.log('✅ BRIDGE-EXECUTE PREVIEW - Simulation completed:', result);
      setSimulationResult(result);
      onSimulate?.(result.simulation);

    } catch (error) {
      console.error('❌ BRIDGE-EXECUTE PREVIEW - Simulation error:', error);
      setSimulationError(error instanceof Error ? error.message : 'Bridge-execute simulation failed');
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

        {simulationResult && simulationResult.simulation && (
          <div className="space-y-3">
            {simulationResult.isInsufficientBalance ? (
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
                    <div>
                      <strong>
                        {simulationResult.directOperationMode ? 'Direct Execute Ready' : 'Bridge & Execute Ready'}
                      </strong>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>Tokens to {simulationResult.directOperationMode ? 'use' : 'bridge'}: <code className="bg-muted px-1 rounded text-xs">
                        {parseFloat(simulationResult.simulation?.intent?.destination?.amount || '0').toFixed(6)} {token}
                      </code></div>
                      {simulationResult.fees?.total && (
                        <div>Total fees: <code className="bg-muted px-1 rounded text-xs">
                          {simulationResult.fees.total} {token}
                        </code></div>
                      )}
                      <div>Execution gas: <code className="bg-muted px-1 rounded text-xs">
                        ~{simulationResult.simulation.execute?.estimatedGas || '150000'} gas
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
                {simulationResult.simulation?.intent?.sources && simulationResult.simulation?.intent?.sources?.length > 0 && (
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
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>Destination Chain:</span>
                  <Badge variant="outline">Chain {simulationResult.simulation?.intent?.destination?.chainID || toChainId}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Operation Type:</span>
                  <Badge variant={simulationResult.directOperationMode ? "secondary" : "default"}>
                    {simulationResult.directOperationMode ? 'Direct Execute' : 'Bridge + Execute'}
                  </Badge>
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
            {simulationResult.fees && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fee Breakdown</h4>
                <div className="text-xs space-y-1">
                  {simulationResult.fees.protocol && (
                    <div className="flex justify-between">
                      <span>Bridge protocol fee:</span>
                      <span>{simulationResult.fees.protocol} {token}</span>
                    </div>
                  )}
                  {simulationResult.fees.solver && (
                    <div className="flex justify-between">
                      <span>Bridge solver fee:</span>
                      <span>{simulationResult.fees.solver} {token}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Gas costs:</span>
                    <span>{simulationResult.fees.gasSupplied || '0.005'} {token}</span>
                  </div>
                  {simulationResult.fees.caGas && (
                    <div className="flex justify-between">
                      <span>Execution gas:</span>
                      <span>{simulationResult.fees.caGas} {token}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total fees:</span>
                    <span>{simulationResult.fees.total} {token}</span>
                  </div>
                </div>
              </div>
            )}
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