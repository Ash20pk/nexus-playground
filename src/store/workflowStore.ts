import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowNodeData,
  WorkflowNodeType
} from '@/types/workflow';
import { Node, Edge, Connection } from '@xyflow/react';
import { DEFAULT_CHAINS } from '@/constants/networks';

interface WorkflowState {
  // Current workflow being edited
  currentWorkflow: Workflow | null;

  // Workflow execution
  execution: WorkflowExecution | null;

  // UI state
  isExecuting: boolean;
  selectedNodeId: string | null;

  // Saved workflows
  savedWorkflows: Workflow[];

  // Actions
  createNewWorkflow: (name: string) => void;
  loadWorkflow: (workflow: Workflow) => void;
  saveCurrentWorkflow: () => void;
  updateWorkflowMetadata: (updates: Partial<Pick<Workflow, 'name' | 'description' | 'tags' | 'isPublic'>>) => void;

  // Node operations
  addNode: (type: WorkflowNodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  updateNodePositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;

  // Edge operations
  addEdge: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;

  // Execution
  executeWorkflow: () => Promise<void>;
  stopExecution: () => void;

  // Persistence
  saveWorkflows: () => void;
  loadWorkflows: () => void;
}

const createDefaultNode = (
  type: WorkflowNodeType,
  position: { x: number; y: number }
): WorkflowNode => {
  const id = uuidv4();

  // Use testnet or mainnet defaults based on environment
  const isTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true';
  const defaultChains = isTestnet ? DEFAULT_CHAINS.testnet : DEFAULT_CHAINS.mainnet;

  const nodeConfigs = {
    bridge: {
      label: 'Bridge Tokens',
      config: {
        fromChain: defaultChains.source,
        toChain: defaultChains.destination,
        token: 'USDC',
        amount: '100'
      }
    },
    transfer: {
      label: 'Transfer Tokens',
      config: {
        chain: defaultChains.destination,
        token: 'USDC',
        amount: '100',
        recipient: ''
      }
    },
    swap: {
      label: 'Swap Tokens',
      config: {
        chain: defaultChains.source,
        fromToken: 'USDC',
        toToken: 'ETH',
        amount: '100',
        slippage: 0.5,
        dexProtocol: 'uniswap-v3' // Uses sdk.execute() with Uniswap V3 ABI
      }
    },
    stake: {
      label: 'Stake in DeFi',
      config: {
        chain: defaultChains.destination,
        token: 'USDC',
        amount: '100',
        protocol: 'aave' // Uses sdk.execute() with Aave Pool ABI
      }
    },
    'custom-contract': {
      label: 'Custom Contract',
      config: {
        chain: defaultChains.destination,
        contractAddress: '',
        abi: [],
        functionName: '',
        parameters: []
      }
    },
    'bridge-execute': {
      label: 'Bridge & Execute',
      config: {
        token: 'USDC',
        amount: '100',
        toChainId: defaultChains.destination,
        sourceChains: [], // Optional: specify source chains
        execute: {
          contractAddress: '',
          contractAbi: [],
          functionName: '',
          parameters: [],
          tokenApproval: {
            token: 'USDC',
            amount: '100'
          }
        },
        waitForReceipt: true,
        requiredConfirmations: 1
      }
    },
    trigger: {
      label: 'Trigger',
      config: {}
    },
    condition: {
      label: 'Condition',
      config: {
        condition: ''
      }
    },
    delay: {
      label: 'Delay',
      config: {
        duration: 5,
        unit: 'seconds'
      }
    },
    loop: {
      label: 'Loop',
      config: {
        iterations: 1,
        breakCondition: ''
      }
    },
    split: {
      label: 'Split',
      config: {
        branches: 2
      }
    },
    aggregate: {
      label: 'Aggregate',
      config: {
        operation: 'sum',
        waitForAll: true
      }
    },
    'batch-transfer': {
      label: 'Batch Transfer',
      config: {
        chain: defaultChains.destination,
        token: 'USDC',
        recipients: []
      }
    },
    'balance-check': {
      label: 'Balance Check',
      config: {
        chain: defaultChains.destination,
        token: 'USDC',
        address: 'fromPrevious',
        condition: 'none', // No condition by default (just check balance)
        value: ''
      }
    },
    notification: {
      label: 'Notification',
      config: {
        type: 'console',
        message: 'Workflow step completed'
      }
    }
  };

  const nodeConfig = nodeConfigs[type];

  return {
    id,
    type: 'workflowNode',
    position,
    data: {
      id,
      type,
      label: nodeConfig.label,
      config: nodeConfig.config,
      outputs: type === 'trigger' ? [{ name: 'start', type: 'transaction' }] : [
        { name: 'transaction', type: 'transaction' },
        { name: 'amount', type: 'amount' }
      ],
      inputs: type === 'trigger' ? [] : [
        { name: 'trigger', type: 'transaction', required: true },
        { name: 'amount', type: 'amount', required: false }
      ]
    }
  };
};

export const useWorkflowStore = create<WorkflowState>()(
  immer((set, get) => ({
    currentWorkflow: null,
    execution: null,
    isExecuting: false,
    selectedNodeId: null,
    savedWorkflows: [],

    createNewWorkflow: (name: string) => {
      set((state) => {
        const workflow: Workflow = {
          id: uuidv4(),
          name,
          description: '',
          nodes: [],
          edges: [],
          created: new Date(),
          updated: new Date(),
          isPublic: false,
          tags: []
        };
        state.currentWorkflow = workflow;

        // Auto-save to local storage
        const existingIndex = state.savedWorkflows.findIndex(w => w.id === workflow.id);
        if (existingIndex >= 0) {
          state.savedWorkflows[existingIndex] = { ...workflow };
        } else {
          state.savedWorkflows.push({ ...workflow });
        }
      });

      // Save to localStorage immediately
      const { savedWorkflows } = get();
      try {
        localStorage.setItem('nexusflow-workflows', JSON.stringify(savedWorkflows));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },

    loadWorkflow: (workflow: Workflow) => {
      console.log('🔄 loadWorkflow called!');
      console.trace('📍 loadWorkflow stack trace');
      set((state) => {
        const isDifferentWorkflow = state.currentWorkflow?.id !== workflow.id;
        state.currentWorkflow = workflow;
        if (isDifferentWorkflow) {
          state.selectedNodeId = null;
        }
      });
    },

    saveCurrentWorkflow: () => {
      set((state) => {
        if (state.currentWorkflow) {
          state.currentWorkflow.updated = new Date();

          const existingIndex = state.savedWorkflows.findIndex(
            w => w.id === state.currentWorkflow!.id
          );

          if (existingIndex >= 0) {
            state.savedWorkflows[existingIndex] = { ...state.currentWorkflow };
          } else {
            state.savedWorkflows.push({ ...state.currentWorkflow });
          }
        }
      });

      // Save to localStorage
      const { savedWorkflows } = get();
      try {
        localStorage.setItem('nexusflow-workflows', JSON.stringify(savedWorkflows));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },

    updateWorkflowMetadata: (updates) => {
      set((state) => {
        if (state.currentWorkflow) {
          Object.assign(state.currentWorkflow, updates);
          state.currentWorkflow.updated = new Date();
        }
      });
    },

    addNode: (type: WorkflowNodeType, position: { x: number; y: number }) => {
      set((state) => {
        if (state.currentWorkflow) {
          const newNode = createDefaultNode(type, position);
          state.currentWorkflow.nodes.push(newNode);
          state.selectedNodeId = newNode.id;
          state.currentWorkflow.updated = new Date();
        }
      });
      // Auto-save to localStorage
      get().saveCurrentWorkflow();
    },

    updateNode: (nodeId: string, updates: Partial<WorkflowNodeData>) => {
      console.log('🏪 Store updateNode called:', { nodeId, updates });
      set((state) => {
        if (state.currentWorkflow) {
          const nodeIndex = state.currentWorkflow.nodes.findIndex(n => n.id === nodeId);
          if (nodeIndex >= 0) {
            console.log('🔄 Updating node in store:', nodeId);
            Object.assign(state.currentWorkflow.nodes[nodeIndex].data, updates);
            state.currentWorkflow.updated = new Date();
            console.log('✅ Node updated, workflow timestamp:', state.currentWorkflow.updated);
          }
        }
      });
      // Auto-save to localStorage
      get().saveCurrentWorkflow();
      console.log('💾 Workflow saved to localStorage');
    },

    updateNodePositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => {
      set((state) => {
        if (state.currentWorkflow) {
          updates.forEach(({ id, position }) => {
            const nodeIndex = state.currentWorkflow!.nodes.findIndex(n => n.id === id);
            if (nodeIndex >= 0) {
              state.currentWorkflow!.nodes[nodeIndex].position = position;
            }
          });
          state.currentWorkflow.updated = new Date();
        }
      });
      // Save positions to localStorage
      get().saveCurrentWorkflow();
    },

    deleteNode: (nodeId: string) => {
      set((state) => {
        if (state.currentWorkflow) {
          state.currentWorkflow.nodes = state.currentWorkflow.nodes.filter(n => n.id !== nodeId);
          state.currentWorkflow.edges = state.currentWorkflow.edges.filter(
            e => e.source !== nodeId && e.target !== nodeId
          );
          if (state.selectedNodeId === nodeId) {
            state.selectedNodeId = null;
          }
          state.currentWorkflow.updated = new Date();
        }
      });
      // Auto-save to localStorage
      get().saveCurrentWorkflow();
    },

    setSelectedNode: (nodeId: string | null) => {
      console.log('🎯 setSelectedNode called with:', nodeId);
      console.trace('📍 Call stack for setSelectedNode');
      set((state) => {
        state.selectedNodeId = nodeId;
      });
    },

    addEdge: (connection: Connection) => {
      set((state) => {
        if (state.currentWorkflow && connection.source && connection.target) {
          const newEdge: WorkflowEdge = {
            id: uuidv4(),
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle
          };
          state.currentWorkflow.edges.push(newEdge);
          state.currentWorkflow.updated = new Date();
        }
      });
      // Auto-save to localStorage
      get().saveCurrentWorkflow();
    },

    deleteEdge: (edgeId: string) => {
      set((state) => {
        if (state.currentWorkflow) {
          state.currentWorkflow.edges = state.currentWorkflow.edges.filter(e => e.id !== edgeId);
          state.currentWorkflow.updated = new Date();
        }
      });
      // Auto-save to localStorage
      get().saveCurrentWorkflow();
    },

    executeWorkflow: async (nexusSDK?: any) => {
      const state = get();
      if (!state.currentWorkflow) return;

      // Check if NexusSDK is available and initialized
      if (!nexusSDK) {
        set((state) => {
          state.execution = {
            id: uuidv4(),
            workflowId: state.currentWorkflow!.id,
            status: 'failed',
            startedAt: new Date(),
            completedAt: new Date(),
            error: 'Please connect your wallet to execute workflows',
            results: {}
          };
        });
        return;
      }

      // Auto-save workflow before execution to localStorage
      get().saveCurrentWorkflow();

      set((state) => {
        state.isExecuting = true;
        state.execution = {
          id: uuidv4(),
          workflowId: state.currentWorkflow!.id,
          status: 'running',
          startedAt: new Date(),
          results: {}
        };
      });

      try {
        // Execute workflow on frontend using real NexusSDK
        const { WorkflowExecutionEngine } = await import('@/lib/workflow/execution');
        const engine = new WorkflowExecutionEngine(state.currentWorkflow, nexusSDK);
        const executionResult = await engine.execute();

        // Save execution result to backend
        const response = await fetch(`/api/workflows/${state.currentWorkflow.id}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(executionResult)
        });

        const result = await response.json();

        set((state) => {
          state.isExecuting = false;
          if (state.execution) {
            state.execution.status = executionResult.status;
            state.execution.results = executionResult.results;
            state.execution.error = executionResult.error;
            state.execution.completedAt = new Date();
          }
        });
      } catch (error) {
        set((state) => {
          state.isExecuting = false;
          if (state.execution) {
            state.execution.status = 'failed';
            state.execution.error = error instanceof Error ? error.message : 'Unknown error';
            state.execution.completedAt = new Date();
          }
        });
      }
    },

    stopExecution: () => {
      set((state) => {
        state.isExecuting = false;
        if (state.execution) {
          state.execution.status = 'failed';
          state.execution.error = 'Execution stopped by user';
          state.execution.completedAt = new Date();
        }
      });
    },

    saveWorkflows: () => {
      const state = get();
      localStorage.setItem('nexusflow-workflows', JSON.stringify(state.savedWorkflows));
    },

    loadWorkflows: () => {
      const saved = localStorage.getItem('nexusflow-workflows');
      if (saved) {
        set((state) => {
          state.savedWorkflows = JSON.parse(saved);
        });
      }
    }
  }))
);