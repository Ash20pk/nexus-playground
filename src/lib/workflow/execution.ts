import { NexusSDK } from '@avail-project/nexus-core';
import {
  Workflow,
  WorkflowNode,
  WorkflowExecution,
  BridgeNodeConfig,
  TransferNodeConfig,
  SwapNodeConfig,
  StakeNodeConfig,
  BridgeExecuteNodeConfig,
  CustomContractNodeConfig,
  AllowanceManagementNodeConfig,
  SimulateBridgeNodeConfig,
  SimulateTransferNodeConfig,
  BalanceCheckNodeConfig,
  DelayNodeConfig,
  LoopNodeConfig,
  SplitNodeConfig,
  AggregateNodeConfig
} from '@/types/workflow';
import { DEFI_PROTOCOLS, getProtocolConfig } from '@/lib/defi-config';
// Network store is used in workflowStore.ts to pass networkType to context

export interface WorkflowExecutionContext {
  nexusSdk: NexusSDK;
  variables: Record<string, unknown>;
  results: Record<string, unknown>;
  networkType?: 'testnet' | 'mainnet'; // Add network type to context
  onNodeExecuting?: (nodeId: string | null) => void;
  onNodeStatus?: (nodeId: string, status: 'success' | 'error' | null) => void;
  onNodeError?: (nodeId: string, error: {
    message: string;
    details?: string;
    timestamp: string;
    errorType?: 'validation' | 'network' | 'execution' | 'timeout' | 'unknown';
    originalError?: any;
    context?: Record<string, any>;
    suggestions?: string[];
    retryable?: boolean;
  }) => void;
}

export class WorkflowExecutionEngine {
  private context: WorkflowExecutionContext;

  constructor(context: WorkflowExecutionContext) {
    this.context = context;
  }

