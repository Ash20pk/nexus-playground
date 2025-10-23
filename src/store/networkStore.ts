import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type NetworkType = 'testnet' | 'mainnet';

interface NetworkState {
  networkType: NetworkType;
  setNetworkType: (type: NetworkType) => void;
  isTestnet: () => boolean;
  isMainnet: () => boolean;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      networkType: 'testnet', // Default to testnet

      setNetworkType: (type: NetworkType) => {
        set({ networkType: type });
      },

      isTestnet: () => get().networkType === 'testnet',

      isMainnet: () => get().networkType === 'mainnet',
    }),
    {
      name: 'nexus-network-settings',
    }
  )
);