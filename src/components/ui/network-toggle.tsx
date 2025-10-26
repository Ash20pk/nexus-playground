import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNetworkStore } from '@/store/networkStore';
import { useNexus } from '@/provider/NexusProvider';
import { Globe, TestTube, Loader2 } from 'lucide-react';

export const NetworkToggle: React.FC = () => {
  const { networkType, setNetworkType, isMainnet } = useNetworkStore();
  const { isInitializing } = useNexus();

  const handleToggle = (checked: boolean) => {
    setNetworkType(checked ? 'mainnet' : 'testnet');
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <TestTube className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Testnet</span>
      </div>

      <Switch
        checked={isMainnet()}
        onCheckedChange={handleToggle}
        disabled={isInitializing}
        aria-label="Toggle between testnet and mainnet"
        className="border-l border-gray-200"
      />

      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Mainnet</span>
      </div>

      <Badge
        variant={isMainnet() ? "default" : "secondary"}
        className={`${isMainnet() ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"} ${isInitializing ? "opacity-75" : ""}`}
      >
        <div className="flex items-center gap-1">
          {isInitializing && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {networkType.toUpperCase()}
        </div>
      </Badge>
    </div>
  );
};