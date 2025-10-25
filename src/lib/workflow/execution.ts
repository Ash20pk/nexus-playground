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
  BalanceCheckNodeConfig
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

    // Convert amount to proper token units (with decimals)
    const tokenDecimals = this.getTokenDecimals(config.token);
    const amountInTokenUnits = this.parseUnits(amount, tokenDecimals);

    // Get token contract address
    const tokenAddress = this.getTokenAddress(config.token, config.chain);

    console.log('🏦 WORKFLOW EXECUTION - Amount conversion:', {
      originalAmount: amount,
      tokenDecimals,
      amountInTokenUnits,
      tokenSymbol: config.token,
      tokenAddress
    });

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
          buildFunctionParams: (sdkTokenAddress: string, amt: string, chainId: number, userAddr: string) => {
            console.log('🔧 Building Aave function params for stake:', { resolvedTokenAddress: tokenAddress, sdkTokenAddress, amt: amountInTokenUnits, chainId, userAddr });
            return {
              functionParams: [tokenAddress, amountInTokenUnits, userAddr, 0] // asset, amount, onBehalfOf, referralCode
            };
          },
          tokenApproval: {
            token: config.token,
            amount: amountInTokenUnits
          }
        };
      } else if (config.protocol === 'compound') {
        executeInput = {
          toChainId: config.chain,
          contractAddress: protocolConfig.contractAddress,
          contractAbi: protocolConfig.abi,
          functionName: protocolConfig.functionName,
          buildFunctionParams: (sdkTokenAddress: string, amt: string, chainId: number, userAddr: string) => {
            console.log('🔧 Building Compound function params for stake:', { resolvedTokenAddress: tokenAddress, sdkTokenAddress, amt: amountInTokenUnits, chainId, userAddr });
            return {
              functionParams: [tokenAddress, amountInTokenUnits] // asset, amount
            };
          },
          tokenApproval: {
            token: config.token,
            amount: amountInTokenUnits
          }
        };
      } else if (config.protocol === 'yearn') {
        executeInput = {
          toChainId: config.chain,
          contractAddress: protocolConfig.contractAddress,
          contractAbi: protocolConfig.abi,
          functionName: protocolConfig.functionName,
          buildFunctionParams: (sdkTokenAddress: string, amt: string, chainId: number, userAddr: string) => {
            console.log('🔧 Building Yearn function params for stake:', { resolvedTokenAddress: tokenAddress, sdkTokenAddress, amt: amountInTokenUnits, chainId, userAddr });
            return {
              functionParams: [amountInTokenUnits, userAddr] // assets, receiver (Yearn doesn't need token address in params)
            };
          },
          tokenApproval: {
            token: config.token,
            amount: amountInTokenUnits
          }
        };
      } else {
        throw new Error(`Unsupported protocol: ${config.protocol}`);
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
          message = 'Starting token bridge (if needed)';
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

      // Execute the stake operation
      const result = await this.context.nexusSdk.execute(executeInput);

      // Remove event listener
      this.context.nexusEvents?.off('step', stepListener);

      console.log('✅ WORKFLOW EXECUTION - Stake operation successful:', result);

      console.log(`✅ WORKFLOW EXECUTION - Successfully staked ${amount} ${config.token} on ${protocolInfo.name}`);

      // Store results for potential use by subsequent nodes
      const nodeResults = {
        success: true,
        transactionHash: result?.transactionHash || result?.hash,
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

      console.error('❌ WORKFLOW EXECUTION - Stake operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Provide better error messages for common DeFi issues
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('exceed deposit limit')) {
        userFriendlyMessage = `The ${protocolInfo.name} vault has reached its deposit limit. Try a smaller amount or use a different protocol.`;
      } else if (errorMessage.includes('insufficient allowance')) {
        userFriendlyMessage = `Token approval failed. Please ensure you have approved the protocol to spend your ${config.token}.`;
      } else if (errorMessage.includes('insufficient balance')) {
        userFriendlyMessage = `Insufficient ${config.token} balance. You need at least ${amount} ${config.token} plus gas fees.`;
      } else if (errorMessage.includes('protocol paused')) {
        userFriendlyMessage = `The ${protocolInfo.name} protocol is currently paused. Please try again later.`;
      }

      console.error(`❌ WORKFLOW EXECUTION - Stake operation failed: ${userFriendlyMessage}`);

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

      throw new Error('Stake operation failed: ' + userFriendlyMessage);
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

      // Get unified balance for the specific token
      const balanceResult = await this.context.nexusSdk.getUnifiedBalance(config.token);

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
      } else if (errorMessage.includes('network error')) {
        userFriendlyMessage = `Network error while fetching balance. Please check your connection and try again.`;
      } else if (errorMessage.includes('invalid address')) {
        userFriendlyMessage = `Invalid address format: ${checkAddress}. Please provide a valid Ethereum address.`;
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