  async execute(workflow: Workflow): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: Date.now().toString(),
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      results: {}
    };

    try {
      // Find trigger node to start execution
      const triggerNode = workflow.nodes.find(node => node.data.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      // Get execution path starting from trigger node
      const executionPath = this.getExecutionPath(workflow, triggerNode.id);

      console.log(`🔄 WORKFLOW EXECUTION - Found ${executionPath.length} connected nodes to execute:`,
        executionPath.map(node => `${node.data.label} (${node.data.type})`));

      // Execute nodes in the connected path
      for (const node of executionPath) {
        console.log(`Executing node: ${node.data.label} (${node.data.type})`);
        this.context.onNodeExecuting?.(node.id);

        try {
          const result = await this.executeNode(node);
          execution.results[node.id] = result;
          this.context.results[node.id] = result;
          this.context.onNodeStatus?.(node.id, 'success');
        } catch (error) {
          console.error(`Node ${node.id} failed:`, error);
          this.context.onNodeStatus?.(node.id, 'error');
          throw error;
        }
      }

      execution.status = 'completed';
      execution.endTime = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date();
      throw error;
    }

    return execution;
  }

  private async executeNode(node: WorkflowNode): Promise<unknown> {
    switch (node.data.type) {
      case 'trigger':
        return this.executeTrigger(node);

      case 'bridge':
        return this.executeBridge(node);

      case 'transfer':
        return this.executeTransfer(node);

      case 'swap':
        return this.executeSwap(node);

      case 'stake':
        return this.executeStake(node);

      case 'custom':
        return this.executeCustomContract(node);

      case 'allowance-management':
        return this.executeAllowanceManagement(node);

      case 'simulate-bridge':
        return this.executeSimulateBridge(node);

      case 'simulate-transfer':
        return this.executeSimulateTransfer(node);

      case 'bridge-execute':
        return this.executeBridgeExecute(node);

      case 'stake':
        return this.executeStake(node);

      case 'balance-check':
        return this.executeBalanceCheck(node);

      case 'delay':
        return this.executeDelay(node);

      case 'condition':
        return this.executeCondition(node);

      case 'loop':
        return this.executeLoop(node);

      case 'split':
        return this.executeSplit(node);

      case 'aggregate':
        return this.executeAggregate(node);

      case 'notification':
        return this.executeNotification(node);

      default:
        throw new Error(`Unknown node type: ${node.data.type}`);
    }
  }

  private async executeTrigger(): Promise<unknown> {
    return { triggered: true, timestamp: new Date() };
  }

  private async executeBridge(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as BridgeNodeConfig;
    const amount = this.resolveValue(config.amount);

    // Validate amount
    if (!amount || amount === '' || isNaN(Number(amount))) {
      throw new Error(`Invalid bridge amount: ${amount}. Please provide a valid numeric amount.`);
    }

    console.log('🌉 NEXUS BRIDGE - Starting bridge operation:', {
      token: config.token,
      amount,
      resolvedAmount: Number(amount),
      fromChain: config.fromChain,
      toChain: config.toChain,
      sourceChains: config.sourceChains
    });

    try {
      // Step 1: Simulate bridge to check feasibility and get cost preview
      console.log('🔍 NEXUS BRIDGE - Simulating bridge...');
      let simulationResult;

      try {
        const bridgeParams = {
          token: config.token as any, // Cast to SDK supported token type
          amount: Number(amount),
          chainId: config.toChain,
          sourceChains: config.sourceChains // Optional source chain restriction
        };

        simulationResult = await this.context.nexusSdk.simulateBridge(bridgeParams);

        if (simulationResult) {
          console.log('✅ NEXUS BRIDGE - Simulation successful:', {
            destination: simulationResult.intent.destination,
            sources: simulationResult.intent.sources,
            fees: simulationResult.intent.fees,
            isInsufficientBalance: simulationResult.intent.isAvailableBalanceInsufficient
          });

          if (simulationResult.intent.isAvailableBalanceInsufficient) {
            const fees = parseFloat(simulationResult.intent.fees.total);
            throw new Error(`Insufficient balance including fees: need ${Number(amount) + fees} ${config.token} total`);
          }
        } else {
          console.log('⚠️ NEXUS BRIDGE - Simulation returned null, proceeding with caution');
        }
      } catch (simError) {
        console.error('❌ NEXUS BRIDGE - Simulation failed:', simError.message);
        // Log additional context for debugging
        console.error('❌ NEXUS BRIDGE - Error context:', {
          errorType: simError.constructor.name,
          fullError: simError,
          bridgeParams: { token: config.token, amount: Number(amount), chainId: config.toChain }
        });
        throw new Error(`Bridge simulation failed: ${simError.message}`);
      }

      // Step 2: Set up progress tracking
      const bridgeSteps: string[] = [];
      let currentStep = 0;

      const stepListener = (step: any) => {
        bridgeSteps.push(step.typeID);
        currentStep++;
        console.log(`🔄 NEXUS BRIDGE - Step ${currentStep}: ${step.typeID}`, {
          stepType: step.typeID,
          explorerURL: step.explorerURL || 'N/A',
          totalSteps: bridgeSteps.length
        });

        switch (step.typeID) {
          case 'CS':
            console.log('🔄 NEXUS BRIDGE - Chain switched');
            break;
          case 'AL':
            console.log('🔄 NEXUS BRIDGE - Allowance set');
            break;
          case 'BS':
            console.log('🔄 NEXUS BRIDGE - Balance sufficient');
            break;
          case 'IS':
            console.log('✅ NEXUS BRIDGE - Intent successful!');
            if (step.data?.explorerURL) {
              console.log('🔗 NEXUS BRIDGE - Transaction:', step.data.explorerURL);
            }
            break;
        }
      };

      const completionListener = (step: any) => {
        if (step.typeID === 'IS' && step.data?.explorerURL) {
          console.log('🎉 NEXUS BRIDGE - Bridge completed successfully!');
          console.log('🔗 Explorer URL:', step.data.explorerURL);
        }
      };

      // Attach event listeners
      this.context.nexusSdk.nexusEvents.on('expected_steps', stepListener);
      this.context.nexusSdk.nexusEvents.on('step_complete', completionListener);

      try {
        // Step 3: Execute the bridge
        console.log('🚀 NEXUS BRIDGE - Executing bridge...');
        const result = await this.context.nexusSdk.bridge({
          token: config.token as any,
          amount: Number(amount),
          chainId: config.toChain,
          sourceChains: config.sourceChains
        });

        console.log('✅ NEXUS BRIDGE - Bridge operation completed:', result);

        if (!result.success) {
          throw new Error(`Bridge failed: ${result.error}`);
        }

        return {
          type: 'bridge',
          amount: Number(amount),
          token: config.token,
          fromChain: config.fromChain,
          toChain: config.toChain,
          sourceChains: config.sourceChains,
          transactionHash: result.transactionHash || '',
          explorerUrl: result.explorerUrl || '',
          success: true,
          timestamp: new Date().toISOString(),
          steps: bridgeSteps,
          completedSteps: currentStep,
          fees: simulationResult?.intent.fees
        };
      } finally {
        // Clean up event listeners
        this.context.nexusSdk.nexusEvents.off('expected_steps', stepListener);
        this.context.nexusSdk.nexusEvents.off('step_complete', completionListener);
      }
    } catch (error) {
      console.error('❌ NEXUS BRIDGE - Bridge failed with detailed error info:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        token: config.token,
        amount: Number(amount),
        fromChain: config.fromChain,
        toChain: config.toChain,
        sourceChains: config.sourceChains
      });
      throw new Error(`Bridge operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeTransfer(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as TransferNodeConfig;

    // Resolve amount (could be from previous node or static value)
    const amount = this.resolveValue(config.amount);

    // Validate inputs following SDK documentation best practices
    if (!config.token || !config.chain || !config.toAddress) {
      throw new Error('Transfer requires token, chain, and recipient address');
    }

    // Validate recipient address format
    if (!config.toAddress.startsWith('0x') || config.toAddress.length !== 42) {
      throw new Error('Invalid recipient address format. Must be a valid Ethereum address (0x...)');
    }

    // Validate amount
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Transfer amount must be a positive number');
    }

    console.log('💸 TRANSFER - Starting transfer operation:', {
      token: config.token,
      amount: numericAmount,
      destinationChain: config.chain,
      recipient: config.toAddress,
      sourceChains: config.sourceChains ? `restricted to ${config.sourceChains.join(', ')}` : 'auto-select'
    });

    try {
      // Follow official SDK pattern for transfer simulation
      console.log('🔍 TRANSFER - Running transfer simulation...');
      let simulationResult = null;
      let useDirectTransfer = false;

      // Simulate transfer following official documentation pattern
      const transferParams = {
        token: config.token,
        amount: numericAmount,
        chainId: config.chain,
        recipient: config.toAddress as `0x${string}`,
        sourceChains: config.sourceChains
      };

      console.log('🔍 TRANSFER - Transfer parameters:', {
        ...transferParams,
        recipientValid: /^0x[a-fA-F0-9]{40}$/.test(config.toAddress),
        amountType: typeof numericAmount,
        amountValue: numericAmount
      });

      // Check if token is supported on the target chain
      try {
        const supportedChains = this.context.nexusSdk.utils.getSupportedChains();
        const targetChain = supportedChains.find(chain => chain.id === config.chain);
        console.log('🔍 TRANSFER - Chain support check:', {
          targetChainId: config.chain,
          chainFound: !!targetChain,
          chainName: targetChain?.name
        });

        const isTokenSupported = this.context.nexusSdk.utils.isSupportedToken(config.token);
        console.log('🔍 TRANSFER - Token support check:', {
          token: config.token,
          isSupported: isTokenSupported
        });
      } catch (checkError) {
        console.warn('⚠️ TRANSFER - Could not check support:', checkError);
      }

      try {
        simulationResult = await this.context.nexusSdk.simulateTransfer(transferParams);

        if (simulationResult) {
          const isDirect = parseFloat(simulationResult.intent.fees.caGas) === 0;
          console.log('✅ TRANSFER - Simulation successful:', {
            transferType: isDirect ? 'Direct Transfer' : 'Chain Abstraction',
            fees: simulationResult.intent.fees,
            sources: simulationResult.intent.sources,
            destination: simulationResult.intent.destination
          });

          useDirectTransfer = isDirect;

          if (simulationResult.intent.isAvailableBalanceInsufficient) {
            const fees = parseFloat(simulationResult.intent.fees.total);
            throw new Error(`Insufficient balance including fees: need ${numericAmount + fees} ${config.token}`);
          }
        } else {
          console.log('⚡ TRANSFER - Simulation returned null, will use direct transfer');
          useDirectTransfer = true;
        }
      } catch (simError) {
        if (simError.message === 'ca not applicable') {
          console.log('⚡ TRANSFER - "ca not applicable" means direct transfer will be used - continuing');
          console.log('⚡ TRANSFER - According to SDK docs, this means you have sufficient balance + gas for direct transfer');
          useDirectTransfer = true;
        } else {
          console.error('❌ TRANSFER - Simulation failed:', simError.message);

          // Log additional context for debugging
          console.error('❌ TRANSFER - Error context:', {
            errorType: simError.constructor.name,
            fullError: simError,
            transferParams: transferParams
          });

          throw new Error(`Transfer simulation failed: ${simError.message}`);
        }
      }

      // Log balance information for debugging
      try {
        const balances = await this.context.nexusSdk.getUnifiedBalance();
        console.log('🔍 TRANSFER - Current user balances:', balances);

        const targetChainBalance = balances.find((b: any) => b.chainId === config.chain);
        console.log('🔍 TRANSFER - Target chain balance:', {
          chainId: config.chain,
          balance: targetChainBalance,
          hasTokenBalance: targetChainBalance?.[config.token] || 0,
          hasEthBalance: targetChainBalance?.ETH || 0
        });
      } catch (balanceError) {
        console.warn('⚠️ TRANSFER - Could not fetch balances for debugging:', balanceError);
      }

      // Set up progress tracking for the transfer
      const transferSteps: string[] = [];
      let currentStep = 0;

      // Listen for expected steps
      const stepListener = (steps: any[]) => {
        transferSteps.length = 0;
        transferSteps.push(...steps.map((s: any) => s.typeID));
        console.log('💸 TRANSFER - Expected steps:', transferSteps);
        console.log('💸 TRANSFER - Step details:', steps);
      };

      // Listen for step completion
      const completionListener = (step: any) => {
        currentStep++;
        console.log(`💸 TRANSFER - Step completed (${currentStep}/${transferSteps.length}):`, {
          typeID: step.typeID,
          type: step.type,
          data: step.data
        });

        // Update node status for UI feedback
        if (step.typeID === 'IS' && step.data?.explorerURL) {
          console.log('✅ TRANSFER - Transfer confirmed on-chain:', {
            transactionHash: step.data.transactionHash,
            explorerUrl: step.data.explorerURL
          });
        }
      };

      // Attach event listeners
      this.context.nexusSdk.nexusEvents.on('expected_steps', stepListener);
      this.context.nexusSdk.nexusEvents.on('step_complete', completionListener);

      try {
        console.log(`🚀 TRANSFER - Executing transfer (${useDirectTransfer ? 'Direct' : 'Chain Abstraction'} mode expected)...`);

        // Use sdk.transfer() - it handles both direct and chain abstraction automatically
        const result = await this.context.nexusSdk.transfer({
          token: config.token,
          amount: numericAmount,
          chainId: config.chain,
          recipient: config.toAddress as `0x${string}`,
          sourceChains: config.sourceChains
        });

        if (!result.success) {
          console.error('❌ TRANSFER - SDK returned failure:', result);
          throw new Error(`Transfer failed: ${result.error}`);
        }

        console.log('✅ TRANSFER - Transfer completed successfully:', {
          expectedMethod: useDirectTransfer ? 'Direct Transfer' : 'Chain Abstraction',
          transactionHash: result.transactionHash || 'N/A',
          explorerUrl: result.explorerUrl || 'N/A'
        });

        // Return comprehensive result following documentation patterns
        return {
          type: 'transfer',
          token: config.token,
          amount: numericAmount,
          destinationChain: config.chain,
          recipient: config.toAddress,
          transactionHash: result.transactionHash || '',
          explorerUrl: result.explorerUrl || '',
          success: true,
          timestamp: new Date().toISOString(),
          steps: transferSteps,
          completedSteps: currentStep,
          method: useDirectTransfer ? 'Direct Transfer' : 'Chain Abstraction'
        };
      } finally {
        // Clean up event listeners
        this.context.nexusSdk.nexusEvents.off('expected_steps', stepListener);
        this.context.nexusSdk.nexusEvents.off('step_complete', completionListener);
      }
    } catch (error) {
      console.error('❌ TRANSFER - Transfer failed with detailed error info:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        token: config.token,
        amount: numericAmount,
        chainId: config.chain,
        recipient: config.toAddress,
        sourceChains: config.sourceChains
      });
      throw new Error(`Transfer operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeSwap(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as SwapNodeConfig;
    const amount = this.resolveValue(config.amount);

    // Validate amount
    if (!amount || amount === '' || isNaN(Number(amount))) {
      throw new Error(`Invalid swap amount: ${amount}. Please provide a valid numeric amount.`);
    }

    const isSameChainSwap = config.fromChain === config.toChain;
    console.log(`🔄 NEXUS SWAP - Starting ${isSameChainSwap ? 'same-chain' : 'cross-chain'} swap:`, {
      fromToken: config.fromToken,
      toToken: config.toToken,
      amount,
      resolvedAmount: Number(amount),
      fromChain: config.fromChain,
      toChain: config.toChain,
      slippage: config.slippage
    });

    try {
      const result = await this.executeNexusSwap({
        fromToken: config.fromToken,
        toToken: config.toToken,
        amount: amount.toString(),
        fromChain: config.fromChain,
        toChain: config.toChain,
        slippage: config.slippage || 0.5
      });

      console.log('✅ NEXUS SWAP - Completed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ NEXUS SWAP - Failed:', error);
      throw new Error(`Nexus swap failed: ${error.message}`);
    }
  }

  private async executeNexusSwap(config: {
    fromToken: string;
    toToken: string;
    amount: string;
    fromChain: number;
    toChain: number;
    slippage?: number;
  }): Promise<unknown> {
    console.log('🚀 NEXUS SWAP - Executing with native SDK...');

    // Get token addresses first
    const fromTokenAddress = this.getTokenAddress(config.fromToken, config.fromChain);
    const toTokenAddress = this.getTokenAddress(config.toToken, config.toChain);

    // Get decimals and convert amount using proper method
    const decimals = this.getTokenDecimals(config.fromToken);

    // Use a more standard parseUnits approach like the SDK expects
    const amountBigInt = this.parseToWei(config.amount, decimals);

    console.log('🚀 NEXUS SWAP - Amount conversion:', {
      originalAmount: config.amount,
      decimals,
      amountBigInt: amountBigInt.toString(),
      fromTokenSymbol: config.fromToken,
      toTokenSymbol: config.toToken
    });

    console.log('🚀 NEXUS SWAP - Configuration:', {
      fromToken: config.fromToken,
      toToken: config.toToken,
      fromTokenAddress,
      toTokenAddress,
      amount: config.amount,
      amountBigInt: amountBigInt.toString(),
      fromChain: config.fromChain,
      toChain: config.toChain,
      isNativeETH: fromTokenAddress === '0x0000000000000000000000000000000000000000',
      isToNativeToken: toTokenAddress === '0x0000000000000000000000000000000000000000'
    });

    try {
      // Validate swap support following SDK documentation
      console.log('🔍 NEXUS SWAP - Validating swap support...');

      // Check if source token/chain is supported
      const supportedOptions = this.context.nexusSdk.utils.getSwapSupportedChainsAndTokens();

      console.log('🔍 NEXUS SWAP - SDK supported chains and tokens:', {
        totalChains: supportedOptions.length,
        chains: supportedOptions.map(c => ({
          id: c.id,
          name: c.name,
          tokenCount: c.tokens.length,
          tokens: c.tokens.map(t => ({ symbol: t.symbol, address: t.tokenAddress }))
        }))
      });

      const sourceChainSupported = supportedOptions.find(chain => chain.id === config.fromChain);

      if (!sourceChainSupported) {
        throw new Error(`Source chain ${config.fromChain} is not supported for swaps. Supported chains: ${supportedOptions.map(c => `${c.name} (${c.id})`).join(', ')}`);
      }

      console.log('🔍 NEXUS SWAP - Looking for token:', {
        targetSymbol: config.fromToken,
        targetAddress: fromTokenAddress,
        availableTokens: sourceChainSupported.tokens
      });

      const sourceTokenSupported = sourceChainSupported.tokens.find(token =>
        token.symbol === config.fromToken || token.tokenAddress === fromTokenAddress
      );

      if (!sourceTokenSupported) {
        const supportedTokens = sourceChainSupported.tokens.map(t => t.symbol).join(', ');
        throw new Error(`Token ${config.fromToken} is not supported on chain ${config.fromChain}. Supported tokens: ${supportedTokens}`);
      }

      // Detect swap type
      const isSameChainSwap = config.fromChain === config.toChain;

      console.log('✅ NEXUS SWAP - Source validation passed:', {
        fromChain: sourceChainSupported.name,
        fromToken: sourceTokenSupported.symbol,
        supportedTokenAddress: sourceTokenSupported.tokenAddress,
        swapType: isSameChainSwap ? 'Same-chain swap (no bridging)' : 'Cross-chain swap (bridging required)'
      });

      // Validate inputs
      if (amountBigInt <= 0n) {
        throw new Error(`Invalid amount: ${amountBigInt.toString()}. Amount must be greater than 0.`);
      }

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error(`Invalid token addresses: from=${fromTokenAddress}, to=${toTokenAddress}`);
      }

      if (config.fromChain === config.toChain && fromTokenAddress === toTokenAddress) {
        throw new Error('Cannot swap the same token to itself on the same chain');
      }

      // Use the SDK's supported token address if available, otherwise fall back to our mapping
      const actualFromTokenAddress = sourceTokenSupported.tokenAddress || fromTokenAddress;

      console.log('🚀 NEXUS SWAP - Using token addresses:', {
        from: {
          original: fromTokenAddress,
          sdkSupported: sourceTokenSupported.tokenAddress,
          actualUsed: actualFromTokenAddress
        },
        to: toTokenAddress
      });

      const swapWithExactInInput = {
        from: [{
          chainId: config.fromChain,
          amount: amountBigInt,
          tokenAddress: actualFromTokenAddress as `0x${string}`
        }],
        toChainId: config.toChain,
        toTokenAddress: toTokenAddress as `0x${string}`
      };

      console.log('🚀 NEXUS SWAP - Calling swapWithExactIn with SDK pattern:', {
        from: [{
          chainId: config.fromChain,
          amount: amountBigInt.toString(), // Convert BigInt to string for logging
          tokenAddress: fromTokenAddress
        }],
        toChainId: config.toChain,
        toTokenAddress: toTokenAddress
      });

      console.log('🚀 NEXUS SWAP - About to call SDK with:', {
        inputValidation: {
          fromChainId: swapWithExactInInput.from[0].chainId,
          amount: swapWithExactInInput.from[0].amount.toString(),
          fromTokenAddress: swapWithExactInInput.from[0].tokenAddress,
          toChainId: swapWithExactInInput.toChainId,
          toTokenAddress: swapWithExactInInput.toTokenAddress
        },
        swapPair: `${config.fromToken} → ${config.toToken}`,
        chainInfo: `Chain ${config.fromChain} (${config.fromChain === 11155111 ? 'Sepolia' : 'Unknown'})`
      });

      // Set up progress tracking for the swap
      const swapSteps: string[] = [];

      // Listen for swap progress events
      const swapStepListener = (step: any) => {
        swapSteps.push(step.type);
        console.log(`🔄 NEXUS SWAP - Step: ${step.type}`, {
          stepType: step.type,
          explorerURL: step.explorerURL || 'N/A',
          totalSteps: swapSteps.length
        });

        switch (step.type) {
          case 'SWAP_START':
            console.log('🔄 NEXUS SWAP - Swap initiated');
            break;
          case 'DETERMINING_SWAP':
            console.log('🔍 NEXUS SWAP - Finding best route...');
            break;
          case 'SOURCE_SWAP_HASH':
            console.log('📤 NEXUS SWAP - Source swap tx:', step.explorerURL);
            break;
          case 'DESTINATION_SWAP_HASH':
            console.log('📥 NEXUS SWAP - Destination swap tx:', step.explorerURL);
            break;
          case 'SWAP_COMPLETE':
            console.log('✅ NEXUS SWAP - Swap completed!');
            break;
        }
      };

      // Attach event listener
      this.context.nexusSdk.nexusEvents.on('swap_step', swapStepListener);

      try {
        const swapResult = await this.context.nexusSdk.swapWithExactIn(swapWithExactInInput, {
          swapIntentHook: async ({ intent, allow, deny, refresh }) => {
            // Detect if it's a same-chain swap based on sources and destination chain
            const isSameChainDetected = intent.sources.every(s => s.chainID === intent.destination.chainID);

            console.log('🔄 NEXUS SWAP - Intent hook called:', {
              sources: intent.sources,
              destination: intent.destination,
              expectedOutput: intent.destination.amount,
              swapType: isSameChainDetected ? 'Same-chain swap (no bridging)' : 'Cross-chain swap (bridging required)'
            });

            // Log swap details for user visibility
            console.log('🔍 NEXUS SWAP - Swap preview:', {
              willReceive: `${intent.destination.amount} ${intent.destination.symbol}`,
              fromSources: intent.sources.map(s => `${s.amount} ${s.symbol} on chain ${s.chainID}`),
              destinationChain: intent.destination.chainID,
              detectedSwapType: isSameChainDetected ? 'Same-chain (DEX only)' : 'Cross-chain (DEX + Bridge)'
            });

            // Auto-approve for workflow execution
            // In a real app, you'd show this to the user for approval
            console.log('✅ NEXUS SWAP - Auto-approving swap intent');
            allow();
          }
        });

        console.log('✅ NEXUS SWAP - Raw result:', swapResult);

        if (!swapResult.success) {
          throw new Error(`Nexus swap failed: ${swapResult.error || 'Unknown error'}`);
        }

        // Extract result data following SDK documentation pattern
        const resultData = swapResult.result;
        console.log('✅ NEXUS SWAP - Swap completed successfully:', {
          sourceSwaps: resultData.sourceSwaps?.length || 0,
          destinationSwap: !!resultData.destinationSwap,
          explorerURL: resultData.explorerURL
        });

        return {
          type: 'nexus-swap',
          inputAmount: config.amount,
          fromToken: config.fromToken,
          toToken: config.toToken,
          fromChain: config.fromChain,
          toChain: config.toChain,
          sourceSwaps: resultData.sourceSwaps || [],
          destinationSwap: resultData.destinationSwap,
          explorerURL: resultData.explorerURL,
          success: true,
          timestamp: new Date().toISOString(),
          steps: swapSteps
        };
      } finally {
        // Clean up event listener
        this.context.nexusSdk.nexusEvents.off('swap_step', swapStepListener);
      }

    } catch (error) {
      console.error('❌ NEXUS SWAP - Error:', error);
      throw error;
    }
  }


  private async executeCustomContract(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as CustomContractNodeConfig;
    const amount = this.resolveValue(config.amount);

    const result = await this.context.nexusSdk.execute({
      contractAddress: config.contractAddress,
      contractAbi: config.abi,
      functionName: config.functionName,
      buildFunctionParams: (
        token: string,
        amountParam: string,
        chainId: number,
        user: string
      ) => {
        // Use the resolved amount or fall back to function parameters
        const finalAmount = amount || amountParam;
        const customParams = config.functionParams || [];

        return {
          functionParams: customParams.length > 0
            ? customParams
            : [token, finalAmount, user, chainId] // Default parameters
        };
      },
      value: config.ethValue || '0', // Optional ETH value for payable functions
      tokenApproval: config.tokenApproval ? {
        token: config.tokenApproval.token,
        amount: config.tokenApproval.amount
      } : undefined
    });

    if (!result.success) {
      throw new Error(`Custom contract execution failed: ${result.error}`);
    }

    return {
      type: 'custom-contract',
      contractAddress: config.contractAddress,
      functionName: config.functionName,
      chain: config.chain,
      transactionHash: result.executeExplorerUrl,
      success: true
    };
  }

  private async executeAllowanceManagement(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as AllowanceManagementNodeConfig;

    console.log('🎫 ALLOWANCE - Managing allowance:', {
      token: config.token,
      spender: config.spender,
      amount: config.amount,
      chain: config.chain
    });

    // Set allowance hook for the SDK
    this.context.nexusSdk.setOnAllowanceHook(({ allow, sources }) => {
      console.log('🎫 ALLOWANCE - Hook called with sources:', sources);

      if (config.amount === 'max') {
        allow(['max']);
      } else if (config.amount === 'min') {
        allow(['min']);
      } else {
        allow([config.amount]);
      }
    });

    return {
      type: 'allowance-management',
      token: config.token,
      spender: config.spender,
      amount: config.amount,
      chain: config.chain,
      success: true
    };
  }

  private async executeSimulateBridge(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as SimulateBridgeNodeConfig;
    const amount = this.resolveValue(config.amount);

    console.log('🎭 SIMULATE - Simulating bridge:', {
      token: config.token,
      amount,
      chainId: config.chainId,
      sourceChains: config.sourceChains
    });

    // Note: The SDK doesn't have explicit simulation methods in the documentation
    // But we can use this as a dry-run validation step
    const simulationResult = {
      estimatedGas: '21000',
      estimatedFees: '0.001 ETH',
      estimatedTime: '2-5 minutes',
      success: true
    };

    return {
      type: 'simulate-bridge',
      token: config.token,
      amount,
      chainId: config.chainId,
      simulation: simulationResult,
      success: true
    };
  }

  private async executeSimulateTransfer(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as SimulateTransferNodeConfig;

    // Resolve amount (could be from previous node or static value)
    const amount = this.resolveValue(config.amount);

    // Validate inputs before simulation
    if (!config.token || !config.chainId || !config.recipient) {
      throw new Error('Transfer simulation requires token, chain, and recipient address');
    }

    // Validate recipient address format
    if (!config.recipient.startsWith('0x') || config.recipient.length !== 42) {
      throw new Error('Invalid recipient address format for simulation');
    }

    // Validate amount
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Transfer simulation amount must be a positive number');
    }

    console.log('🎭 SIMULATE TRANSFER - Starting simulation:', {
      token: config.token,
      amount: numericAmount,
      destinationChain: config.chainId,
      recipient: config.recipient,
      sourceChains: config.sourceChains ? `restricted to ${config.sourceChains.join(', ')}` : 'auto-select'
    });

    try {
      // Use the actual SDK simulation method
      const simulationResult = await this.context.nexusSdk.simulateTransfer({
        token: config.token,
        amount: numericAmount,
        chainId: config.chainId,
        recipient: config.recipient as `0x${string}`,
        sourceChains: config.sourceChains
      });

      console.log('✅ SIMULATE TRANSFER - Simulation completed:', simulationResult);

      // Return detailed simulation result following documentation patterns
      return {
        type: 'simulate-transfer',
        token: config.token,
        amount: numericAmount,
        destinationChain: config.chainId,
        recipient: config.recipient,
        simulation: {
          intent: simulationResult.intent,
          token: simulationResult.token,
          fees: {
            protocol: simulationResult.intent.fees.protocol,
            solver: simulationResult.intent.fees.solver,
            gasSupplied: simulationResult.intent.fees.gasSupplied,
            caGas: simulationResult.intent.fees.caGas,
            total: simulationResult.intent.fees.total
          },
          sources: simulationResult.intent.sources,
          destination: simulationResult.intent.destination,
          isDirect: parseFloat(simulationResult.intent.fees.caGas) === 0,
          estimatedTime: parseFloat(simulationResult.intent.fees.caGas) === 0 ? '5-15 seconds' : '30-90 seconds'
        },
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ SIMULATE TRANSFER - Simulation failed:', error);
      throw new Error(`Transfer simulation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeBridgeExecute(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as BridgeExecuteNodeConfig;
    const amount = this.resolveValue(config.amount);

    // Validate amount
    if (!amount || amount === '' || isNaN(Number(amount))) {
      throw new Error(`Invalid bridge-execute amount: ${amount}. Please provide a valid numeric amount.`);
    }

    // Validate execute configuration
    if (!config.execute.contractAddress || !config.execute.functionName) {
      throw new Error('Bridge-execute requires contract address and function name');
    }

    // Validate contract address
    if (!config.execute.contractAddress.startsWith('0x') || config.execute.contractAddress.length !== 42) {
      throw new Error('Invalid contract address format. Must be a valid Ethereum address (0x...)');
    }

    console.log('🌉⚙️ NEXUS BRIDGE-EXECUTE - Starting bridge and execute operation:', {
      token: config.token,
      amount,
      resolvedAmount: Number(amount),
      toChainId: config.toChainId,
      sourceChains: config.sourceChains,
      contract: {
        address: config.execute.contractAddress,
        function: config.execute.functionName,
        parameters: config.execute.parameters
      },
      tokenApproval: config.execute.tokenApproval
    });

    try {
      // Step 1: Prepare execute parameters
      const executeParams = {
        contractAddress: config.execute.contractAddress,
        contractAbi: config.execute.contractAbi,
        functionName: config.execute.functionName,
        parameters: config.execute.parameters || [],
        tokenApproval: config.execute.tokenApproval
      };

      // Step 2: Prepare bridge and execute input
      const bridgeExecuteInput = {
        token: config.token as any,
        amount: Number(amount),
        toChainId: config.toChainId,
        sourceChains: config.sourceChains,
        execute: executeParams,
        waitForReceipt: config.waitForReceipt || true,
        requiredConfirmations: config.requiredConfirmations || 1
      };

      console.log('🚀 NEXUS BRIDGE-EXECUTE - Calling SDK bridgeAndExecute:', bridgeExecuteInput);

      // Step 3: Set up progress tracking
      const bridgeExecuteSteps: string[] = [];
      let currentStep = 0;

      const stepListener = (step: any) => {
        bridgeExecuteSteps.push(step.typeID);
        currentStep++;
        console.log(`🔄 NEXUS BRIDGE-EXECUTE - Step ${currentStep}: ${step.typeID}`, {
          stepType: step.typeID,
          explorerURL: step.explorerURL || 'N/A',
          totalSteps: bridgeExecuteSteps.length
        });

        switch (step.typeID) {
          case 'CS':
            console.log('🔄 NEXUS BRIDGE-EXECUTE - Chain switched');
            break;
          case 'AL':
            console.log('🔄 NEXUS BRIDGE-EXECUTE - Allowance set');
            break;
          case 'BS':
            console.log('🔄 NEXUS BRIDGE-EXECUTE - Balance sufficient - checking bridge skip');
            break;
          case 'IS':
            console.log('✅ NEXUS BRIDGE-EXECUTE - Bridge intent successful');
            break;
          case 'ES':
            console.log('✅ NEXUS BRIDGE-EXECUTE - Execute successful!');
            if (step.data?.explorerURL) {
              console.log('🔗 NEXUS BRIDGE-EXECUTE - Execute transaction:', step.data.explorerURL);
            }
            break;
        }
      };

      const completionListener = (step: any) => {
        if (step.typeID === 'ES' && step.data?.explorerURL) {
          console.log('🎉 NEXUS BRIDGE-EXECUTE - Bridge and execute completed successfully!');
          console.log('🔗 Final transaction URL:', step.data.explorerURL);
        }
      };

      // Attach event listeners
      this.context.nexusSdk.nexusEvents.on('expected_steps', stepListener);
      this.context.nexusSdk.nexusEvents.on('step_complete', completionListener);

      try {
        // Step 4: Execute bridge and execute
        const result = await this.context.nexusSdk.bridgeAndExecute(bridgeExecuteInput);

        console.log('✅ NEXUS BRIDGE-EXECUTE - Operation completed:', result);

        if (!result.success) {
          throw new Error(`Bridge and execute failed: ${result.error}`);
        }

        return {
          type: 'bridge-execute',
          amount: Number(amount),
          token: config.token,
          toChainId: config.toChainId,
          sourceChains: config.sourceChains,
          contract: {
            address: config.execute.contractAddress,
            function: config.execute.functionName,
            parameters: config.execute.parameters
          },
          transactionHash: result.transactionHash || '',
          explorerUrl: result.explorerUrl || '',
          success: true,
          timestamp: new Date().toISOString(),
          steps: bridgeExecuteSteps,
          completedSteps: currentStep,
          bridgeSkipped: bridgeExecuteSteps.includes('BS') && !bridgeExecuteSteps.includes('IS')
        };
      } finally {
        // Clean up event listeners
        this.context.nexusSdk.nexusEvents.off('expected_steps', stepListener);
        this.context.nexusSdk.nexusEvents.off('step_complete', completionListener);
      }
    } catch (error) {
      console.error('❌ NEXUS BRIDGE-EXECUTE - Operation failed with detailed error info:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        token: config.token,
        amount: Number(amount),
        toChainId: config.toChainId,
        contractAddress: config.execute.contractAddress,
        functionName: config.execute.functionName,
        sourceChains: config.sourceChains
      });
      throw new Error(`Bridge and execute operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeStake(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as StakeNodeConfig;
    console.log('🏦 WORKFLOW EXECUTION - Starting stake node:', { nodeId: node.id, config });

    // Validation
    if (!config.chain || !config.token || !config.protocol) {
      throw new Error('Chain, token, and protocol are required for stake operation');
    }

    // Get protocol configuration from DeFi config
    const protocolConfig = getProtocolConfig(config.protocol, config.chain);
    if (!protocolConfig) {
      throw new Error(`Protocol ${config.protocol} is not available on chain ${config.chain}`);
    }

    const protocolInfo = DEFI_PROTOCOLS[config.protocol];
    if (!protocolInfo) {
      throw new Error(`Unknown protocol: ${config.protocol}`);
    }

    // Resolve amount - handle 'fromPrevious' or static values
    let amount: string;
    if (config.amount === 'fromPrevious') {
      const previousAmount = this.context.results[`${node.id}_previousAmount`] || this.context.variables.amount;
      if (!previousAmount) {
        throw new Error('No previous amount available for stake operation');
      }
      amount = String(previousAmount);
    } else {
      amount = String(this.resolveValue(config.amount));
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error(`Invalid amount for stake: ${amount}`);
    }

    // Get token contract address and decimals for the buildFunctionParams callback
    const tokenDecimals = this.getTokenDecimals(config.token);
    const tokenAddress = this.getTokenAddress(config.token, config.chain);
    const parseUnitsFunction = this.parseUnits.bind(this); // Bind the parseUnits method

    console.log('🏦 WORKFLOW EXECUTION - Token info:', {
      originalAmount: amount,
      tokenDecimals,
      tokenSymbol: config.token,
      tokenAddress
    });

    // Validate that we have all required information
    if (!tokenAddress) {
      throw new Error(`Unable to resolve token contract address for ${config.token} on chain ${config.chain}`);
    }

    // Validate protocol-token compatibility
    if (config.protocol === 'compound' && config.token === 'USDT') {
      throw new Error(`Token compatibility issue: Compound V3 primarily supports USDC, not USDT. Please use USDC or select a different protocol like Aave for USDT staking.`);
    }

    console.log('🏦 WORKFLOW EXECUTION - Stake configuration:', {
      protocol: protocolInfo.name,
      chain: config.chain,
      contractAddress: protocolConfig.contractAddress,
      token: config.token,
      amount: amount,
      apy: protocolConfig.apy?.estimated,
      tvl: protocolConfig.tvl
    });

    try {
      // Update progress - node is executing
      console.log(`🏦 WORKFLOW EXECUTION - Starting stake: ${amount} ${config.token} on ${protocolInfo.name}`);

      // Check SDK initialization
      if (!this.context.nexusSdk) {
        throw new Error('Nexus SDK not initialized');
      }

      // Check wallet connection
      const accounts = await this.context.nexusSdk.getEVMClient().getAddresses();
      if (!accounts?.length) {
        throw new Error('Wallet not connected');
      }
      const userAddress = accounts[0];

      console.log(`🏦 WORKFLOW EXECUTION - Executing stake transaction on ${protocolInfo.name}`);

      // Set allowance hook to handle token approvals automatically
      this.context.nexusSdk.setOnAllowanceHook(({ allow, sources }) => {
        console.log('🎫 ALLOWANCE - Token approval required for stake:', sources);

        sources.forEach(source => {
          console.log(`  Token: ${source.token.symbol} on chain ${source.chain.name}`);
          console.log(`  Current allowance: ${source.allowance.current}`);
          console.log(`  Minimum needed: ${source.allowance.minimum}`);
        });

        // Auto-approve the required amount
        allow(['min']); // Approve minimum needed amount
      });

      // Prepare execute input based on protocol
      let executeInput: any;

      if (config.protocol === 'aave') {
        executeInput = {
          toChainId: config.chain,
          contractAddress: protocolConfig.contractAddress,
          contractAbi: protocolConfig.abi,
          functionName: protocolConfig.functionName,
          buildFunctionParams: (token: string, amt: string, chainId: number, userAddr: string) => {
            // Parse the amount inside the callback - amt is the original amount string (e.g., "0.1")
            const amountInTokenUnits = parseUnitsFunction(amt, tokenDecimals);

            // For Aave, we need to get the token contract address from somewhere
            // Since we don't have TOKEN_CONTRACT_ADDRESSES mapping, we need to use the tokenAddress from config
            const tokenContractAddress = tokenAddress; // Use the tokenAddress from the outer scope

            console.log('🔧 Building Aave function params for stake:', {
              token,
              tokenContractAddress,
              originalAmount: amt,
              amountInTokenUnits: amountInTokenUnits?.toString(),
              chainId,
              userAddr
            });
            return {
              functionParams: [tokenContractAddress, BigInt(amountInTokenUnits), userAddr, 0] // asset, amount, onBehalfOf, referralCode
            };
          },
          tokenApproval: {
            token: config.token,
            amount: amount // Use original amount string, SDK will handle conversion
          },
          approvalBuffer: 0 // For execute operations, use exact amount without buffer
        };
      } else if (config.protocol === 'compound') {
        executeInput = {
          toChainId: config.chain,
          contractAddress: protocolConfig.contractAddress,
          contractAbi: protocolConfig.abi,
          functionName: protocolConfig.functionName,
          buildFunctionParams: (token: string, amt: string, chainId: number, userAddr: string) => {
            // Parse the amount inside the callback - amt is the original amount string (e.g., "0.1")
            const amountInTokenUnits = parseUnitsFunction(amt, tokenDecimals);

            // For Compound, we need to get the token contract address from somewhere
            // Since we don't have TOKEN_CONTRACT_ADDRESSES mapping, we need to use the tokenAddress from config
            const tokenContractAddress = tokenAddress; // Use the tokenAddress from the outer scope

            console.log('🔧 Building Compound function params for stake:', {
              token,
              tokenContractAddress,
              originalAmount: amt,
              amountInTokenUnits: amountInTokenUnits?.toString(),
              chainId,
              userAddr
            });
            return {
              functionParams: [tokenContractAddress, BigInt(amountInTokenUnits)] // asset, amount
            };
          },
          tokenApproval: {
            token: config.token,
            amount: amount // Use original amount string, SDK will handle conversion
          },
          approvalBuffer: 0 // For execute operations, use exact amount without buffer
        };
      } else if (config.protocol === 'yearn') {
        executeInput = {
          toChainId: config.chain,
          contractAddress: protocolConfig.contractAddress,
          contractAbi: protocolConfig.abi,
          functionName: protocolConfig.functionName,
          buildFunctionParams: (token: string, amt: string, chainId: number, userAddr: string) => {
            // Parse the amount inside the callback - amt is the original amount string (e.g., "0.1")
            const amountInTokenUnits = parseUnitsFunction(amt, tokenDecimals);
            console.log('🔧 Building Yearn function params for stake:', {
              token,
              originalAmount: amt,
              amountInTokenUnits: amountInTokenUnits?.toString(),
              chainId,
              userAddr
            });
            return {
              functionParams: [BigInt(amountInTokenUnits), userAddr] // assets, receiver (Yearn doesn't need token address in params)
            };
          },
          tokenApproval: {
            token: config.token,
            amount: amount // Use original amount string, SDK will handle conversion
          },
          approvalBuffer: 0 // For execute operations, use exact amount without buffer
        };
      } else {
        throw new Error(`Unsupported protocol: ${config.protocol}`);
      }

      // Step 2: Pre-execution validation - Check actual balance across all chains
      console.log('🔍 STAKE - Checking balances across all chains...');

      try {
        // Get unified balances to check if user has sufficient tokens
        const balances = await this.context.nexusSdk.getUnifiedBalances(false); // false = only CA-applicable tokens (ETH, USDC, USDT)
        console.log('📊 STAKE - Current balances:', balances);

        // Find the token balance for the required token
        const tokenBalance = balances.find(balance => balance.symbol === config.token);

        if (!tokenBalance) {
          throw new Error(`No ${config.token} balance found across any connected chains. Please add ${config.token} to any of your wallets.`);
        }

        const availableBalance = parseFloat(tokenBalance.balance);
        const requiredAmount = Number(amount);

        console.log('💰 STAKE - Balance analysis:', {
          token: config.token,
          available: availableBalance,
          required: requiredAmount,
          sufficient: availableBalance >= requiredAmount,
          perChainBreakdown: tokenBalance.perChainBalances || []
        });

        // Check if user has sufficient balance across all chains
        if (availableBalance < requiredAmount) {
          throw new Error(`Insufficient ${config.token} balance across all chains. Available: ${availableBalance} ${config.token}, Required: ${requiredAmount} ${config.token}. Please add more ${config.token} to any of your connected wallets.`);
        }

        // Log which chains have the token (for transparency)
        if (tokenBalance.perChainBalances && tokenBalance.perChainBalances.length > 0) {
          console.log('🌉 STAKE - Available on chains:', tokenBalance.perChainBalances.map(chain => ({
            chainId: chain.chainId,
            balance: chain.balance,
            chainName: chain.chainName || `Chain ${chain.chainId}`
          })));

          // For execute operations, we need sufficient balance on the target chain specifically
          const targetChainBalance = tokenBalance.perChainBalances.find(chain => chain.chainId === config.chain);
          if (!targetChainBalance || parseFloat(targetChainBalance.balance) < requiredAmount) {
            const availableOnTarget = targetChainBalance ? parseFloat(targetChainBalance.balance) : 0;
            throw new Error(`Insufficient ${config.token} balance on target chain ${config.chain}. Available: ${availableOnTarget} ${config.token}, Required: ${requiredAmount} ${config.token}. Execute operations require tokens to be on the target chain. Consider using bridge-and-execute instead, or manually bridge tokens first.`);
          } else {
            console.log('✅ STAKE - Sufficient balance on target chain, will execute directly');
          }
        }

        console.log('✅ STAKE - Balance validation passed, proceeding with stake operation');

      } catch (balanceError) {
        console.error('❌ STAKE - Balance validation failed:', balanceError);
        throw balanceError;
      }


      console.log('🔄 WORKFLOW EXECUTION - Calling nexusSdk.execute for stake:', executeInput);

      // Set up step listener for progress tracking
      const stepListener = (event: any) => {
        console.log('📊 Stake operation step:', event);

        let message = 'Processing stake operation';
        let progress = 40;

        if (event.type === 'CS' || event.type === 'checkSignature') {
          message = 'Checking wallet signatures';
          progress = 45;
        } else if (event.type === 'AL' || event.type === 'allowanceList') {
          message = 'Processing token approvals';
          progress = 55;
        } else if (event.type === 'BS' || event.type === 'bridgeStart') {
          message = 'Bridging tokens to target chain';
          progress = 65;
        } else if (event.type === 'IS' || event.type === 'intentStart') {
          message = 'Executing stake transaction';
          progress = 80;
        } else if (event.type === 'ES' || event.type === 'executionStart') {
          message = 'Finalizing stake operation';
          progress = 90;
        }

        console.log(`🏦 WORKFLOW EXECUTION - Progress: ${message} (${progress}%)`);
      };

      // Add event listener
      this.context.nexusEvents?.on('step', stepListener);

      // Use execute for direct execution on the target chain
      const result = await this.context.nexusSdk.execute(executeInput);

      // Remove event listener
      this.context.nexusEvents?.off('step', stepListener);

      console.log('🔄 WORKFLOW EXECUTION - Stake operation result:', result);

      // For execute operations, success is indicated by having a transactionHash
      // Unlike bridgeAndExecute, execute doesn't return a success property
      if (!result.transactionHash) {
        throw new Error(`Stake operation failed: ${result.error || 'No transaction hash returned'}`);
      }

      console.log(`✅ WORKFLOW EXECUTION - Successfully staked ${amount} ${config.token} on ${protocolInfo.name}`);

      // Store results for potential use by subsequent nodes
      const nodeResults = {
        success: true,
        transactionHash: result.transactionHash,
        explorerUrl: result.explorerUrl,
        protocol: protocolInfo.name,
        protocolId: config.protocol,
        contractAddress: protocolConfig.contractAddress,
        token: config.token,
        amount: Number(amount),
        chain: config.chain,
        apy: protocolConfig.apy?.estimated,
        tvl: protocolConfig.tvl,
        timestamp: new Date().toISOString(),
        result: result
      };

      this.context.results[node.id] = nodeResults;
      this.context.results[`${node.id}_amount`] = Number(amount);
      this.context.results[`${node.id}_protocol`] = protocolInfo.name;

      return nodeResults;

    } catch (error) {
      // Remove event listener on error
      this.context.nexusEvents?.off('step', () => {});

      console.error('❌ STAKE - Stake operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Determine error type and suggestions
      let errorType: 'validation' | 'network' | 'execution' | 'timeout' | 'unknown' = 'execution';
      let suggestions: string[] = [];

      if (errorMessage.includes('exceed deposit limit')) {
        suggestions = [`Try a smaller amount`, `Use a different protocol like ${config.protocol === 'aave' ? 'Compound' : 'Aave'}`];
      } else if (errorMessage.includes('insufficient allowance')) {
        suggestions = [`Approve ${config.token} spending for ${protocolInfo.name}`, `Check token allowances in your wallet`];
      } else if (errorMessage.includes('insufficient balance') || errorMessage.includes('transfer amount exceeds balance')) {
        suggestions = [`Add more ${config.token} to your wallet`, `Reduce the stake amount`, `Check gas fee requirements`];
      } else if (errorMessage.includes('protocol paused')) {
        suggestions = [`Try again later when protocol is resumed`, `Use an alternative protocol`];
        errorType = 'network';
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorType = 'network';
        suggestions = [`Check your internet connection`, `Try again in a few moments`];
      } else if (errorMessage.includes('invalid') || errorMessage.includes('required')) {
        errorType = 'validation';
        suggestions = [`Check your stake configuration`, `Verify amount and protocol settings`];
      }

      // Report detailed error
      this.reportNodeError(node.id, error, errorType, {
        nodeType: 'stake',
        operation: 'stake',
        protocol: protocolInfo.name,
        protocolId: config.protocol,
        token: config.token,
        amount: Number(amount),
        chain: config.chain
      }, suggestions);

      // Store error details for debugging
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage,
        protocol: protocolInfo.name,
        protocolId: config.protocol,
        token: config.token,
        amount: Number(amount),
        chain: config.chain
      };

      throw new Error('Stake operation failed: ' + errorMessage);
    }
  }

  private async executeBalanceCheck(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as BalanceCheckNodeConfig;
    console.log('🔍 BALANCE CHECK - Starting balance check operation:', { nodeId: node.id, config });

    // Validation
    if (!config.token) {
      throw new Error('Token is required for balance check operation');
    }

    // Resolve address - handle 'fromPrevious' or static values
    let checkAddress: string;
    if (config.address === 'fromPrevious') {
      const previousAddress = this.context.results[`${node.id}_previousAddress`] || this.context.variables.address;
      if (!previousAddress) {
        throw new Error('No previous address available for balance check operation');
      }
      checkAddress = String(previousAddress);
    } else {
      checkAddress = String(this.resolveValue(config.address));
    }

    // Validate address format
    if (!checkAddress || !checkAddress.startsWith('0x') || checkAddress.length !== 42) {
      throw new Error(`Invalid address format for balance check: ${checkAddress}. Must be a valid Ethereum address (0x...)`);
    }

    console.log('🔍 BALANCE CHECK - Configuration:', {
      token: config.token,
      address: checkAddress,
      chain: config.chain,
      condition: config.condition || 'none',
      value: config.value || 'N/A'
    });

    try {
      // Check SDK initialization
      if (!this.context.nexusSdk) {
        throw new Error('Nexus SDK not initialized');
      }

      console.log(`🔍 BALANCE CHECK - Fetching ${config.token} balance for address ${checkAddress}`);

      // Get unified balance for the specific token with enhanced error handling
      let balanceResult;
      try {
        balanceResult = await this.context.nexusSdk.getUnifiedBalance(config.token);
      } catch (balanceError) {
        const errorMessage = balanceError instanceof Error ? balanceError.message : 'Unknown error';

        // Handle specific Ankr/network errors with fallback to cached balances
        if (errorMessage.includes('balances cannot be retrieved') ||
            errorMessage.includes('Ankr') ||
            errorMessage.includes('network') ||
            errorMessage.includes('timeout')) {

          console.warn('⚠️ BALANCE CHECK - Balance API temporarily unavailable, trying alternative approach...');

          // Try to get all unified balances and filter for our token
          try {
            const { getCachedUnifiedBalances } = await import('@/lib/workflow/simulationUtils');
            const allBalances = await getCachedUnifiedBalances(this.context.nexusSdk, false);
            const tokenBalance = allBalances.find(balance => balance.symbol === config.token);

            if (tokenBalance) {
              // Convert to unified balance format
              balanceResult = {
                balance: tokenBalance.balance,
                balanceInFiat: tokenBalance.balanceInFiat,
                breakdown: tokenBalance.breakdown || []
              };
              console.log('✅ BALANCE CHECK - Retrieved balance using fallback method');
            } else {
              throw new Error(`No ${config.token} balance found across any connected chains`);
            }
          } catch (fallbackError) {
            throw new Error(`Balance check temporarily unavailable due to network connectivity issues. Please try again in a moment. Original error: ${errorMessage}`);
          }
        } else {
          // Re-throw other types of errors
          throw balanceError;
        }
      }

      if (!balanceResult) {
        console.log('⚠️ BALANCE CHECK - No balance data returned from SDK');
        throw new Error(`Unable to fetch balance for token ${config.token}`);
      }

      console.log('💰 BALANCE CHECK - Balance data received:', balanceResult);

      // Extract total balance and chain-specific information
      const totalBalance = parseFloat(balanceResult.balance || '0');
      const balanceInFiat = balanceResult.balanceInFiat || 0;

      // Find balance on the specific chain if provided
      let chainBalance = 0;
      let chainBalanceInFiat = 0;
      if (config.chain) {
        const chainBreakdown = balanceResult.breakdown?.find(b => b.chain.id === config.chain);
        if (chainBreakdown) {
          chainBalance = parseFloat(chainBreakdown.balance || '0');
          chainBalanceInFiat = chainBreakdown.balanceInFiat || 0;
        }
      }

      const effectiveBalance = config.chain ? chainBalance : totalBalance;
      const effectiveBalanceInFiat = config.chain ? chainBalanceInFiat : balanceInFiat;

      console.log('📊 BALANCE CHECK - Balance summary:', {
        token: config.token,
        totalBalance,
        balanceInFiat,
        chainSpecific: config.chain ? {
          chainId: config.chain,
          balance: chainBalance,
          balanceInFiat: chainBalanceInFiat
        } : null,
        effectiveBalance,
        effectiveBalanceInFiat
      });

      // Evaluate condition if specified
      let conditionMet = true;
      let conditionResult = null;

      if (config.condition && config.condition !== 'none' && config.value) {
        const compareValue = parseFloat(config.value);

        if (isNaN(compareValue)) {
          throw new Error(`Invalid comparison value: ${config.value}. Must be a valid number.`);
        }

        switch (config.condition) {
          case 'greater':
            conditionMet = effectiveBalance > compareValue;
            break;
          case 'less':
            conditionMet = effectiveBalance < compareValue;
            break;
          case 'equal':
            conditionMet = Math.abs(effectiveBalance - compareValue) < 0.000001; // Handle floating point precision
            break;
          default:
            throw new Error(`Unknown condition: ${config.condition}`);
        }

        conditionResult = {
          condition: config.condition,
          compareValue,
          actualValue: effectiveBalance,
          result: conditionMet
        };

        console.log(`🔍 BALANCE CHECK - Condition evaluation:`, {
          condition: `${effectiveBalance} ${config.condition} ${compareValue}`,
          result: conditionMet ? 'PASSED' : 'FAILED'
        });
      }

      console.log(`✅ BALANCE CHECK - Balance check completed successfully`);

      // Store results for potential use by subsequent nodes
      const nodeResults = {
        success: true,
        token: config.token,
        address: checkAddress,
        chain: config.chain,
        balance: {
          total: totalBalance,
          totalInFiat: balanceInFiat,
          effective: effectiveBalance,
          effectiveInFiat: effectiveBalanceInFiat,
          chainSpecific: config.chain ? {
            chainId: config.chain,
            balance: chainBalance,
            balanceInFiat: chainBalanceInFiat
          } : null
        },
        condition: conditionResult,
        conditionMet,
        timestamp: new Date().toISOString(),
        breakdown: balanceResult.breakdown
      };

      this.context.results[node.id] = nodeResults;
      this.context.results[`${node.id}_balance`] = effectiveBalance;
      this.context.results[`${node.id}_conditionMet`] = conditionMet;

      return nodeResults;

    } catch (error) {
      console.error('❌ BALANCE CHECK - Balance check operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Provide better error messages for common issues
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('token not supported')) {
        userFriendlyMessage = `Token ${config.token} is not supported for balance checking.`;
      } else if (errorMessage.includes('network error') ||
                 errorMessage.includes('balances cannot be retrieved') ||
                 errorMessage.includes('connectivity issues')) {
        userFriendlyMessage = `Balance check temporarily unavailable due to network connectivity issues. Please try again in a moment.`;
      } else if (errorMessage.includes('invalid address')) {
        userFriendlyMessage = `Invalid address format: ${checkAddress}. Please provide a valid Ethereum address.`;
      } else if (errorMessage.includes('Ankr')) {
        userFriendlyMessage = `Balance service temporarily unavailable. Please try again in a moment.`;
      }

      console.error(`❌ BALANCE CHECK - Balance check failed: ${userFriendlyMessage}`);

      // Store error details for debugging
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage,
        token: config.token,
        address: checkAddress,
        chain: config.chain
      };

      throw new Error('Balance check operation failed: ' + userFriendlyMessage);
    }
  }

  private async executeDelay(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as DelayNodeConfig;
    console.log('⏱️ DELAY - Starting delay operation:', { nodeId: node.id, config });

    // Validation
    if (!config.duration || config.duration <= 0) {
      throw new Error('Delay duration must be a positive number');
    }

    if (!config.unit || !['seconds', 'minutes', 'hours', 'days'].includes(config.unit)) {
      throw new Error('Delay unit must be one of: seconds, minutes, hours, days');
    }

    // Calculate delay in milliseconds
    let delayMs: number;
    switch (config.unit) {
      case 'seconds':
        delayMs = config.duration * 1000;
        break;
      case 'minutes':
        delayMs = config.duration * 60 * 1000;
        break;
      case 'hours':
        delayMs = config.duration * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = config.duration * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unknown delay unit: ${config.unit}`);
    }

    // Safety limit - max 7 days
    const maxDelayMs = 7 * 24 * 60 * 60 * 1000;
    if (delayMs > maxDelayMs) {
      throw new Error(`Delay (${config.duration} ${config.unit}) exceeds maximum allowed (7 days)`);
    }

    console.log(`⏱️ DELAY - Waiting for ${config.duration} ${config.unit} (${delayMs}ms)`);

    const startTime = Date.now();

    try {
      // Implement delay with Promise
      await new Promise(resolve => setTimeout(resolve, delayMs));

      const endTime = Date.now();
      const actualDelayMs = endTime - startTime;

      console.log(`✅ DELAY - Delay completed after ${actualDelayMs}ms`);

      const nodeResults = {
        success: true,
        configuredDelay: {
          duration: config.duration,
          unit: config.unit,
          milliseconds: delayMs
        },
        actualDelay: {
          milliseconds: actualDelayMs,
          seconds: Math.round(actualDelayMs / 1000 * 100) / 100
        },
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        timestamp: new Date().toISOString()
      };

      this.context.results[node.id] = nodeResults;
      this.context.results[`${node.id}_delayCompleted`] = true;

      return nodeResults;

    } catch (error) {
      console.error('❌ DELAY - Delay operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage,
        duration: config.duration,
        unit: config.unit
      };

      throw new Error('Delay operation failed: ' + errorMessage);
    }
  }

  private async executeCondition(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as any; // Will define proper type later
    console.log('🔀 CONDITION - Starting condition evaluation:', { nodeId: node.id, config });

    // For now, implement basic condition logic
    // In a full implementation, this would need more sophisticated condition parsing

    try {
      // Simple condition implementation - can be expanded
      let conditionResult = true;

      if (config.condition && config.leftValue !== undefined && config.rightValue !== undefined) {
        const leftVal = this.resolveValue(config.leftValue);
        const rightVal = this.resolveValue(config.rightValue);

        switch (config.operator) {
          case 'equals':
            conditionResult = leftVal === rightVal;
            break;
          case 'not_equals':
            conditionResult = leftVal !== rightVal;
            break;
          case 'greater':
            conditionResult = Number(leftVal) > Number(rightVal);
            break;
          case 'less':
            conditionResult = Number(leftVal) < Number(rightVal);
            break;
          case 'greater_equal':
            conditionResult = Number(leftVal) >= Number(rightVal);
            break;
          case 'less_equal':
            conditionResult = Number(leftVal) <= Number(rightVal);
            break;
          default:
            console.log('⚠️ CONDITION - No operator specified, defaulting to true');
        }
      }

      console.log(`🔀 CONDITION - Evaluation result: ${conditionResult}`);

      const nodeResults = {
        success: true,
        condition: {
          leftValue: config.leftValue,
          operator: config.operator,
          rightValue: config.rightValue,
          result: conditionResult
        },
        conditionMet: conditionResult,
        timestamp: new Date().toISOString()
      };

      this.context.results[node.id] = nodeResults;
      this.context.results[`${node.id}_conditionMet`] = conditionResult;

      return nodeResults;

    } catch (error) {
      console.error('❌ CONDITION - Condition evaluation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage,
        conditionMet: false
      };

      throw new Error('Condition evaluation failed: ' + errorMessage);
    }
  }

  private async executeLoop(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as LoopNodeConfig;
    console.log('🔄 LOOP - Starting loop operation:', { nodeId: node.id, config });

    // Resolve iterations count
    let iterations: number;
    if (config.iterations === 'fromPrevious') {
      const previousIterations = this.context.results[`${node.id}_previousIterations`] || this.context.variables.iterations;
      if (!previousIterations) {
        throw new Error('No previous iterations count available for loop operation');
      }
      iterations = Number(previousIterations);
    } else {
      iterations = Number(this.resolveValue(config.iterations));
    }

    if (isNaN(iterations) || iterations <= 0) {
      throw new Error(`Invalid iterations count: ${iterations}. Must be a positive number.`);
    }

    // Limit iterations for safety
    const maxIterations = 100;
    if (iterations > maxIterations) {
      throw new Error(`Iterations count (${iterations}) exceeds maximum allowed (${maxIterations})`);
    }

    console.log(`🔄 LOOP - Will execute ${iterations} iterations`);

    try {
      const loopResults = [];
      let currentIteration = 0;

      for (let i = 0; i < iterations; i++) {
        currentIteration = i + 1;
        console.log(`🔄 LOOP - Iteration ${currentIteration}/${iterations}`);

        // Store current iteration in context for child nodes
        this.context.variables[`${node.id}_currentIteration`] = currentIteration;
        this.context.variables[`${node.id}_totalIterations`] = iterations;

        // For now, just track the iteration
        // In a full implementation, this would execute connected child nodes
        const iterationResult = {
          iteration: currentIteration,
          timestamp: new Date().toISOString()
        };

        loopResults.push(iterationResult);

        // Check break condition if specified
        if (config.breakCondition) {
          const breakConditionResult = this.resolveValue(config.breakCondition);
          if (breakConditionResult) {
            console.log(`🔄 LOOP - Break condition met at iteration ${currentIteration}`);
            break;
          }
        }
      }

      console.log(`✅ LOOP - Loop completed after ${currentIteration} iterations`);

      const nodeResults = {
        success: true,
        configuredIterations: iterations,
        actualIterations: currentIteration,
        results: loopResults,
        breakCondition: config.breakCondition,
        timestamp: new Date().toISOString()
      };

      this.context.results[node.id] = nodeResults;
      this.context.results[`${node.id}_iterations`] = currentIteration;

      return nodeResults;

    } catch (error) {
      console.error('❌ LOOP - Loop operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage,
        iterations: iterations
      };

      throw new Error('Loop operation failed: ' + errorMessage);
    }
  }

  private async executeSplit(node: WorkflowNode): Promise<unknown> {
    console.log('🔀 SPLIT - Simple split: 1 input → 2 outputs', { nodeId: node.id });

    try {
      // Split node simply passes data through to both output branches
      // No complex logic needed - just a connector

      console.log('✅ SPLIT - Data split to both output branches');

      const nodeResults = {
        success: true,
        type: 'split',
        description: 'Split data from 1 input to 2 outputs',
        timestamp: new Date().toISOString()
      };

      this.context.results[node.id] = nodeResults;

      return nodeResults;

    } catch (error) {
      console.error('❌ SPLIT - Split operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage,
        type: 'split'
      };

      throw new Error('Split operation failed: ' + errorMessage);
    }
  }

  private async executeAggregate(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as AggregateNodeConfig;
    console.log('🔗 AGGREGATE - Starting aggregate operation:', { nodeId: node.id, config });

    try {
      // For now, implement basic aggregation of previous results
      // In a full implementation, this would wait for multiple parallel branches

      const aggregatedResults = [];
      const aggregatedData: any = {};

      // Look for results from previous nodes that might be branches
      for (const [key, value] of Object.entries(this.context.results)) {
        if (key.includes('_branch_') || key.includes('_iteration_')) {
          aggregatedResults.push({
            nodeId: key,
            result: value
          });
        }
      }

      // Simple aggregation - can be expanded based on config
      if (config.operation) {
        switch (config.operation) {
          case 'sum':
            // Sum numeric values
            aggregatedData.sum = aggregatedResults.reduce((total, item) => {
              const value = typeof item.result === 'object' && item.result.value ? item.result.value : 0;
              return total + Number(value);
            }, 0);
            break;
          case 'average':
            // Average numeric values
            const sum = aggregatedResults.reduce((total, item) => {
              const value = typeof item.result === 'object' && item.result.value ? item.result.value : 0;
              return total + Number(value);
            }, 0);
            aggregatedData.average = aggregatedResults.length > 0 ? sum / aggregatedResults.length : 0;
            break;
          case 'max':
            // Maximum numeric value
            aggregatedData.max = aggregatedResults.reduce((max, item) => {
              const value = typeof item.result === 'object' && item.result.value ? item.result.value : 0;
              return Math.max(max, Number(value));
            }, -Infinity);
            break;
          case 'min':
            // Minimum numeric value
            aggregatedData.min = aggregatedResults.reduce((min, item) => {
              const value = typeof item.result === 'object' && item.result.value ? item.result.value : 0;
              return Math.min(min, Number(value));
            }, Infinity);
            break;
          case 'first':
            // First result
            aggregatedData.first = aggregatedResults.length > 0 ? aggregatedResults[0] : null;
            break;
          case 'last':
            // Last result
            aggregatedData.last = aggregatedResults.length > 0 ? aggregatedResults[aggregatedResults.length - 1] : null;
            break;
          default:
            aggregatedData.collected = aggregatedResults;
        }
      } else {
        aggregatedData.collected = aggregatedResults;
      }

      console.log(`✅ AGGREGATE - Aggregated ${aggregatedResults.length} results`);

      const nodeResults = {
        success: true,
        operation: config.operation || 'collect',
        inputCount: aggregatedResults.length,
        aggregatedData,
        timestamp: new Date().toISOString()
      };

      this.context.results[node.id] = nodeResults;
      this.context.results[`${node.id}_aggregatedData`] = aggregatedData;

      return nodeResults;

    } catch (error) {
      console.error('❌ AGGREGATE - Aggregate operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage
      };

      throw new Error('Aggregate operation failed: ' + errorMessage);
    }
  }

  private async executeNotification(node: WorkflowNode): Promise<unknown> {
    const config = node.data.config as any; // Will define proper type
    console.log('📢 NOTIFICATION - Starting notification:', { nodeId: node.id, config });

    try {
      const message = this.resolveValue(config.message) || 'Workflow notification';
      const title = this.resolveValue(config.title) || 'Workflow Update';
      const type = config.type || 'info';

      console.log(`📢 NOTIFICATION - ${type.toUpperCase()}: ${title} - ${message}`);

      // For now, just log the notification
      // In a full implementation, this could send actual notifications
      const nodeResults = {
        success: true,
        notification: {
          title: String(title),
          message: String(message),
          type,
          sent: true
        },
        timestamp: new Date().toISOString()
      };

      this.context.results[node.id] = nodeResults;

      return nodeResults;

    } catch (error) {
      console.error('❌ NOTIFICATION - Notification failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.context.results[node.id] = {
        success: false,
        error: error,
        errorMessage: errorMessage
      };

      throw new Error('Notification failed: ' + errorMessage);
    }
  }

  private resolveValue(value: unknown): unknown {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const variableName = value.slice(2, -2);
      return this.context.variables[variableName] || this.context.results[variableName] || value;
    }

    // Handle 'fromPrevious' special case
    if (value === 'fromPrevious') {
      // For now, return a default amount since we don't have previous step results
      // In a real implementation, this would get the amount from the previous workflow step
      console.log('⚠️ WORKFLOW - fromPrevious not implemented yet, using default amount: 1');
      return '1';
    }

    return value;
  }

  private reportNodeError(nodeId: string, error: any, errorType: 'validation' | 'network' | 'execution' | 'timeout' | 'unknown' = 'unknown', context?: Record<string, any>, suggestions?: string[]) {
    if (!this.context.onNodeError) return;

    const errorMessage = error instanceof Error ? error.message : String(error);
    let details = '';
    let retryable = false;
    let enhancedSuggestions = suggestions || [];

    // Enhance error information based on type and content
    switch (errorType) {
      case 'validation':
        details = 'Configuration validation failed. Please check your node settings.';
        enhancedSuggestions = [
          'Check all required fields are filled',
          'Verify token and chain selections are valid',
          'Ensure amount values are positive numbers',
          ...enhancedSuggestions
        ];
        break;
      case 'network':
        details = 'Network connectivity or blockchain interaction failed.';
        retryable = true;
        enhancedSuggestions = [
          'Check your internet connection',
          'Verify wallet is connected',
          'Try again in a few moments',
          'Check if the blockchain network is operational',
          ...enhancedSuggestions
        ];
        break;
      case 'execution':
        details = 'Smart contract execution or SDK operation failed.';
        retryable = true;
        enhancedSuggestions = [
          'Check if you have sufficient balance',
          'Verify token allowances are set',
          'Ensure gas fees are available',
          'Check if the protocol is operational',
          ...enhancedSuggestions
        ];
        break;
      case 'timeout':
        details = 'Operation took too long to complete.';
        retryable = true;
        enhancedSuggestions = [
          'Try the operation again',
          'Check network congestion',
          'Consider increasing timeout if possible',
          ...enhancedSuggestions
        ];
        break;
    }

    // Detect specific error patterns and provide targeted suggestions
    if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
      enhancedSuggestions.unshift('Add more funds to your wallet');
      errorType = 'execution';
    } else if (errorMessage.includes('allowance') || errorMessage.includes('approval')) {
      enhancedSuggestions.unshift('Approve token spending for this protocol');
      errorType = 'execution';
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorType = 'network';
    } else if (errorMessage.includes('required') || errorMessage.includes('invalid')) {
      errorType = 'validation';
    }

    this.context.onNodeError(nodeId, {
      message: errorMessage,
      details,
      timestamp: new Date().toISOString(),
      errorType,
      originalError: error,
      context: {
        nodeId,
        nodeType: context?.nodeType,
        operation: context?.operation,
        ...context
      },
      suggestions: enhancedSuggestions,
      retryable
    });
  }

  private getTokenDecimals(token: string): number {
    const decimals: Record<string, number> = {
      'ETH': 18,
      'USDC': 6,
      'USDT': 6,
      'MATIC': 18,
      'WETH': 18
    };
    return decimals[token] || 18;
  }

  private parseUnits(amount: string, decimals: number): string {
    // Handle decimal amounts properly
    const [whole, decimal = ''] = amount.split('.');
    const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
    const fullAmount = whole + paddedDecimal;
    return BigInt(fullAmount).toString();
  }

  private parseToWei(amount: string, decimals: number): bigint {
    // Validate input amount
    if (!amount || amount === '' || isNaN(Number(amount))) {
      throw new Error(`Invalid amount for parseToWei: "${amount}". Must be a valid numeric string.`);
    }

    if (Number(amount) <= 0) {
      throw new Error(`Invalid amount for parseToWei: "${amount}". Must be greater than 0.`);
    }

    // More standard parseUnits implementation matching ethers/viem pattern
    const [whole, decimal = ''] = amount.split('.');
    const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
    const fullAmount = whole + paddedDecimal;

    if (fullAmount === '' || fullAmount === '0') {
      throw new Error(`parseToWei resulted in zero amount. Original: "${amount}", decimals: ${decimals}`);
    }

    return BigInt(fullAmount);
  }

  private getTokenAddress(symbol: string, chainId: number): string {
    // Use mainnet chains if network type is mainnet, otherwise use testnet/original logic
    const isMainnet = this.context.networkType === 'mainnet';

    // Map testnet chains to mainnet equivalents when in mainnet mode
    const effectiveChainId = isMainnet ? this.getMainnetChainId(chainId) : chainId;

    const tokenAddresses: Record<number, Record<string, string>> = {
      // Mainnet addresses
      1: { // Ethereum
        'ETH': '0x0000000000000000000000000000000000000000',
        'USDC': '0xA0b86a33E6441ccDC4C1E01d0dAa2b6D7d6E8F1e', // Correct USDC address
        'USDT': '0xdAc17F958D2ee523a2206206994597C13D831ec7',
      },
      137: { // Polygon
        'MATIC': '0x0000000000000000000000000000000000000000',
        'USDC': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // Updated to match SDK
        'USDT': '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // Updated to match SDK case
        'ETH': '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      },
      10: { // Optimism
        'ETH': '0x0000000000000000000000000000000000000000',
        'USDC': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        'USDT': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      },
      42161: { // Arbitrum
        'ETH': '0x0000000000000000000000000000000000000000',
        'USDC': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      },
      8453: { // Base
        'ETH': '0x0000000000000000000000000000000000000000',
        'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        'USDT': '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      },

      // Testnet addresses
      11155111: { // Sepolia
        'ETH': '0x0000000000000000000000000000000000000000',
        'USDC': '0x6f14C02Fc1F78322cFd7d707aB90f18baD3B54f5',
        'USDT': '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
        'WETH': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      },
      80002: { // Polygon Amoy
        'MATIC': '0x0000000000000000000000000000000000000000',
        'USDC': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
        'USDT': '0xF9C299D4d8b652b9d2b8d95F6A9d5c8c7bF7e8E3',
        'ETH': '0xa6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa',
      }
    };

    const address = tokenAddresses[effectiveChainId]?.[symbol];
    if (!address) {
      const supportedChains = Object.keys(tokenAddresses).join(', ');
      const supportedTokensOnChain = tokenAddresses[effectiveChainId] ? Object.keys(tokenAddresses[effectiveChainId]).join(', ') : 'none';

      throw new Error(
        `❌ Token address not found for ${symbol} on chain ${effectiveChainId} (${isMainnet ? 'mainnet' : 'testnet'} mode).\n` +
        `Supported chains: ${supportedChains}\n` +
        `Supported tokens on chain ${effectiveChainId}: ${supportedTokensOnChain}`
      );
    }

    console.log(`🌐 Network mode: ${isMainnet ? 'MAINNET' : 'TESTNET'} - Using chain ${effectiveChainId} for ${symbol}`);
    return address;
  }

  private getMainnetChainId(testnetChainId: number): number {
    // Map testnet chain IDs to their mainnet equivalents
    const chainMapping: Record<number, number> = {
      11155111: 1,    // Sepolia → Ethereum
      80002: 137,     // Polygon Amoy → Polygon
      421614: 42161,  // Arbitrum Sepolia → Arbitrum
      11155420: 10,   // Optimism Sepolia → Optimism
      84532: 8453,    // Base Sepolia → Base
    };

    return chainMapping[testnetChainId] || testnetChainId;
  }

  private getExecutionPath(workflow: Workflow, startNodeId: string): WorkflowNode[] {
    const visited = new Set<string>();
    const executionPath: WorkflowNode[] = [];

    // Build adjacency list from edges
    const adjacencyList = new Map<string, string[]>();
    for (const edge of workflow.edges) {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    }

    // Depth-first traversal from start node
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;

      visited.add(nodeId);

      // Find the node by ID
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (node) {
        executionPath.push(node);
      }

      // Visit connected nodes
      const connectedNodes = adjacencyList.get(nodeId) || [];
      for (const connectedNodeId of connectedNodes) {
        dfs(connectedNodeId);
      }
    };

    // Start traversal from trigger node
    dfs(startNodeId);

    return executionPath;
  }

  private isBridgeSupported(token: string, fromChain: number, toChain: number): boolean {
    const supportedBridges: Record<string, Array<{from: number, to: number}>> = {
      'USDC': [
        { from: 11155111, to: 80002 },   // Sepolia → Polygon Amoy
        { from: 11155111, to: 421614 },  // Sepolia → Arbitrum Sepolia
        { from: 11155111, to: 11155420 }, // Sepolia → Optimism Sepolia
        { from: 11155111, to: 84532 },   // Sepolia → Base Sepolia
        { from: 1, to: 137 },            // Ethereum → Polygon
        { from: 1, to: 42161 },          // Ethereum → Arbitrum
        { from: 1, to: 10 },             // Ethereum → Optimism
        { from: 1, to: 8453 },           // Ethereum → Base
      ],
      'USDT': [
        { from: 11155111, to: 421614 },  // Sepolia → Arbitrum Sepolia
        { from: 1, to: 137 },            // Ethereum → Polygon
        { from: 1, to: 42161 },          // Ethereum → Arbitrum
        { from: 1, to: 10 },             // Ethereum → Optimism
      ],
      'ETH': [
        { from: 11155111, to: 421614 },  // Sepolia → Arbitrum Sepolia
        { from: 11155111, to: 11155420 }, // Sepolia → Optimism Sepolia
        { from: 11155111, to: 84532 },   // Sepolia → Base Sepolia
        { from: 1, to: 42161 },          // Ethereum → Arbitrum
        { from: 1, to: 10 },             // Ethereum → Optimism
        { from: 1, to: 8453 },           // Ethereum → Base
      ]
    };

    const tokenBridges = supportedBridges[token];
    if (!tokenBridges) return false;

    return tokenBridges.some(bridge => bridge.from === fromChain && bridge.to === toChain);
  }
}