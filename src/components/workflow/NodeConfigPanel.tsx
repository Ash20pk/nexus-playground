import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Unlink, TrendingUp } from 'lucide-react';
import { WorkflowNode } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { SUPPORTED_CHAINS_IDS, SUPPORTED_TOKENS } from '@/types/workflow';
import { useNetworkOptions } from '@/hooks/useNetworkOptions';
import { useChainTokens } from '@/hooks/useChainTokens';
import { TransferPreview } from './TransferPreview';
import { SwapPreview } from './SwapPreview';
import { BridgePreview } from './BridgePreview';
import { BridgeExecutePreview } from './BridgeExecutePreview';
import { StakePreview } from './StakePreview';
import { DEFI_PROTOCOLS, getProtocolsForChain, getAllProtocolsForChain } from '@/lib/defi-config';

// Ethereum address validation utility
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

interface NodeConfigPanelProps {
  node?: WorkflowNode;
  onDeleteEdge: (edgeId: string) => void;
}

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

  // Flush pending changes and cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        // Flush any pending changes before unmount
        Object.keys(localConfig).forEach(key => {
          if (localConfig[key] !== node.data.config[key]) {
            console.log('🔄 Flushing pending balance check change on unmount:', { key, value: localConfig[key] });
            onConfigUpdate(key, localConfig[key]);
          }
        });
      }
    };
  }, [localConfig, node.data.config]);

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
            {chainOptions.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
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
            {tokenOptions.map((token) => (
              <SelectItem key={token.symbol} value={token.symbol}>
                {token.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Address</Label>
        {localConfig.address === 'fromPrevious' ? (
          <div className="flex items-center gap-2">
            <Input value={"From previous step"} disabled />
            <Button size="sm" variant="outline" onClick={() => handleSelectChange('address', '')}>
              Use custom
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={localConfig.address}
              onChange={(e) => handleSelectChange('address', e.target.value)}
              placeholder="0x..."
            />
            <Button size="sm" variant="outline" onClick={() => handleSelectChange('address', 'fromPrevious')}>
              From previous
            </Button>
          </div>
        )}
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
  const { networkType, chainOptions, tokenOptions, isTestnet } = useNetworkOptions();

  // Get dynamic tokens for different chain configurations
  const bridgeFromChainTokens = useChainTokens(node?.data.config.fromChain);
  const bridgeToChainTokens = useChainTokens(node?.data.config.toChain);
  const transferChainTokens = useChainTokens(node?.data.config.chain);
  const swapFromChainTokens = useChainTokens(node?.data.config.fromChain);
  const swapToChainTokens = useChainTokens(node?.data.config.toChain);

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

  // Flush pending changes and cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        // Flush any pending changes before unmount
        Object.keys(localConfig).forEach(key => {
          if (localConfig[key] !== node.data.config[key]) {
            console.log('🔄 Flushing pending change on unmount:', { key, value: localConfig[key] });
            handleConfigUpdate(key, localConfig[key]);
          }
        });
      }
    };
  }, [localConfig, node.data.config]);

  const handleLabelUpdate = (label: string) => {
    updateNode(node.id, { label });
  };

  const renderConfigForm = () => {
    switch (node.data.type) {
      case 'bridge':
        return (
          <div className="space-y-4">
            <div>
              <Label>From Chain</Label>
              <Select
                value={localConfig.fromChain?.toString()}
                onValueChange={(value) => {
                  const chainId = parseInt(value);
                  handleSelectChange('fromChain', chainId);

                  // Auto-select first available token for the new chain if current token is not supported
                  if (bridgeFromChainTokens.defaultToken && !bridgeFromChainTokens.isTokenValid(localConfig.token)) {
                    handleSelectChange('token', bridgeFromChainTokens.defaultToken);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chainOptions.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
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
                  {bridgeFromChainTokens.availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bridgeFromChainTokens.availableTokens.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  No tokens available for selected chain
                </p>
              )}
            </div>

            <div>
              <Label>Amount</Label>
              {localConfig.amount === 'fromPrevious' ? (
                <div className="flex items-center gap-2">
                  <Input value={"From previous step"} disabled />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', '')}>
                    Use custom
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={localConfig.amount}
                    onChange={(e) => handleSelectChange('amount', e.target.value)}
                    placeholder="Amount to bridge"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', 'fromPrevious')}>
                    From previous
                  </Button>
                </div>
              )}
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
                  {chainOptions.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bridge Preview */}
            <BridgePreview
              token={localConfig.token || ''}
              amount={localConfig.amount === 'fromPrevious' ? '1' : localConfig.amount || ''}
              fromChain={localConfig.fromChain || 137}
              toChain={localConfig.toChain || 42161}
              sourceChains={localConfig.sourceChains}
              onSimulate={(result) => {
                console.log('Bridge simulation result:', result);
              }}
            />
          </div>
        );

      case 'transfer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Chain</Label>
              <Select
                value={localConfig.chain?.toString()}
                onValueChange={(value) => {
                  const chainId = parseInt(value);
                  handleSelectChange('chain', chainId);

                  // Auto-select first available token for the new chain if current token is not supported
                  if (transferChainTokens.defaultToken && !transferChainTokens.isTokenValid(localConfig.token)) {
                    handleSelectChange('token', transferChainTokens.defaultToken);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chainOptions.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
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
                  {transferChainTokens.availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transferChainTokens.availableTokens.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  No tokens available for selected chain
                </p>
              )}
            </div>

            <div>
              <Label>Amount</Label>
              {localConfig.amount === 'fromPrevious' ? (
                <div className="flex items-center gap-2">
                  <Input value={"From previous step"} disabled />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', '')}>
                    Use custom
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={localConfig.amount}
                    onChange={(e) => handleSelectChange('amount', e.target.value)}
                    placeholder="Amount to transfer"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', 'fromPrevious')}>
                    From previous
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Recipient Address</Label>
              <Input
                value={localConfig.toAddress || ''}
                onChange={(e) => handleSelectChange('toAddress', e.target.value)}
                placeholder="0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45"
                className={localConfig.toAddress && !isValidEthereumAddress(localConfig.toAddress) ? 'border-red-500' : ''}
              />
              {localConfig.toAddress && !isValidEthereumAddress(localConfig.toAddress) && (
                <p className="text-sm text-red-500 mt-1">
                  Invalid Ethereum address format
                </p>
              )}
              {localConfig.toAddress && isValidEthereumAddress(localConfig.toAddress) && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Valid Ethereum address
                </p>
              )}
            </div>

            <div>
              <Label>Source Chains (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Leave empty for automatic source chain selection, or select specific chains to restrict funding sources
              </p>
              <div className="flex flex-wrap gap-2">
                {chainOptions.map((chain) => {
                  const isSelected = localConfig.sourceChains?.includes(chain.id) || false;
                  return (
                    <Button
                      key={chain.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentSources = localConfig.sourceChains || [];
                        const newSources = isSelected
                          ? currentSources.filter(id => id !== chain.id)
                          : [...currentSources, chain.id];
                        handleSelectChange('sourceChains', newSources.length > 0 ? newSources : undefined);
                      }}
                    >
                      {chain.name}
                    </Button>
                  );
                })}
              </div>
              {localConfig.sourceChains && localConfig.sourceChains.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  Transfer will only use funds from: {localConfig.sourceChains.map(id =>
                    chainOptions.find(c => c.id === id)?.name || id
                  ).join(', ')}
                </p>
              )}
            </div>

            {/* Transfer Preview/Simulation */}
            <TransferPreview
              token={localConfig.token}
              amount={localConfig.amount === 'fromPrevious' ? 0 : localConfig.amount}
              chainId={localConfig.chain}
              recipient={localConfig.toAddress || ''}
              sourceChains={localConfig.sourceChains}
              onSimulate={(result) => {
                console.log('Transfer simulation result:', result);
              }}
            />
          </div>
        );

      case 'swap':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Chain</Label>
                <Select
                  value={localConfig.fromChain?.toString()}
                  onValueChange={(value) => {
                    const chainId = parseInt(value);
                    handleSelectChange('fromChain', chainId);

                    // Auto-select first available token for the new from chain
                    if (swapFromChainTokens.defaultToken) {
                      handleSelectChange('fromToken', swapFromChainTokens.defaultToken);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chainOptions.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
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
                  onValueChange={(value) => {
                    const chainId = parseInt(value);
                    handleSelectChange('toChain', chainId);

                    // Auto-select first available token for the new to chain
                    if (swapToChainTokens.defaultToken) {
                      handleSelectChange('toToken', swapToChainTokens.defaultToken);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chainOptions.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {swapFromChainTokens.availableTokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {swapFromChainTokens.availableTokens.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No tokens available for selected chain
                  </p>
                )}
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
                    {swapToChainTokens.availableTokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {swapToChainTokens.availableTokens.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No tokens available for selected chain
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              {localConfig.amount === 'fromPrevious' ? (
                <div className="flex items-center gap-2">
                  <Input value={"From previous step"} disabled />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', '')}>
                    Use custom
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={localConfig.amount}
                    onChange={(e) => handleSelectChange('amount', e.target.value)}
                    placeholder="Amount to swap"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', 'fromPrevious')}>
                    From previous
                  </Button>
                </div>
              )}
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

            {/* Swap Preview */}
            <SwapPreview
              fromToken={localConfig.fromToken || ''}
              toToken={localConfig.toToken || ''}
              amount={localConfig.amount === 'fromPrevious' ? '1' : localConfig.amount || ''}
              fromChainId={localConfig.fromChain || 137}
              toChainId={localConfig.toChain || 42161}
              slippage={localConfig.slippage || 0.5}
              onSimulate={(result) => {
                console.log('Swap simulation result:', result);
              }}
            />
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
                  {chainOptions.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
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
                  {tokenOptions.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              {localConfig.amount === 'fromPrevious' ? (
                <div className="flex items-center gap-2">
                  <Input value={"From previous step"} disabled />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', '')}>
                    Use custom
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={localConfig.amount}
                    onChange={(e) => handleSelectChange('amount', e.target.value)}
                    placeholder="Amount to stake"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', 'fromPrevious')}>
                    From previous
                  </Button>
                </div>
              )}
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
                  {localConfig.chain ?
                    getAllProtocolsForChain(localConfig.chain).map((protocol) => (
                      <SelectItem key={protocol.id} value={protocol.id}>
                        <div className="flex items-center justify-between w-full bg">
                          <div className="flex items-center gap-2">
                            <span>{protocol.icon}</span>
                            <span>{protocol.name}</span>
                          </div>
                          {protocol.config.apy && (
                            <span className="text-xs text-green-600 font-medium ml-2">
                              {protocol.config.apy.estimated.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )) :
                    Object.entries(DEFI_PROTOCOLS).map(([id, protocol]) => (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center gap-2">
                          <span>{protocol.icon}</span>
                          <span>{protocol.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Simple Protocol Status - matching existing theme */}
            {localConfig.protocol && localConfig.chain && (() => {
              const availableProtocols = getProtocolsForChain(localConfig.chain);
              const isAvailable = availableProtocols.includes(localConfig.protocol);
              const protocolInfo = DEFI_PROTOCOLS[localConfig.protocol];

              if (!isAvailable) {
                return (
                  <p className="text-sm text-red-600 mt-1">
                    Protocol not available on selected chain
                  </p>
                );
              }

              return (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {protocolInfo?.name} available
                </p>
              );
            })()}

            {/* Stake Preview */}
            {localConfig.token && localConfig.amount && localConfig.chain && localConfig.protocol && (
              <StakePreview
                token={localConfig.token}
                amount={localConfig.amount === 'fromPrevious' ? '1000' : localConfig.amount || ''}
                chainId={localConfig.chain}
                protocol={localConfig.protocol as 'aave' | 'compound' | 'yearn'}
                onSimulate={(result) => {
                  console.log('Stake simulation result:', result);
                }}
              />
            )}
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
                  {chainOptions.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
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

      case 'bridge-execute':
        return (
          <div className="space-y-6">
            {/* Bridge Configuration Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Bridge Configuration
              </h4>

              <div className="grid grid-cols-2 gap-4">
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
                      {tokenOptions.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Destination Chain</Label>
                  <Select
                    value={localConfig.toChainId?.toString()}
                    onValueChange={(value) => handleSelectChange('toChainId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chainOptions.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Amount</Label>
                {localConfig.amount === 'fromPrevious' ? (
                  <div className="flex items-center gap-2">
                    <Input value={"From previous step"} disabled />
                    <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', '')}>
                      Use custom
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={localConfig.amount}
                      onChange={(e) => handleSelectChange('amount', e.target.value)}
                      placeholder="Amount to bridge"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleSelectChange('amount', 'fromPrevious')}>
                      From previous
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label>Source Chains (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Leave empty for automatic source chain selection
                </p>
                <div className="flex flex-wrap gap-2">
                  {chainOptions.map((chain) => {
                    const isSelected = localConfig.sourceChains?.includes(chain.id) || false;
                    return (
                      <Button
                        key={chain.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const currentSources = localConfig.sourceChains || [];
                          const newSources = isSelected
                            ? currentSources.filter(id => id !== chain.id)
                            : [...currentSources, chain.id];
                          handleSelectChange('sourceChains', newSources.length > 0 ? newSources : undefined);
                        }}
                      >
                        {chain.name}
                      </Button>
                    );
                  })}
                </div>
                {localConfig.sourceChains && localConfig.sourceChains.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    Will use funds from: {localConfig.sourceChains.map(id =>
                      chainOptions.find(c => c.id === id)?.name || id
                    ).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Contract Execution Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Contract Execution
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contract Address</Label>
                  <Input
                    value={localConfig.execute?.contractAddress || ''}
                    onChange={(e) => handleSelectChange('execute', {
                      ...localConfig.execute,
                      contractAddress: e.target.value
                    })}
                    placeholder="0x..."
                    className={localConfig.execute?.contractAddress && !isValidEthereumAddress(localConfig.execute.contractAddress) ? 'border-red-500' : ''}
                  />
                  {localConfig.execute?.contractAddress && !isValidEthereumAddress(localConfig.execute.contractAddress) && (
                    <p className="text-sm text-red-500 mt-1">
                      Invalid contract address format
                    </p>
                  )}
                  {localConfig.execute?.contractAddress && isValidEthereumAddress(localConfig.execute.contractAddress) && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Valid contract address
                    </p>
                  )}
                </div>

                <div>
                  <Label>Function Name</Label>
                  <Input
                    value={localConfig.execute?.functionName || ''}
                    onChange={(e) => handleSelectChange('execute', {
                      ...localConfig.execute,
                      functionName: e.target.value
                    })}
                    placeholder="stake"
                  />
                </div>
              </div>

              <div>
                <Label>Function Parameters (JSON)</Label>
                <textarea
                  className="w-full p-2 border rounded-md resize-none font-mono text-sm"
                  rows={3}
                  value={JSON.stringify(localConfig.execute?.parameters || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const params = JSON.parse(e.target.value);
                      handleSelectChange('execute', {
                        ...localConfig.execute,
                        parameters: params
                      });
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='["param1", "param2"]'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide function parameters as a JSON array
                </p>
              </div>

              <div>
                <Label>Contract ABI (JSON)</Label>
                <textarea
                  className="w-full p-2 border rounded-md resize-none font-mono text-sm"
                  rows={4}
                  value={JSON.stringify(localConfig.execute?.contractAbi || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const abi = JSON.parse(e.target.value);
                      handleSelectChange('execute', {
                        ...localConfig.execute,
                        contractAbi: abi
                      });
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='[{"name": "stake", "type": "function", "inputs": [...], "outputs": [...]}]'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contract ABI definition for the function to call
                </p>
              </div>
            </div>

            <Separator />

            {/* Advanced Options Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Advanced Options
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localConfig.waitForReceipt || false}
                      onChange={(e) => handleSelectChange('waitForReceipt', e.target.checked)}
                    />
                    Wait for Transaction Receipt
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Wait for transaction confirmation before proceeding
                  </p>
                </div>

                <div>
                  <Label>Required Confirmations</Label>
                  <Input
                    type="number"
                    value={localConfig.requiredConfirmations || 1}
                    onChange={(e) => handleSelectChange('requiredConfirmations', parseInt(e.target.value))}
                    placeholder="1"
                    min="1"
                    max="12"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of block confirmations to wait for
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!localConfig.execute?.tokenApproval}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSelectChange('execute', {
                          ...localConfig.execute,
                          tokenApproval: {
                            token: localConfig.token || 'USDC',
                            amount: localConfig.amount || '0'
                          }
                        });
                      } else {
                        const { tokenApproval, ...executeWithoutApproval } = localConfig.execute || {};
                        handleSelectChange('execute', executeWithoutApproval);
                      }
                    }}
                  />
                  Token Approval Required
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable if the contract needs token approval before execution
                </p>

                {localConfig.execute?.tokenApproval && (
                  <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200 bg-blue-50/30 p-3 rounded-r-md">
                    <div>
                      <Label>Approval Token</Label>
                      <Select
                        value={localConfig.execute.tokenApproval.token}
                        onValueChange={(value) => handleSelectChange('execute', {
                          ...localConfig.execute,
                          tokenApproval: {
                            ...localConfig.execute.tokenApproval,
                            token: value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tokenOptions.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              {token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Approval Amount</Label>
                      <Input
                        value={localConfig.execute.tokenApproval.amount}
                        onChange={(e) => handleSelectChange('execute', {
                          ...localConfig.execute,
                          tokenApproval: {
                            ...localConfig.execute.tokenApproval,
                            amount: e.target.value
                          }
                        })}
                        placeholder="Amount to approve"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bridge Execute Preview */}
            {localConfig.token && localConfig.amount && localConfig.toChainId && localConfig.execute?.contractAddress && localConfig.execute?.functionName && (
              <>
                <Separator />
                <BridgeExecutePreview
                  token={localConfig.token}
                  amount={localConfig.amount === 'fromPrevious' ? '1' : localConfig.amount || ''}
                  toChainId={localConfig.toChainId}
                  sourceChains={localConfig.sourceChains}
                  execute={{
                    contractAddress: localConfig.execute.contractAddress,
                    contractAbi: localConfig.execute.contractAbi || [],
                    functionName: localConfig.execute.functionName,
                    parameters: localConfig.execute.parameters,
                    tokenApproval: localConfig.execute.tokenApproval
                  }}
                  onSimulate={(result) => {
                    console.log('Bridge-execute simulation result:', result);
                  }}
                />
              </>
            )}
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            {node.data.type}
          </Badge>
          <Badge
            variant={isTestnet ? "secondary" : "default"}
            className={isTestnet ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}
          >
            {networkType.toUpperCase()}
          </Badge>
        </div>
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