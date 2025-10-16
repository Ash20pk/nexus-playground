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
  Plus
} from 'lucide-react';
import { WorkflowNodeType } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';

const NODE_TYPES: Array<{
  type: WorkflowNodeType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'action' | 'control';
}> = [
  {
    type: 'trigger',
    name: 'Trigger',
    description: 'Start point for your workflow',
    icon: Play,
    category: 'control'
  },
  {
    type: 'bridge',
    name: 'Bridge',
    description: 'Move tokens between chains',
    icon: ArrowRightLeft,
    category: 'action'
  },
  {
    type: 'transfer',
    name: 'Transfer',
    description: 'Send tokens to an address',
    icon: Send,
    category: 'action'
  },
  {
    type: 'swap',
    name: 'Swap',
    description: 'Exchange one token for another',
    icon: Repeat,
    category: 'action'
  },
  {
    type: 'stake',
    name: 'Stake',
    description: 'Stake tokens in DeFi protocols',
    icon: TrendingUp,
    category: 'action'
  },
  {
    type: 'custom-contract',
    name: 'Custom Contract',
    description: 'Call any smart contract function',
    icon: Code,
    category: 'action'
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Add conditional logic',
    icon: GitBranch,
    category: 'control'
  }
];

interface NodePaletteProps {
  onAddNode: (type: WorkflowNodeType) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const actionNodes = NODE_TYPES.filter(n => n.category === 'action');
  const controlNodes = NODE_TYPES.filter(n => n.category === 'control');

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
    <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Control</Badge>
          </div>
          <div className="space-y-2">
            {controlNodes.map((nodeType) => (
              <NodeButton key={nodeType.type} nodeType={nodeType} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Actions</Badge>
          </div>
          <div className="space-y-2">
            {actionNodes.map((nodeType) => (
              <NodeButton key={nodeType.type} nodeType={nodeType} />
            ))}
          </div>
        </div>
    </div>
  );
};