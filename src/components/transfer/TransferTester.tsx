'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useNexus } from '@/provider/NexusProvider';
import { useNetworkOptions } from '@/hooks/useNetworkOptions';
import { TransferPreview } from '../workflow/TransferPreview';

export const TransferTester: React.FC = () => {
  const { nexusSdk, isInitialized } = useNexus();
  const { chainOptions, tokenOptions } = useNetworkOptions();

  const [formData, setFormData] = useState({
    token: 'USDC' as const,
    amount: '',
    chainId: 137 as number, // Default to Polygon
    recipient: '',
    sourceChains: [] as number[]
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const isValidForm = () => {
    return (
      formData.token &&
      formData.amount &&
      !isNaN(Number(formData.amount)) &&
      Number(formData.amount) > 0 &&
      formData.chainId &&
      formData.recipient &&
      formData.recipient.startsWith('0x') &&
      formData.recipient.length === 42
    );
  };

  const executeTransfer = async () => {
    if (!nexusSdk || !isInitialized || !isValidForm()) {
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      console.log('🚀 TRANSFER TESTER - Executing transfer:', formData);

      const result = await nexusSdk.transfer({
        token: formData.token,
        amount: Number(formData.amount),
        chainId: formData.chainId,
        recipient: formData.recipient as `0x${string}`,
        sourceChains: formData.sourceChains.length > 0 ? formData.sourceChains : undefined
      });

      if (result.success) {
        setExecutionResult(result);
        console.log('✅ TRANSFER TESTER - Transfer successful:', result);
      } else {
        setExecutionError(result.error);
        console.error('❌ TRANSFER TESTER - Transfer failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer execution failed';
      setExecutionError(errorMessage);
      console.error('❌ TRANSFER TESTER - Transfer error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      token: 'USDC',
      amount: '',
      chainId: 137,
      recipient: '',
      sourceChains: []
    });
    setExecutionResult(null);
    setExecutionError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Transfer Tester
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test transfer operations with real SDK execution
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isInitialized && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                SDK not initialized. Please connect your wallet and wait for SDK initialization.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Token</Label>
              <Select
                value={formData.token}
                onValueChange={(value) => setFormData(prev => ({ ...prev, token: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokenOptions.map((token) => (
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
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="10.5"
                type="number"
                step="0.000001"
              />
            </div>

            <div>
              <Label>Destination Chain</Label>
              <Select
                value={formData.chainId.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, chainId: parseInt(value) }))}
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
              <Label>Recipient Address</Label>
              <Input
                value={formData.recipient}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45"
              />
            </div>
          </div>

          {/* Source Chains Selection */}
          <div>
            <Label>Source Chains (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select specific chains to restrict funding sources, or leave empty for automatic selection
            </p>
            <div className="flex flex-wrap gap-2">
              {chainOptions.map((chain) => {
                const isSelected = formData.sourceChains.includes(chain.id);
                return (
                  <Button
                    key={chain.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        sourceChains: isSelected
                          ? prev.sourceChains.filter(id => id !== chain.id)
                          : [...prev.sourceChains, chain.id]
                      }));
                    }}
                  >
                    {chain.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={executeTransfer}
              disabled={!isValidForm() || !isInitialized || isExecuting}
              className="flex-1"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing Transfer...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Execute Transfer
                </>
              )}
            </Button>

            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>

          {/* Execution Results */}
          {executionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Transfer Failed:</strong> {executionError}
              </AlertDescription>
            </Alert>
          )}

          {executionResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>Transfer Successful!</strong></div>
                  <div className="text-sm space-y-1">
                    <div>Transaction Hash: <code className="bg-muted px-1 rounded text-xs">{executionResult.transactionHash}</code></div>
                    {executionResult.explorerUrl && (
                      <div>
                        <a
                          href={executionResult.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          View on Explorer <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transfer Preview */}
      {isValidForm() && (
        <TransferPreview
          token={formData.token}
          amount={formData.amount}
          chainId={formData.chainId}
          recipient={formData.recipient}
          sourceChains={formData.sourceChains.length > 0 ? formData.sourceChains : undefined}
        />
      )}
    </div>
  );
};