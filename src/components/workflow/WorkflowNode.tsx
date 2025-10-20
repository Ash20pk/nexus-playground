import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRightLeft,
  Send,
  Repeat,
  TrendingUp,
  Code,
  Play,
  GitBranch,
  Settings,
  Trash2,
  Clock,
  RotateCw,
  Split,
  Merge,
  Users,
  Wallet,
  Bell,
  Zap
} from 'lucide-react';
import { WorkflowNodeData, WorkflowNodeType } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

const NODE_ICONS: Record<WorkflowNodeType, React.ComponentType<{ className?: string }>> = {
  // Control Flow
  trigger: Play,
  condition: GitBranch,
  delay: Clock,
  loop: RotateCw,
  split: Split,
  aggregate: Merge,
  // Core Actions - Direct SDK Methods
  bridge: ArrowRightLeft,
  transfer: Send,
  'bridge-execute': Zap,
  'custom-contract': Code,
  'balance-check': Wallet,
  // DeFi Templates - Built on execute()
  swap: Repeat,
  stake: TrendingUp,
  // Advanced Actions
  'batch-transfer': Users,
  // Utilities
  notification: Bell
};

const NODE_COLORS: Record<WorkflowNodeType, string> = {
  // Control Flow
  trigger: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  condition: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  delay: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  loop: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  split: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  aggregate: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
  // Core Actions - Direct SDK Methods
  bridge: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  transfer: 'bg-green-50 border-green-200 hover:bg-green-100',
  'bridge-execute': 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100',
  'custom-contract': 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  'balance-check': 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  // DeFi Templates - Built on execute()
  swap: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  stake: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  // Advanced Actions
  'batch-transfer': 'bg-teal-50 border-teal-200 hover:bg-teal-100',
  // Utilities
  notification: 'bg-rose-50 border-rose-200 hover:bg-rose-100'
};

const NODE_BADGE_COLORS: Record<WorkflowNodeType, string> = {
  // Control Flow
  trigger: 'bg-emerald-100 text-emerald-800',
  condition: 'bg-yellow-100 text-yellow-800',
  delay: 'bg-cyan-100 text-cyan-800',
  loop: 'bg-indigo-100 text-indigo-800',
  split: 'bg-pink-100 text-pink-800',
  aggregate: 'bg-violet-100 text-violet-800',
  // Core Actions - Direct SDK Methods
  bridge: 'bg-blue-100 text-blue-800',
  transfer: 'bg-green-100 text-green-800',
  'bridge-execute': 'bg-fuchsia-100 text-fuchsia-800',
  'custom-contract': 'bg-gray-100 text-gray-800',
  'balance-check': 'bg-amber-100 text-amber-800',
  // DeFi Templates - Built on execute()
  swap: 'bg-purple-100 text-purple-800',
  stake: 'bg-orange-100 text-orange-800',
  // Advanced Actions
  'batch-transfer': 'bg-teal-100 text-teal-800',
  // Utilities
  notification: 'bg-rose-100 text-rose-800'
};

interface WorkflowNodeProps extends NodeProps {
  data: WorkflowNodeData;
}

export const WorkflowNode = memo(({ data, selected }: WorkflowNodeProps) => {
  const { setSelectedNode, deleteNode } = useWorkflowStore();
  const Icon = NODE_ICONS[data.type];

  const handleClick = () => {
    setSelectedNode(data.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(data.id);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(data.id);
  };

  const renderNodeContent = () => {
    switch (data.type) {
      case 'bridge':
        return (
          <div className="text-xs text-gray-600">
            {data.config.token} from Chain {data.config.fromChain} → {data.config.toChain}
          </div>
        );
      case 'transfer':
        return (
          <div className="text-xs text-gray-600">
            {data.config.amount} {data.config.token} on Chain {data.config.chain}
          </div>
        );
      case 'swap':
        return (
          <div className="text-xs text-gray-600">
            {data.config.fromToken} → {data.config.toToken} on Chain {data.config.chain}
          </div>
        );
      case 'stake':
        return (
          <div className="text-xs text-gray-600">
            {data.config.amount} {data.config.token} via {data.config.protocol}
          </div>
        );
      case 'custom-contract':
        return (
          <div className="text-xs text-gray-600">
            {data.config.functionName || 'Configure function'}
          </div>
        );
      case 'balance-check':
        return (
          <div className="text-xs text-gray-600">
            {data.config.token} on Chain {data.config.chain}
            {data.config.condition && data.config.condition !== 'none' && (
              <div className="mt-1">
                {data.config.condition === 'greater' && '> '}
                {data.config.condition === 'less' && '< '}
                {data.config.condition === 'equal' && '= '}
                {data.config.value || '0'}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        className={cn(
          'w-64 cursor-pointer transition-all duration-200',
          NODE_COLORS[data.type],
          selected && 'shadow-[inset_0_0_0_2px_#000000,-6px_6px_0_0_#000000]',
          !selected && 'hover:shadow-[inset_0_0_0_2px_#000000,-4px_4px_0_0_#000000]'
        )}
        onClick={handleClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <h3 className="font-medium text-sm">{data.label}</h3>
            </div>
            <div className="flex items-center gap-1 nodrag">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleConfigure}
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn('text-xs w-fit', NODE_BADGE_COLORS[data.type])}
          >
            {data.type}
          </Badge>
        </CardHeader>

        <CardContent className="pt-0">
          {renderNodeContent()}
        </CardContent>
      </Card>

      {/* Input Handles */}
      {data.inputs?.map((input, index) => (
        <Handle
          key={`input-${input.name}`}
          type="target"
          position={Position.Left}
          id={input.name}
          isConnectable={true}
          style={{
            top: 40 + (index * 40),
            backgroundColor: input.required ? '#ef4444' : '#6b7280',
            width: 10,
            height: 10,
            zIndex: 10
          }}
          className="!border-2 !border-white"
        />
      ))}

      {/* Output Handles */}
      {data.outputs?.map((output, index) => (
        <Handle
          key={`output-${output.name}`}
          type="source"
          position={Position.Right}
          id={output.name}
          isConnectable={true}
          style={{
            top: 40 + (index * 40),
            backgroundColor: '#10b981',
            width: 10,
            height: 10,
            zIndex: 10
          }}
          className="!border-2 !border-white"
        />
      ))}
    </>
  );
});

WorkflowNode.displayName = 'WorkflowNode';