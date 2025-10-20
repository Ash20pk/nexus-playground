import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Unlink } from 'lucide-react';
import { WorkflowNode } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { SUPPORTED_CHAINS_IDS, SUPPORTED_TOKENS } from '@avail-project/nexus-core';
import { getAvailableChains, SUPPORTED_TOKENS as LOCAL_SUPPORTED_TOKENS } from '@/constants/networks';

interface NodeConfigPanelProps {
  node?: WorkflowNode;
  onDeleteEdge: (edgeId: string) => void;
}

// Use testnet by default for development
const IS_TESTNET = process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true';
const AVAILABLE_CHAINS = getAvailableChains(IS_TESTNET);

const TOKEN_OPTIONS = LOCAL_SUPPORTED_TOKENS;

// Separate component for balance check configuration
interface BalanceCheckConfigProps {
  node: WorkflowNode;
  onConfigUpdate: (key: string, value: any) => void;
}

const BalanceCheckConfig: React.FC<BalanceCheckConfigProps> = ({ node, onConfigUpdate }) => {
  // Local state for immediate UI updates
  const [localConfig, setLocalConfig] = useState(node.data.config);
  const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync local config when node changes
  React.useEffect(() => {
    setLocalConfig(node.data.config);
  }, [node.id]);

  // Wrapper to prevent dialog closing issues
  const handleSelectChange = (key: string, value: any) => {
    // Update local state immediately for UI responsiveness
    setLocalConfig(prev => ({ ...prev, [key]: value }));

    // Debounce the actual store update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onConfigUpdate(key, value);
    }, 300);
  };

  const handleConditionChange = (value: string) => {
    handleSelectChange('condition', value);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <Label>Chain</Label>
        <Select
          value={localConfig.chain?.toString()}
          onValueChange={(value) => handleSelectChange('chain', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(AVAILABLE_CHAINS).map(([id, chain]) => (
              <SelectItem key={id} value={id}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Token</Label>
        <Select
          value={localConfig.token}
          onValueChange={(value) => handleSelectChange('token', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOKEN_OPTIONS.map((token) => (
              <SelectItem key={token} value={token}>
                {token}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Address</Label>
        <Input
          value={localConfig.address}
          onChange={(e) => handleSelectChange('address', e.target.value)}
          placeholder="0x... or 'fromPrevious'"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use 'fromPrevious' to check address from previous node
        </p>
      </div>

      <div>
        <Label>Condition (Optional)</Label>
        <Select
          value={localConfig.condition || 'none'}
          onValueChange={handleConditionChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No condition (just check)</SelectItem>
            <SelectItem value="greater">Greater than (&gt;)</SelectItem>
            <SelectItem value="less">Less than (&lt;)</SelectItem>
            <SelectItem value="equal">Equal to (=)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(localConfig.condition !== 'none' && localConfig.condition) && (
        <div>
          <Label>Value to Compare</Label>
          <Input
            value={localConfig.value || ''}
            onChange={(e) => handleSelectChange('value', e.target.value)}
            placeholder="100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Balance will be compared against this value
          </p>
        </div>
      )}
    </div>
  );
};

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onDeleteEdge }) => {
  const { updateNode, deleteNode, currentWorkflow } = useWorkflowStore();

  if (!node) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No node selected</p>
          <p className="text-sm">Click on a node to configure its settings</p>
        </div>
      </div>
    );
  }

  const handleConfigUpdate = (key: string, value: any) => {
    console.log('📝 handleConfigUpdate called:', { nodeId: node.id, key, value });
    updateNode(node.id, {
      config: {
        ...node.data.config,
        [key]: value
      }
    });
    console.log('✅ Store updated for node:', node.id);
  };

  // Create a debounced update to prevent rapid re-renders
  const [localConfig, setLocalConfig] = useState(node.data.config);
  const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync local config when node changes
  React.useEffect(() => {
    setLocalConfig(node.data.config);
  }, [node.id]);

  const handleSelectChange = (key: string, value: any) => {
    console.log('🎯 handleSelectChange called:', { key, value });
    // Update local state immediately for UI responsiveness
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    console.log('🔄 Local config updated');

    // Debounce the actual store update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Debounced update executing:', { key, value });
      handleConfigUpdate(key, value);
    }, 300);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleLabelUpdate = (label: string) => {
    updateNode(node.id, { label });
  };

  const renderConfigForm = () => {
    switch (node.data.type) {
      case 'bridge':
        return (
          <div className="space-y-4">
            <div>
              <Label>Token</Label>
              <Select
                value={localConfig.token}
                onValueChange={(value) => handleSelectChange('token', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_OPTIONS.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                value={node.data.config.amount}
                onChange={(e) => handleConfigUpdate('amount', e.target.value)}
                placeholder="Amount to bridge"
              />
            </div>

            <div>
              <Label>From Chain</Label>
              <Select
                value={localConfig.fromChain?.toString()}
                onValueChange={(value) => handleSelectChange('fromChain', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABLE_CHAINS).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>To Chain</Label>
              <Select
                value={localConfig.toChain?.toString()}
                onValueChange={(value) => handleSelectChange('toChain', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABLE_CHAINS).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'transfer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Chain</Label>
              <Select
                value={localConfig.chain?.toString()}
                onValueChange={(value) => handleSelectChange('chain', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABLE_CHAINS).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Token</Label>
              <Select
                value={localConfig.token}
                onValueChange={(value) => handleSelectChange('token', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_OPTIONS.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                value={node.data.config.amount}
                onChange={(e) => handleConfigUpdate('amount', e.target.value)}
                placeholder="Amount to transfer"
              />
            </div>

            <div>
              <Label>Recipient Address</Label>
              <Input
                value={node.data.config.recipient}
                onChange={(e) => handleConfigUpdate('recipient', e.target.value)}
                placeholder="0x..."
              />
            </div>
          </div>
        );

      case 'swap':
        return (
          <div className="space-y-4">
            <div>
              <Label>Chain</Label>
              <Select
                value={localConfig.chain?.toString()}
                onValueChange={(value) => handleSelectChange('chain', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABLE_CHAINS).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>From Token</Label>
              <Select
                value={localConfig.fromToken}
                onValueChange={(value) => handleSelectChange('fromToken', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_OPTIONS.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>To Token</Label>
              <Select
                value={localConfig.toToken}
                onValueChange={(value) => handleSelectChange('toToken', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_OPTIONS.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                value={node.data.config.amount}
                onChange={(e) => handleConfigUpdate('amount', e.target.value)}
                placeholder="Amount to swap"
              />
            </div>

            <div>
              <Label>Slippage (%)</Label>
              <Input
                type="number"
                value={node.data.config.slippage}
                onChange={(e) => handleConfigUpdate('slippage', parseFloat(e.target.value))}
                placeholder="0.5"
                step="0.1"
                min="0"
                max="10"
              />
            </div>
          </div>
        );

      case 'stake':
        return (
          <div className="space-y-4">
            <div>
              <Label>Chain</Label>
              <Select
                value={localConfig.chain?.toString()}
                onValueChange={(value) => handleSelectChange('chain', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABLE_CHAINS).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Token</Label>
              <Select
                value={localConfig.token}
                onValueChange={(value) => handleSelectChange('token', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_OPTIONS.map((token) => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                value={node.data.config.amount}
                onChange={(e) => handleConfigUpdate('amount', e.target.value)}
                placeholder="Amount to stake"
              />
            </div>

            <div>
              <Label>Protocol</Label>
              <Select
                value={localConfig.protocol}
                onValueChange={(value) => handleSelectChange('protocol', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aave">Aave</SelectItem>
                  <SelectItem value="compound">Compound</SelectItem>
                  <SelectItem value="uniswap">Uniswap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'custom-contract':
        return (
          <div className="space-y-4">
            <div>
              <Label>Chain</Label>
              <Select
                value={localConfig.chain?.toString()}
                onValueChange={(value) => handleSelectChange('chain', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABLE_CHAINS).map(([id, chain]) => (
                    <SelectItem key={id} value={id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Contract Address</Label>
              <Input
                value={node.data.config.contractAddress}
                onChange={(e) => handleConfigUpdate('contractAddress', e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div>
              <Label>Function Name</Label>
              <Input
                value={node.data.config.functionName}
                onChange={(e) => handleConfigUpdate('functionName', e.target.value)}
                placeholder="transfer"
              />
            </div>

            <div>
              <Label>Parameters (JSON)</Label>
              <textarea
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                value={JSON.stringify(node.data.config.parameters || [])}
                onChange={(e) => {
                  try {
                    const params = JSON.parse(e.target.value);
                    handleConfigUpdate('parameters', params);
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='["param1", "param2"]'
              />
            </div>
          </div>
        );

      case 'balance-check':
        return (
          <BalanceCheckConfig
            node={node}
            onConfigUpdate={handleSelectChange}
          />
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label>Condition</Label>
              <textarea
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                value={node.data.config.condition}
                onChange={(e) => handleConfigUpdate('condition', e.target.value)}
                placeholder="amount > 100"
              />
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-gray-600">
            No configuration options for this node type.
          </p>
        );
    }
  };

  const getConnectedEdges = () => {
    if (!currentWorkflow) return [];
    return currentWorkflow.edges.filter(
      edge => edge.source === node.id || edge.target === node.id
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="w-fit">
          {node.data.type}
        </Badge>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteNode(node.id)}
        >
          <Trash2 className="h-4 w-4" />
          Delete Node
        </Button>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-[inset_0_0_0_2px_#000000]">
          <Label className="text-sm font-medium text-gray-900">Node Label</Label>
          <Input
            value={node.data.label}
            onChange={(e) => handleLabelUpdate(e.target.value)}
            placeholder="Node label"
            className="mt-2"
          />
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Settings</h4>
          {renderConfigForm()}
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Connections</h4>
          <div className="space-y-2">
            {getConnectedEdges().map((edge) => (
              <div
                key={edge.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-[inset_0_0_0_2px_#000000] hover:shadow-[inset_0_0_0_2px_#000000,-2px_2px_0_0_#000000] transition-all"
              >
                <span className="text-sm">
                  {edge.source === node.id ? 'Output' : 'Input'} connection
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteEdge(edge.id)}
                >
                  <Unlink className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {getConnectedEdges().length === 0 && (
              <p className="text-sm text-gray-600">No connections</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};