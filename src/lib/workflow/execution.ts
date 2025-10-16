import { NexusSDK } from '@avail-project/nexus-core';
import {
  Workflow,
  WorkflowNode,
  WorkflowExecution,
  BridgeNodeConfig,
  TransferNodeConfig,
  SwapNodeConfig,
  StakeNodeConfig,
  CustomContractNodeConfig
} from '@/types/workflow';

export interface WorkflowExecutionContext {
  nexusSdk: NexusSDK;
  variables: Record<string, any>;
  results: Record<string, any>;
}

export class WorkflowExecutionEngine {
  private workflow: Workflow;
  private context: WorkflowExecutionContext;

  constructor(workflow: Workflow, nexusSdk: NexusSDK) {
    this.workflow = workflow;
    this.context = {
      nexusSdk,
      variables: {},
      results: {}
    };
  }

  async execute(): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflowId: this.workflow.id,
      status: 'running',
      startedAt: new Date(),
      results: {}
    };

    try {
      // Find the trigger node to start execution
      const triggerNode = this.workflow.nodes.find(node => node.data.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      // Execute nodes in dependency order
      const executionOrder = this.getExecutionOrder(triggerNode);

      for (const node of executionOrder) {
        execution.currentNodeId = node.id;

        try {
          const result = await this.executeNode(node);
          this.context.results[node.id] = result;
          execution.results[node.id] = result;
        } catch (error) {
          execution.status = 'failed';
          execution.error = error instanceof Error ? error.message : 'Unknown error';
          execution.completedAt = new Date();
          return execution;
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      return execution;

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
      return execution;
    }
  }

  private getExecutionOrder(startNode: WorkflowNode): WorkflowNode[] {
    const visited = new Set<string>();
    const result: WorkflowNode[] = [];

    const dfs = (node: WorkflowNode) => {
      if (visited.has(node.id)) return;

      visited.add(node.id);
      result.push(node);

      // Find connected nodes
      const outgoingEdges = this.workflow.edges.filter(edge => edge.source === node.id);
      for (const edge of outgoingEdges) {
        const nextNode = this.workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          dfs(nextNode);
        }
      }
    };

    dfs(startNode);
    return result;
  }

  private async executeNode(node: WorkflowNode): Promise<any> {
    console.log(`Executing node: ${node.data.label} (${node.data.type})`);

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

      case 'custom-contract':
        return this.executeCustomContract(node);

      case 'condition':
        return this.executeCondition(node);

      default:
        throw new Error(`Unknown node type: ${node.data.type}`);
    }
  }

  private async executeTrigger(node: WorkflowNode): Promise<any> {
    // Trigger nodes just start the workflow
    return { triggered: true, timestamp: new Date() };
  }

  private async executeBridge(node: WorkflowNode): Promise<any> {
    const config = node.data.config as BridgeNodeConfig;

    // Resolve amount from previous nodes if needed
    const amount = this.resolveValue(config.amount, node);

    console.log('Executing bridge:', {
      token: config.token,
      amount,
      fromChain: config.fromChain,
      toChain: config.toChain
    });

    // Use correct API signature according to official docs
    const result = await this.context.nexusSdk.bridge({
      token: config.token,
      amount: Number(amount),
      chainId: config.toChain,
      sourceChains: config.fromChain ? [config.fromChain] : undefined
    });

    if (!result.success) {
      throw new Error(`Bridge failed: ${result.error}`);
    }

    return {
      type: 'bridge',
      amount,
      token: config.token,
      fromChain: config.fromChain,
      toChain: config.toChain,
      transactionHash: result.transactionHash,
      success: true
    };
  }

  private async executeTransfer(node: WorkflowNode): Promise<any> {
    const config = node.data.config as TransferNodeConfig;

    // Resolve amount from previous nodes if needed
    const amount = this.resolveValue(config.amount, node);

    console.log('Executing transfer:', {
      token: config.token,
      amount,
      chain: config.chain,
      recipient: config.recipient
    });

    // Use correct API signature according to official docs
    const result = await this.context.nexusSdk.transfer({
      token: config.token,
      amount: Number(amount),
      chainId: config.chain,
      recipient: config.recipient,
      sourceChains: undefined // Optional parameter
    });

    if (!result.success) {
      throw new Error(`Transfer failed: ${result.error}`);
    }

    return {
      type: 'transfer',
      amount,
      token: config.token,
      chain: config.chain,
      recipient: config.recipient,
      transactionHash: result.transactionHash,
      success: true
    };
  }

  private async executeSwap(node: WorkflowNode): Promise<any> {
    const config = node.data.config as SwapNodeConfig;

    // Resolve amount from previous nodes if needed
    const amount = this.resolveValue(config.amount, node);

    console.log('Executing swap:', {
      fromToken: config.fromToken,
      toToken: config.toToken,
      amount,
      chain: config.chain,
      slippage: config.slippage
    });

    // Use Nexus SDK execute method to interact with DEX contracts (e.g., Uniswap)
    // This requires DEX contract address and ABI for the specific chain
    const dexContractAddress = this.getDexContractAddress(config.chain);
    const dexAbi = this.getDexAbi(); // Would be the actual DEX ABI

    const result = await this.context.nexusSdk.execute({
      toChainId: config.chain,
      contractAddress: dexContractAddress,
      contractAbi: dexAbi,
      functionName: 'swapExactTokensForTokens', // Uniswap-style function
      buildFunctionParams: (token: any, amount: any, chainId: any, user: any) => ({
        functionParams: [
          amount, // amountIn
          0, // amountOutMin (would calculate based on slippage)
          [this.getTokenAddress(config.fromToken, config.chain), this.getTokenAddress(config.toToken, config.chain)], // path
          user, // to address
          Math.floor(Date.now() / 1000) + 1800 // deadline (30 minutes)
        ]
      }),
      tokenApproval: {
        token: this.getTokenAddress(config.fromToken, config.chain),
        amount: amount.toString()
      }
    });

    if (!result.success) {
      throw new Error(`Swap failed: ${result.error}`);
    }

    return {
      type: 'swap',
      inputAmount: amount,
      fromToken: config.fromToken,
      toToken: config.toToken,
      chain: config.chain,
      slippage: config.slippage,
      transactionHash: result.executeExplorerUrl,
      success: true
    };
  }

  private getDexContractAddress(chainId: number): string {
    // Return actual DEX router addresses for each chain
    const dexAddresses: Record<number, string> = {
      11155111: '0x...', // Sepolia Uniswap V2 Router
      80002: '0x...', // Polygon Amoy DEX Router
      // Add more chains as needed
    };
    return dexAddresses[chainId] || '0x0000000000000000000000000000000000000000';
  }

  private getDexAbi(): any[] {
    // Return actual DEX ABI - would be imported from a constants file
    return []; // Placeholder - would have actual Uniswap V2 Router ABI
  }

  private getTokenAddress(symbol: string, chainId: number): string {
    // Return actual token addresses for each chain
    const tokenAddresses: Record<number, Record<string, string>> = {
      11155111: { // Sepolia
        'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
        'USDC': '0x...', // Sepolia USDC address
        'USDT': '0x...', // Sepolia USDT address
      },
      80002: { // Polygon Amoy
        'MATIC': '0x0000000000000000000000000000000000000000', // Native MATIC
        'USDC': '0x...', // Amoy USDC address
        'USDT': '0x...', // Amoy USDT address
      }
    };
    return tokenAddresses[chainId]?.[symbol] || '0x0000000000000000000000000000000000000000';
  }

  private getProtocolContractAddress(protocol: string, chainId: number): string {
    // Return actual protocol contract addresses for each chain
    const protocolAddresses: Record<string, Record<number, string>> = {
      'aave': {
        11155111: '0x...', // Sepolia Aave Pool
        80002: '0x...', // Polygon Amoy Aave Pool
      },
      'compound': {
        11155111: '0x...', // Sepolia Compound
        80002: '0x...', // Polygon Amoy Compound
      }
    };
    return protocolAddresses[protocol]?.[chainId] || '0x0000000000000000000000000000000000000000';
  }

  private getProtocolAbi(protocol: string): any[] {
    // Return actual protocol ABIs - would be imported from constants files
    const protocolAbis: Record<string, any[]> = {
      'aave': [], // Placeholder - would have actual Aave Pool ABI
      'compound': [], // Placeholder - would have actual Compound ABI
    };
    return protocolAbis[protocol] || [];
  }

  private async executeStake(node: WorkflowNode): Promise<any> {
    const config = node.data.config as StakeNodeConfig;

    // Resolve amount from previous nodes if needed
    const amount = this.resolveValue(config.amount, node);

    console.log('Executing stake:', {
      token: config.token,
      amount,
      chain: config.chain,
      protocol: config.protocol
    });

    // For Aave protocol, use the existing bridge & execute functionality
    if (config.protocol === 'aave') {
      const result = await this.context.nexusSdk.bridgeAndExecute({
        token: config.token,
        amount: amount.toString(),
        toChainId: config.chain,
        sourceChains: undefined, // Optional parameter
        execute: {
          toChainId: config.chain, // Required in execute object
          contractAddress: '0x...', // Aave contract address
          contractAbi: [], // Aave ABI
          functionName: 'deposit',
          buildFunctionParams: (token: any, amount: any, chainId: any, user: any) => ({
            functionParams: []
          }),
          tokenApproval: undefined // Optional parameter
        }
      });

      if (!result.success) {
        throw new Error(`Stake failed: ${result.error}`);
      }

      return {
        type: 'stake',
        amount,
        token: config.token,
        chain: config.chain,
        protocol: config.protocol,
        transactionHash: result.executeExplorerUrl,
        success: true
      };
    }

    // For other protocols, use execute method with the specific protocol contract
    const protocolContractAddress = this.getProtocolContractAddress(config.protocol, config.chain);
    const protocolAbi = this.getProtocolAbi(config.protocol);

    const result = await this.context.nexusSdk.execute({
      toChainId: config.chain,
      contractAddress: protocolContractAddress,
      contractAbi: protocolAbi,
      functionName: 'stake', // Generic staking function
      buildFunctionParams: (token: any, amount: any, chainId: any, user: any) => ({
        functionParams: [amount] // Protocol-specific parameters
      }),
      tokenApproval: {
        token: this.getTokenAddress(config.token, config.chain),
        amount: amount.toString()
      }
    });

    if (!result.success) {
      throw new Error(`Stake failed: ${result.error}`);
    }

    return {
      type: 'stake',
      amount,
      token: config.token,
      chain: config.chain,
      protocol: config.protocol,
      transactionHash: result.executeExplorerUrl,
      success: true
    };
  }

  private async executeCustomContract(node: WorkflowNode): Promise<any> {
    const config = node.data.config as CustomContractNodeConfig;

    console.log('Executing custom contract:', {
      contractAddress: config.contractAddress,
      functionName: config.functionName,
      parameters: config.parameters,
      chain: config.chain
    });

    // Use the execute functionality for custom contracts according to API docs
    const result = await this.context.nexusSdk.execute({
      toChainId: config.chain, // Required parameter according to docs
      contractAddress: config.contractAddress,
      contractAbi: config.abi,
      functionName: config.functionName,
      buildFunctionParams: (token: any, amount: any, chainId: any, userAddress: any) => ({
        functionParams: config.parameters
      }),
      tokenApproval: undefined // Optional parameter
    });

    if (!result.success) {
      throw new Error(`Custom contract execution failed: ${result.error}`);
    }

    return {
      type: 'custom-contract',
      contractAddress: config.contractAddress,
      functionName: config.functionName,
      parameters: config.parameters,
      chain: config.chain,
      transactionHash: result.executeExplorerUrl,
      success: true
    };
  }

  private async executeCondition(node: WorkflowNode): Promise<any> {
    const condition = node.data.config.condition;

    console.log('Executing condition:', condition);

    // Simple condition evaluation
    // In a real implementation, this would use a proper expression evaluator
    try {
      // Get variables from context for condition evaluation
      const variables = this.context.results;

      // For now, just return true (condition passed)
      // TODO: Implement proper condition evaluation
      const conditionResult = true;

      return {
        type: 'condition',
        condition,
        result: conditionResult,
        success: true
      };
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error}`);
    }
  }

  private resolveValue(value: string | number, node: WorkflowNode): string | number {
    if (value === 'fromPrevious') {
      // Find the previous node's output amount
      const incomingEdges = this.workflow.edges.filter(edge => edge.target === node.id);

      if (incomingEdges.length > 0) {
        const sourceNodeId = incomingEdges[0].source;
        const sourceResult = this.context.results[sourceNodeId];

        if (sourceResult && (sourceResult.amount || sourceResult.outputAmount)) {
          return sourceResult.amount || sourceResult.outputAmount;
        }
      }

      throw new Error('No previous output found for "fromPrevious" value');
    }

    return value;
  }
}