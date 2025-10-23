'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock, ArrowRight, Wallet, Info } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';
import { useAccount } from 'wagmi';
import { SUPPORTED_CHAINS_IDS, SUPPORTED_TOKENS } from '@/types/workflow';

interface TransferPreviewProps {
  token: SUPPORTED_TOKENS;
  amount: string | number;
  chainId: SUPPORTED_CHAINS_IDS;
  recipient: string;
  sourceChains?: SUPPORTED_CHAINS_IDS[];
  onSimulate?: (result: any) => void;
}

interface SimulationResult {
  intent: {
    fees: {
      protocol: string;
      solver: string;
      gasSupplied: string;
      caGas: string;
      total: string;
    };
    sources: Array<{
      chainID: number;
      amount: string;
      chainName?: string;
    }>;
    destination: {
      chainID: number;
      amount: string;
      chainName?: string;
    };
  };
  token: {
    symbol: string;
    decimals: number;
  };
}

export const TransferPreview: React.FC<TransferPreviewProps> = ({
  token,
  amount,
  chainId,
  recipient,
  sourceChains,
  onSimulate
}) => {
  const { nexusSdk, isInitialized } = useNexus();
  const { address: walletAddress } = useAccount();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<any>(null);
  const [ethBalance, setEthBalance] = useState<any>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Helper to validate inputs
  const isValidForSimulation = () => {
    const numericAmount = Number(amount);
    return (
      token &&
      chainId &&
      recipient &&
      recipient.startsWith('0x') &&
      recipient.length === 42 &&
      !isNaN(numericAmount) &&
      numericAmount > 0
    );
  };

  // Helper to determine if transfer is direct or chain abstraction
  const isDirect = simulationResult ? parseFloat(simulationResult.intent.fees.caGas) === 0 : false;

  // Load user balance for the specified token and ETH for gas
  const loadUserBalance = async () => {
    if (!nexusSdk || !isInitialized || !token) {
      return;
    }

    setIsLoadingBalance(true);
    try {
      // Load primary token balance
      const balance = await nexusSdk.getUnifiedBalance(token);
      setUserBalance(balance);
      console.log('💰 User balance loaded:', balance);

      // Also load ETH balance for gas checking (unless token is ETH)
      if (token !== 'ETH') {
        try {
          const ethBal = await nexusSdk.getUnifiedBalance('ETH');
          setEthBalance(ethBal);
          console.log('⛽ ETH balance loaded:', ethBal);
        } catch (ethError) {
          console.warn('⚠️ Could not load ETH balance:', ethError);
          setEthBalance(null);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load user balance:', error);
      setUserBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Run simulation
  const runSimulation = async () => {
    if (!nexusSdk || !isInitialized || !isValidForSimulation()) {
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);

    const numericAmount = Number(amount);

    try {
      const result = await nexusSdk.simulateTransfer({
        token,
        amount: numericAmount,
        chainId,
        recipient: recipient as `0x${string}`,
        sourceChains
      });

      setSimulationResult(result);
      onSimulate?.(result);
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Simulation failed';

      // Handle "ca not applicable" according to SDK documentation
      if (errorMessage === 'ca not applicable') {
        console.log('⚡ TRANSFER PREVIEW - "ca not applicable" means direct transfer will be used');
        // This is actually success - create a mock simulation result for direct transfer
        const mockDirectTransferResult = {
          intent: {
            fees: {
              caGas: '0', // Indicates direct transfer
              gasSupplied: '0.01', // Estimated gas cost
              total: '0'
            },
            sources: [],
            destination: {
              amount: numericAmount.toString(),
              chainID: chainId
            },
            isAvailableBalanceInsufficient: false
          },
          token: { symbol: token }
        };
        setSimulationResult(mockDirectTransferResult as any);
        onSimulate?.(mockDirectTransferResult as any);
        return;
      }

      // Enhanced error messaging for common issues
      if (errorMessage.includes('Insufficient balance')) {
        const totalBalance = userBalance ? parseFloat(userBalance.balance) : 0;
        const requestedAmount = parseFloat(amount.toString());

        if (totalBalance >= requestedAmount) {
          // User has sufficient token balance, issue is likely gas or chain-specific
          const destinationEthBalance = ethBalance?.breakdown?.find((b: any) => b.chain?.id === chainId);
          const hasGasOnDestination = destinationEthBalance && parseFloat(destinationEthBalance.balance || '0') > 0.001;

          // Get chain name for user-friendly display
          const getChainName = (id: number) => {
            const chainNames: { [key: number]: string } = {
              1: 'Ethereum',
              10: 'Optimism',
              137: 'Polygon',
              42161: 'Arbitrum',
              43114: 'Avalanche',
              8453: 'Base',
              534352: 'Scroll',
              56: 'BNB Chain'
            };
            return chainNames[id] || `Chain ${id}`;
          };

          if (!hasGasOnDestination) {
            // Clear, simple error for missing gas
            errorMessage = `🚫 Missing Gas Token

You have enough ${token} but need ETH to pay for gas fees on ${getChainName(chainId)}.

💡 Quick Fix:
• Get some ETH on ${getChainName(chainId)}
• You only need ~$5-10 worth of ETH for gas
• Bridge ETH from another chain or buy directly

Once you have ETH on ${getChainName(chainId)}, this transfer will work perfectly!`;
          } else {
            // Other distribution issues
            errorMessage = `⚠️ Balance Distribution Issue

You have enough ${token} (${userBalance?.balance || 'unknown'} total) but the transfer cannot be optimized.

This could be due to:
• Token balance spread across chains in a way that's not optimal for routing
• Network connectivity issues
• Temporary SDK issues

💡 Try:
• Wait a moment and try again
• Try a smaller amount first
• Check your balance breakdown below`;
          }
        } else {
          errorMessage = `💸 Not Enough ${token}

You need ${amount} ${token} but only have ${userBalance?.balance || '0'} ${token} total.

💡 Get more ${token}:
• Buy ${token} on an exchange
• Bridge ${token} from another wallet
• Use a different token or amount`;
        }
      } else if (errorMessage.includes('internal error')) {
        errorMessage = `🔄 Temporary Issue

The simulation couldn't complete due to network or system issues.

💡 Please:
• Wait 10-30 seconds and try again
• Check your internet connection
• Try refreshing the page if it persists`;
      }

      setSimulationError(errorMessage);
      console.error('🔍 DETAILED Transfer simulation error:', {
        originalError: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        walletAddress,
        userBalance: userBalance,
        requestedAmount: amount,
        requestedAmountNum: Number(amount),
        token,
        chainId,
        sourceChains,
        hasBalance: userBalance ? parseFloat(userBalance.balance) >= Number(amount) : false,
        balanceBreakdown: userBalance?.breakdown || 'No breakdown available'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Load balance when token or SDK state changes
  useEffect(() => {
    if (nexusSdk && isInitialized && token) {
      loadUserBalance();
    }
  }, [token, nexusSdk, isInitialized]);

  // Auto-simulate when valid inputs change
  useEffect(() => {
    if (isValidForSimulation() && nexusSdk && isInitialized) {
      const timer = setTimeout(() => {
        runSimulation();
      }, 500); // Debounce simulation calls

      return () => clearTimeout(timer);
    } else {
      setSimulationResult(null);
      setSimulationError(null);
    }
  }, [token, amount, chainId, recipient, sourceChains, nexusSdk, isInitialized, userBalance]);

  if (!isValidForSimulation()) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Complete all fields to see transfer preview</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isInitialized) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">SDK not initialized - cannot simulate transfer</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transfer Preview</CardTitle>
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
        {/* Wallet Address and Balance Info */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Wallet Information
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Address:</span>
              <span className="font-mono text-xs">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                {token} Balance:
              </span>
              <span className={`font-medium ${isLoadingBalance ? 'text-gray-400' : ''}`}>
                {isLoadingBalance ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : userBalance ? (
                  <span className={parseFloat(userBalance.balance) >= Number(amount) ? 'text-green-600' : 'text-red-600'}>
                    {userBalance.balance} {token}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </span>
            </div>
            {userBalance && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">USD Value:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  ${userBalance.balanceInFiat?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}
            {ethBalance && token !== 'ETH' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">ETH (Gas):</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {ethBalance.balance} ETH
                </span>
              </div>
            )}
          </div>

          {/* Gas Balance Warning */}
          {token !== 'ETH' && ethBalance && (
            (() => {
              const destinationEthBalance = ethBalance?.breakdown?.find((b: any) => b.chain?.id === chainId);
              const hasLowGas = !destinationEthBalance || parseFloat(destinationEthBalance.balance || '0') < 0.005;

              if (hasLowGas) {
                const getChainName = (id: number) => {
                  const chainNames: { [key: number]: string } = {
                    1: 'Ethereum', 10: 'Optimism', 137: 'Polygon', 42161: 'Arbitrum',
                    43114: 'Avalanche', 8453: 'Base', 534352: 'Scroll', 56: 'BNB Chain'
                  };
                  return chainNames[id] || `Chain ${id}`;
                };

                return (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600">⚠️</span>
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Low Gas Balance
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                          You need ETH on {getChainName(chainId)} for gas fees. Consider getting ~$5-10 worth of ETH there.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()
          )}

          {/* Chain-specific balance breakdown */}
          {userBalance?.breakdown && userBalance.breakdown.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Balance breakdown across chains ({userBalance.breakdown.length} chains)
              </summary>
              <div className="mt-2 space-y-1">
                {userBalance.breakdown.map((chainBalance: any, index: number) => {
                  const isDestinationChain = chainBalance.chain?.id === chainId;
                  const ethOnThisChain = ethBalance?.breakdown?.find((eb: any) => eb.chain?.id === chainBalance.chain?.id);
                  const hasGas = ethOnThisChain && parseFloat(ethOnThisChain.balance || '0') > 0.001;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`text-gray-600 dark:text-gray-400 ${isDestinationChain ? 'font-medium' : ''}`}>
                          {chainBalance.chain?.name || `Chain ${chainBalance.chain?.id}`}
                          {isDestinationChain ? ' (destination)' : ''}:
                        </span>
                        <span className={`${chainBalance.balance !== '0' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                          {chainBalance.balance} {token}
                        </span>
                      </div>
                      {isDestinationChain && token !== 'ETH' && (
                        <div className="flex justify-between items-center text-xs ml-2">
                          <span className="text-gray-500">Gas (ETH):</span>
                          <span className={`${hasGas ? 'text-green-600' : 'text-red-500'}`}>
                            {ethOnThisChain ? `${ethOnThisChain.balance} ETH` : 'No ETH'}
                            {!hasGas && ' ⚠️'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>

        {isSimulating && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Running transfer simulation...</span>
          </div>
        )}

        {simulationError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Simulation Failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {simulationError}
                </p>
              </div>
            </div>
          </div>
        )}

        {simulationResult && (
          <div className="space-y-4">
            {/* Transfer Type Badge */}
            <div className="flex items-center gap-2">
              <Badge variant={isDirect ? "default" : "secondary"} className="flex items-center gap-1">
                {isDirect ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Direct Transfer
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Chain Abstraction
                  </>
                )}
              </Badge>

              <span className="text-sm text-muted-foreground">
                {isDirect ? '5-15 seconds' : '30-90 seconds'}
              </span>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Cost Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer Amount:</span>
                  <span>{amount} {token}</span>
                </div>

                {!isDirect && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protocol Fee:</span>
                      <span>{simulationResult.intent.fees.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Solver Fee:</span>
                      <span>{simulationResult.intent.fees.solver}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Fee:</span>
                  <span>{simulationResult.intent.fees.gasSupplied}</span>
                </div>

                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Cost:</span>
                    <span>{simulationResult.intent.fees.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Chains (for Chain Abstraction) */}
            {!isDirect && simulationResult.intent.sources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Funding Sources</h4>
                <div className="space-y-1">
                  {simulationResult.intent.sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Chain {source.chainID}: {source.amount} {token}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Destination */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Destination</h4>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="h-4 w-4 text-green-500" />
                <span>Chain {chainId}: {simulationResult.intent.destination.amount} {token}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                To: {recipient.slice(0, 6)}...{recipient.slice(-4)}
              </div>
            </div>

            {/* Transfer Path Explanation */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {isDirect ? (
                  <>
                    <strong>Optimized Path:</strong> You have sufficient {token} and gas on the destination chain.
                    This transfer will execute directly without bridging, making it faster and cheaper.
                  </>
                ) : (
                  <>
                    <strong>Chain Abstraction Path:</strong> Funds will be automatically sourced from your
                    balances across multiple chains and bridged to the destination before transfer.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};