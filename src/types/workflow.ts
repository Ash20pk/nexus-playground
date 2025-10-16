import { Node, Edge } from '@xyflow/react';
import { SUPPORTED_CHAINS_IDS, SUPPORTED_TOKENS } from '@avail-project/nexus-core';

export interface WorkflowNodeData {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: WorkflowNodeConfig;
  outputs?: WorkflowOutput[];
  inputs?: WorkflowInput[];
}

export type WorkflowNodeType =
  | 'bridge'
  | 'transfer'
  | 'swap'
  | 'stake'
  | 'custom-contract'
  | 'trigger'
  | 'condition';

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
  recipient: string;
}

export interface SwapNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  fromToken: SUPPORTED_TOKENS;
  toToken: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  slippage: number;
}

export interface StakeNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  token: SUPPORTED_TOKENS;
  amount: string | 'fromPrevious';
  protocol: string;
}

export interface CustomContractNodeConfig extends WorkflowNodeConfig {
  chain: SUPPORTED_CHAINS_IDS;
  contractAddress: string;
  abi: any[];
  functionName: string;
  parameters: any[];
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

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  thumbnailUrl?: string;
}