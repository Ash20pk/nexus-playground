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
  Trash2
} from 'lucide-react';
import { WorkflowNodeData, WorkflowNodeType } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

const NODE_ICONS: Record<WorkflowNodeType, React.ComponentType<{ className?: string }>> = {
  bridge: ArrowRightLeft,
  transfer: Send,
  swap: Repeat,
  stake: TrendingUp,
  'custom-contract': Code,
  trigger: Play,
  condition: GitBranch
};

const NODE_COLORS: Record<WorkflowNodeType, string> = {
  bridge: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  transfer: 'bg-green-50 border-green-200 hover:bg-green-100',
  swap: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  stake: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  'custom-contract': 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  trigger: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  condition: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
};

const NODE_BADGE_COLORS: Record<WorkflowNodeType, string> = {
  bridge: 'bg-blue-100 text-blue-800',
  transfer: 'bg-green-100 text-green-800',
  swap: 'bg-purple-100 text-purple-800',
  stake: 'bg-orange-100 text-orange-800',
  'custom-contract': 'bg-gray-100 text-gray-800',
  trigger: 'bg-emerald-100 text-emerald-800',
  condition: 'bg-yellow-100 text-yellow-800'
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
            <div className="flex items-center gap-1">
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
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
          style={{
            top: 50 + (index * 20),
            backgroundColor: input.required ? '#ef4444' : '#6b7280',
            width: 8,
            height: 8
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
          style={{
            top: 50 + (index * 20),
            backgroundColor: '#10b981',
            width: 8,
            height: 8
          }}
          className="!border-2 !border-white"
        />
      ))}
    </>
  );
});

WorkflowNode.displayName = 'WorkflowNode';