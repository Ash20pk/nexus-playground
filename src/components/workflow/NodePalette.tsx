import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  Send,
  Repeat,
  TrendingUp,
  Code,
  Play,
  GitBranch,
  Plus,
  Clock,
  RotateCw,
  Split,
  Merge,
  Users,
  Wallet,
  Bell,
  Zap
} from 'lucide-react';
import { WorkflowNodeType } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';

const NODE_TYPES: Array<{
  type: WorkflowNodeType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'control' | 'core' | 'defi' | 'advanced' | 'utility';
}> = [
  // Control Flow
  {
    type: 'trigger',
    name: 'Trigger',
    description: 'Start point for your workflow',
    icon: Play,
    category: 'control'
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Add conditional logic',
    icon: GitBranch,
    category: 'control'
  },
  {
    type: 'delay',
    name: 'Delay',
    description: 'Wait for a specified duration',
    icon: Clock,
    category: 'control'
  },
  {
    type: 'loop',
    name: 'Loop',
    description: 'Repeat operations multiple times',
    icon: RotateCw,
    category: 'control'
  },
  {
    type: 'split',
    name: 'Split',
    description: 'Execute multiple branches in parallel',
    icon: Split,
    category: 'control'
  },
  {
    type: 'aggregate',
    name: 'Aggregate',
    description: 'Combine results from multiple inputs',
    icon: Merge,
    category: 'control'
  },
  // Core Actions - Direct SDK Methods
  {
    type: 'bridge',
    name: 'Bridge',
    description: 'Bridge tokens between chains',
    icon: ArrowRightLeft,
    category: 'core'
  },
  {
    type: 'transfer',
    name: 'Transfer',
    description: 'Send tokens to an address',
    icon: Send,
    category: 'core'
  },
  {
    type: 'bridge-execute',
    name: 'Bridge & Execute',
    description: 'Bridge tokens and execute contract atomically',
    icon: Zap,
    category: 'core'
  },
  {
    type: 'balance-check',
    name: 'Balance Check',
    description: 'Check token balance with conditions',
    icon: Wallet,
    category: 'core'
  },
  // DeFi Templates - Built on execute()
  {
    type: 'swap',
    name: 'Swap',
    description: 'Exchange tokens via DEX (Uniswap, etc.)',
    icon: Repeat,
    category: 'defi'
  },
  {
    type: 'stake',
    name: 'Stake',
    description: 'Stake in DeFi protocols (Aave, Compound)',
    icon: TrendingUp,
    category: 'defi'
  },
  // Advanced Actions
  {
    type: 'batch-transfer',
    name: 'Batch Transfer',
    description: 'Send tokens to multiple addresses',
    icon: Users,
    category: 'advanced'
  },
  {
    type: 'custom-contract',
    name: 'Custom Contract',
    description: 'Call any smart contract function',
    icon: Code,
    category: 'advanced'
  },
  // Utilities
  {
    type: 'notification',
    name: 'Notification',
    description: 'Send alerts and notifications',
    icon: Bell,
    category: 'utility'
  }
];

interface NodePaletteProps {
  onAddNode: (type: WorkflowNodeType) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const controlNodes = NODE_TYPES.filter(n => n.category === 'control');
  const coreNodes = NODE_TYPES.filter(n => n.category === 'core');
  const defiNodes = NODE_TYPES.filter(n => n.category === 'defi');
  const advancedNodes = NODE_TYPES.filter(n => n.category === 'advanced');
  const utilityNodes = NODE_TYPES.filter(n => n.category === 'utility');

  const NodeButton: React.FC<{ nodeType: typeof NODE_TYPES[0] }> = ({ nodeType }) => {
    const Icon = nodeType.icon;

    return (
      <Button
        variant="outline"
        className="h-auto p-3 flex flex-col items-start gap-2 hover:bg-gray-100 transition-all w-full"
        onClick={() => onAddNode(nodeType.type)}
      >
        <div className="flex items-center gap-2 w-full">
          <Icon className="h-4 w-4" />
          <span className="font-medium text-sm">{nodeType.name}</span>
          <Plus className="h-3 w-3 ml-auto" />
        </div>
        <p className="text-xs text-gray-600 text-left">{nodeType.description}</p>
      </Button>
    );
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Control Flow</Badge>
          </div>
          <div className="space-y-2">
            {controlNodes.map((nodeType) => (
              <NodeButton key={nodeType.type} nodeType={nodeType} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="text-xs bg-blue-100 text-blue-800">Core SDK Actions</Badge>
          </div>
          <div className="space-y-2">
            {coreNodes.map((nodeType) => (
              <NodeButton key={nodeType.type} nodeType={nodeType} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="text-xs bg-purple-100 text-purple-800">DeFi Templates</Badge>
          </div>
          <div className="space-y-2">
            {defiNodes.map((nodeType) => (
              <NodeButton key={nodeType.type} nodeType={nodeType} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Advanced</Badge>
          </div>
          <div className="space-y-2">
            {advancedNodes.map((nodeType) => (
              <NodeButton key={nodeType.type} nodeType={nodeType} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Utilities</Badge>
          </div>
          <div className="space-y-2">
            {utilityNodes.map((nodeType) => (
              <NodeButton key={nodeType.type} nodeType={nodeType} />
            ))}
          </div>
        </div>
    </div>
  );
};