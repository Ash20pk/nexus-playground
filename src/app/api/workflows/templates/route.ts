import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTemplate } from '@/types/workflow';
import { DEFAULT_CHAINS } from '@/constants/networks';

// Use testnet or mainnet defaults based on environment
const isTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true';
const defaultChains = isTestnet ? DEFAULT_CHAINS.testnet : DEFAULT_CHAINS.mainnet;

// Predefined workflow templates
const templates: WorkflowTemplate[] = [
  {
    id: 'bridge-and-stake',
    name: 'Bridge & Stake',
    description: 'Bridge USDC from Ethereum to Polygon and stake in Aave',
    category: 'DeFi',
    nodes: [
      {
        id: 'trigger-1',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          id: 'trigger-1',
          type: 'trigger',
          label: 'Start',
          config: {},
          outputs: [{ name: 'start', type: 'transaction' }],
          inputs: []
        }
      },
      {
        id: 'bridge-1',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          id: 'bridge-1',
          type: 'bridge',
          label: 'Bridge to Polygon',
          config: {
            fromChain: defaultChains.source,
            toChain: defaultChains.destination,
            token: 'USDC',
            amount: '100'
          },
          outputs: [
            { name: 'amount', type: 'amount' },
            { name: 'transaction', type: 'transaction' }
          ],
          inputs: [
            { name: 'trigger', type: 'transaction', required: true }
          ]
        }
      },
      {
        id: 'stake-1',
        type: 'workflowNode',
        position: { x: 700, y: 100 },
        data: {
          id: 'stake-1',
          type: 'stake',
          label: 'Stake in Aave',
          config: {
            chain: defaultChains.destination,
            token: 'USDC',
            amount: 'fromPrevious',
            protocol: 'aave'
          },
          outputs: [
            { name: 'amount', type: 'amount' },
            { name: 'transaction', type: 'transaction' }
          ],
          inputs: [
            { name: 'amount', type: 'amount', required: false },
            { name: 'trigger', type: 'transaction', required: true }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'trigger-1',
        target: 'bridge-1',
        sourceHandle: 'start',
        targetHandle: 'trigger'
      },
      {
        id: 'e2',
        source: 'bridge-1',
        target: 'stake-1',
        sourceHandle: 'transaction',
        targetHandle: 'trigger'
      }
    ]
  },
  {
    id: 'multi-chain-arbitrage',
    name: 'Multi-Chain Arbitrage',
    description: 'Swap tokens across multiple chains for arbitrage opportunities',
    category: 'Trading',
    nodes: [
      {
        id: 'trigger-1',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          id: 'trigger-1',
          type: 'trigger',
          label: 'Start',
          config: {},
          outputs: [{ name: 'start', type: 'transaction' }],
          inputs: []
        }
      },
      {
        id: 'swap-1',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          id: 'swap-1',
          type: 'swap',
          label: 'Swap on Ethereum',
          config: {
            chain: 1,
            fromToken: 'USDC',
            toToken: 'ETH',
            amount: '1000',
            slippage: 0.5
          },
          outputs: [
            { name: 'amount', type: 'amount' },
            { name: 'transaction', type: 'transaction' }
          ],
          inputs: [
            { name: 'trigger', type: 'transaction', required: true }
          ]
        }
      },
      {
        id: 'bridge-1',
        type: 'workflowNode',
        position: { x: 700, y: 100 },
        data: {
          id: 'bridge-1',
          type: 'bridge',
          label: 'Bridge to Arbitrum',
          config: {
            fromChain: 1,
            toChain: 42161,
            token: 'ETH',
            amount: 'fromPrevious'
          },
          outputs: [
            { name: 'amount', type: 'amount' },
            { name: 'transaction', type: 'transaction' }
          ],
          inputs: [
            { name: 'trigger', type: 'transaction', required: true }
          ]
        }
      },
      {
        id: 'swap-2',
        type: 'workflowNode',
        position: { x: 1000, y: 100 },
        data: {
          id: 'swap-2',
          type: 'swap',
          label: 'Swap on Arbitrum',
          config: {
            chain: 42161,
            fromToken: 'ETH',
            toToken: 'USDC',
            amount: 'fromPrevious',
            slippage: 0.5
          },
          outputs: [
            { name: 'amount', type: 'amount' },
            { name: 'transaction', type: 'transaction' }
          ],
          inputs: [
            { name: 'trigger', type: 'transaction', required: true }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'trigger-1',
        target: 'swap-1',
        sourceHandle: 'start',
        targetHandle: 'trigger'
      },
      {
        id: 'e2',
        source: 'swap-1',
        target: 'bridge-1',
        sourceHandle: 'transaction',
        targetHandle: 'trigger'
      },
      {
        id: 'e3',
        source: 'bridge-1',
        target: 'swap-2',
        sourceHandle: 'transaction',
        targetHandle: 'trigger'
      }
    ]
  },
  {
    id: 'conditional-transfer',
    name: 'Conditional Transfer',
    description: 'Transfer tokens only if certain conditions are met',
    category: 'Automation',
    nodes: [
      {
        id: 'trigger-1',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          id: 'trigger-1',
          type: 'trigger',
          label: 'Start',
          config: {},
          outputs: [{ name: 'start', type: 'transaction' }],
          inputs: []
        }
      },
      {
        id: 'condition-1',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          id: 'condition-1',
          type: 'condition',
          label: 'Check Balance',
          config: {
            condition: 'balance > 100'
          },
          outputs: [
            { name: 'result', type: 'transaction' }
          ],
          inputs: [
            { name: 'trigger', type: 'transaction', required: true }
          ]
        }
      },
      {
        id: 'transfer-1',
        type: 'workflowNode',
        position: { x: 700, y: 100 },
        data: {
          id: 'transfer-1',
          type: 'transfer',
          label: 'Send Tokens',
          config: {
            chain: 1,
            token: 'USDC',
            amount: '50',
            recipient: '0x...'
          },
          outputs: [
            { name: 'amount', type: 'amount' },
            { name: 'transaction', type: 'transaction' }
          ],
          inputs: [
            { name: 'trigger', type: 'transaction', required: true }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'trigger-1',
        target: 'condition-1',
        sourceHandle: 'start',
        targetHandle: 'trigger'
      },
      {
        id: 'e2',
        source: 'condition-1',
        target: 'transfer-1',
        sourceHandle: 'result',
        targetHandle: 'trigger'
      }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let filteredTemplates = templates;

    if (category) {
      filteredTemplates = templates.filter(t =>
        t.category.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredTemplates
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates'
    }, { status: 500 });
  }
}