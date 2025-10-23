import { Node, Edge } from '@xyflow/react';
import { SUPPORTED_CHAINS, TOKEN_METADATA } from '@avail-project/nexus-core';

// Type aliases for backward compatibility
export type SUPPORTED_CHAINS_IDS = keyof typeof SUPPORTED_CHAINS;
export type SUPPORTED_TOKENS = keyof typeof TOKEN_METADATA;

export interface WorkflowNodeData {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: WorkflowNodeConfig;
  outputs?: WorkflowOutput[];
  inputs?: WorkflowInput[];
}

export type WorkflowNodeType =
  // Control Flow
  | 'trigger'
  | 'condition'
  | 'delay'
  | 'loop'
  | 'split'
  | 'aggregate'
  // Core Actions - Direct SDK Methods
  | 'bridge'
  | 'transfer'
  | 'bridge-execute'
  | 'custom-contract'
  | 'balance-check'
  // DeFi Templates - Built on execute()
  | 'swap'
  | 'stake'
  // Advanced Actions
  | 'batch-transfer'
  // SDK Features
  | 'allowance-management'
  | 'simulate-bridge'
  | 'simulate-transfer'
  // Utilities
  | 'notification';

export interface WorkflowNodeConfig {
  [key: string]: any;
}

export interface BridgeNodeConfig extends WorkflowNodeConfig {
  fromChain: SUPPORTED_CHAINS_IDS;
  toChain: SUPPORTED_CHAINS_IDS;
  token: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
}

export interface TransferNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  token: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  toAddress: string; // Keep as toAddress for UI, map to recipient in execution
  sourceChains?: SUPPORTED_CHAINS_IDS[]; // Optional source chain restrictions
}

export interface SwapNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  fromToken: SUPPORTED_TOKENS;
  toToken: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  slippage: number;
  // Note: Internally uses sdk.execute() with DEX contract ABIs (Uniswap, SushiSwap, etc.)
  dexProtocol?: 'uniswap-v3' | 'sushiswap' | 'curve'; // DEX to use for swap
}

export interface StakeNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  token: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  protocol: 'aave' | 'compound' | 'yearn'; // DeFi protocol for staking
  // Note: Internally uses sdk.execute() with DeFi protocol contract ABIs
}

export interface CustomContractNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  contractAddress: string;
  abi: any[];
  functionName: string;
  functionParams?: any[]; // Optional custom parameters
  amount?: string | 'fromPrevious'; // Optional amount for token operations
  ethValue?: string; // Optional ETH value for payable functions
  tokenApproval?: {
    token: SUPPORTED_TOKENS;
    amount: string;
  }; // Optional token approval
}

export interface BridgeExecuteNodeConfig extends WorkflowNodeConfig {
  token: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  toChainId: SUPPORTED_CHAINS_IDS;
  sourceChains?: SUPPORTED_CHAINS_IDS[]; // Optional: specific source chains
  execute: {
    contractAddress: string;
    contractAbi: any[];
    functionName: string;
    parameters?: any[];
    tokenApproval?: {
      token: SUPPORTED_TOKENS;
      amount: string;
    };
  };
  waitForReceipt?: boolean;
  requiredConfirmations?: number;
}

export interface AllowanceManagementNodeConfig extends WorkflowNodeConfig {
  token: SUPPORTED_TOKENS;
  spender: string; // Contract address to approve
  amount: string | 'max' | 'min'; // Allowance amount
  chain: SUPPORTED_CHAINS_IDS;
}

export interface SimulateBridgeNodeConfig extends WorkflowNodeConfig {
  token: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  chainId: SUPPORTED_CHAINS_IDS;
  sourceChains?: SUPPORTED_CHAINS_IDS[];
}

export interface SimulateTransferNodeConfig extends WorkflowNodeConfig {
  token: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  chainId: SUPPORTED_CHAINS_IDS;
  recipient: string;
  sourceChains?: SUPPORTED_CHAINS_IDS[];
}

export interface DelayNodeConfig extends WorkflowNodeConfig {
  duration: number; // in seconds
  unit: 'seconds' | 'minutes' | 'hours';
}

export interface LoopNodeConfig extends WorkflowNodeConfig {
  iterations: number | 'fromPrevious';
  breakCondition?: string;
}

export interface SplitNodeConfig extends WorkflowNodeConfig {
  branches: number;
}

export interface AggregateNodeConfig extends WorkflowNodeConfig {
  operation: 'sum' | 'average' | 'max' | 'min' | 'first' | 'last';
  waitForAll: boolean;
}

export interface BatchTransferNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  token: SUPPORTED_TOKENS;
  recipients: Array<{ address: string; amount: string }>;
}

export interface BalanceCheckNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  token: SUPPORTED_TOKENS;
  address: string | 'fromPrevious';
  condition?: 'none' | 'greater' | 'less' | 'equal'; // 'none' = no condition
  value?: string;
}

export interface NotificationNodeConfig extends WorkflowNodeConfig {
  type: 'email' | 'webhook' | 'console';
  message: string;
  webhookUrl?: string;
}

export interface WorkflowOutput {
  name: string;
  type: 'token' | 'amount' | 'address' | 'transaction';
  value?: any;
}

export interface WorkflowInput {
  name: string;
  type: 'token' | 'amount' | 'address' | 'transaction';
  required: boolean;
  source?: string; // Node ID that provides this input
}

export interface WorkflowNode extends Node {
  data: WorkflowNodeData;
}

export interface WorkflowEdge extends Edge {
  sourceOutput?: string;
  targetInput?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created: Date;
  updated: Date;
  isPublic: boolean;
  tags: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentNodeId?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  results: Record<string, any>;
}

// Simulation Support Types
export interface SimulationResult {
  success: boolean;
  estimatedCost?: string; // Gas cost estimate
  estimatedTime?: number; // Time in seconds
  steps?: string[]; // Step identifiers
  error?: string;
  metadata?: Record<string, any>;
}

export interface NodeSimulation {
  nodeId: string;
  result: SimulationResult;
  timestamp: Date;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  thumbnailUrl?: string;
}