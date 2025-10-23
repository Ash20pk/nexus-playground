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
  Zap,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { WorkflowNodeData, WorkflowNodeType } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';
import { resolveConfigValue } from '@/lib/workflow/resolve';

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
  const { setSelectedNode, deleteNode, currentWorkflow, executingNodeId, isExecuting, nodeExecutionStatus } = useWorkflowStore();
  const Icon = NODE_ICONS[data.type];
  const isCurrentlyExecuting = isExecuting && executingNodeId === data.id;
  const executionStatus = nodeExecutionStatus[data.id];

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

  const resolve = (key: string, raw: any) =>
    resolveConfigValue(currentWorkflow, data.id, key, raw);

  const renderNodeContent = () => {
    switch (data.type) {
      case 'bridge':
        return `${data.config.token} from Chain ${data.config.fromChain} → ${data.config.toChain}`;
      case 'transfer':
        return `${resolve('amount', data.config.amount)} ${data.config.token} on Chain ${data.config.chain}`;
      case 'swap':
        const isSameChainSwap = data.config.fromChain === data.config.toChain;
        if (isSameChainSwap) {
          return `${data.config.fromToken || '?'} → ${data.config.toToken || '?'} on Chain ${data.config.fromChain || '?'}`;
        } else {
          return `${data.config.fromToken || '?'} → ${data.config.toToken || '?'} (${data.config.fromChain || '?'} → ${data.config.toChain || '?'})`;
        }
      case 'stake':
        return `${resolve('amount', data.config.amount)} ${data.config.token} via ${data.config.protocol}`;
      case 'custom-contract':
        return data.config.functionName || 'Configure function';
      case 'balance-check':
        const condition = data.config.condition && data.config.condition !== 'none'
          ? ` ${data.config.condition === 'greater' ? '>' : data.config.condition === 'less' ? '<' : '='} ${data.config.value || '0'}`
          : '';
        return `${data.config.token} on Chain ${data.config.chain}${condition}`;
      default:
        return 'Configure node';
    }
  };

  return (
    <>
      <div className="relative">
        {/* Execution status indicators with smooth, non-flickering transitions */}
        {isCurrentlyExecuting && (
          <div
            key="executing"
            className="absolute -top-3 -right-3 z-20 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-300 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm opacity-0 scale-75 animate-[fadeInScale_400ms_ease-out_forwards]"
          >
            <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
            <span className="text-blue-700 text-xs font-semibold">Executing</span>
          </div>
        )}
        {executionStatus === 'success' && (
          <div
            key="success"
            className="absolute -top-3 -right-3 z-20 flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-full px-2.5 py-1 shadow-lg opacity-0 scale-75 animate-[fadeInScale_500ms_ease-out_forwards]"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-700 text-xs font-semibold">Success</span>
          </div>
        )}
        {executionStatus === 'error' && (
          <div
            key="error"
            className="absolute -top-3 -right-3 z-20 flex items-center gap-1.5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-full px-2.5 py-1 shadow-lg opacity-0 scale-75 animate-[fadeInScale_500ms_ease-out_forwards]"
          >
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-700 text-xs font-semibold">Error</span>
          </div>
        )}

        <Card
          className={cn(
            'w-60 h-32 cursor-pointer relative overflow-hidden flex flex-col',
            'transition-[box-shadow,transform] duration-300 ease-out',
            NODE_COLORS[data.type],
            selected && !isCurrentlyExecuting && !executionStatus && 'shadow-[inset_0_0_0_3px_#000000,-8px_8px_0_0_#000000] scale-105',
            !selected && !isCurrentlyExecuting && !executionStatus && 'hover:shadow-[inset_0_0_0_2px_#000000,-6px_6px_0_0_#000000] hover:scale-102',
            isCurrentlyExecuting && 'ring-4 ring-blue-400 ring-offset-2 shadow-lg',
            executionStatus === 'success' && 'ring-3 ring-emerald-400 ring-offset-1 shadow-emerald-200/50 shadow-lg',
            executionStatus === 'error' && 'ring-3 ring-red-400 ring-offset-1 shadow-red-200/50 shadow-lg'
          )}
          onClick={handleClick}
        >
          <CardHeader className="pb-1 px-3 pt-2 flex-shrink-0">
            <div className="flex items-center justify-between min-h-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={cn(
                  "p-1 rounded-full transition-[background-color,transform] duration-300 ease-out flex-shrink-0",
                  isCurrentlyExecuting && "bg-blue-100",
                  executionStatus === 'success' && "bg-emerald-100",
                  executionStatus === 'error' && "bg-red-100",
                  !isCurrentlyExecuting && !executionStatus && "bg-white/50"
                )}>
                  <Icon className={cn(
                    "h-3.5 w-3.5 transition-colors duration-300 ease-out",
                    isCurrentlyExecuting && "text-blue-600",
                    executionStatus === 'success' && "text-emerald-600",
                    executionStatus === 'error' && "text-red-600"
                  )} />
                </div>
                <h3 className="font-medium text-sm truncate min-w-0">{data.label}</h3>
              </div>
            <div className="flex items-center gap-0.5 nodrag flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-white/80 transition-all duration-200 hover:scale-110"
                onClick={handleConfigure}
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs w-fit font-semibold transition-all duration-200 border shadow-sm mt-1',
              NODE_BADGE_COLORS[data.type],
              selected && 'ring-1 ring-black/20'
            )}
          >
            {data.type}
          </Badge>
        </CardHeader>

        <CardContent className="px-3 py-1 flex-1 min-h-0 overflow-hidden">
          <div className="text-xs text-gray-600 line-clamp-3">
            {renderNodeContent()}
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Enhanced Input Handles */}
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
            width: 12,
            height: 12,
            zIndex: 10,
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
          className="hover:!scale-150 hover:!shadow-lg hover:!shadow-blue-200/60 !rounded-full"
        />
      ))}

      {/* Enhanced Output Handles */}
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
            width: 12,
            height: 12,
            zIndex: 10,
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
          className="hover:!scale-150 hover:!shadow-lg hover:!shadow-emerald-200/60 !rounded-full"
        />
      ))}
    </>
  );
});

WorkflowNode.displayName = 'WorkflowNode';