import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNetworkStore } from '@/store/networkStore';
import { Globe, TestTube } from 'lucide-react';

export const NetworkToggle: React.FC = () => {
  const { networkType, setNetworkType, isMainnet } = useNetworkStore();

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
        aria-label="Toggle between testnet and mainnet"
        className="border-l border-gray-200"
      />

      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Mainnet</span>
      </div>

      <Badge
        variant={isMainnet() ? "default" : "secondary"}
        className={isMainnet() ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
      >
        {networkType.toUpperCase()}
      </Badge>
    </div>
  );
};