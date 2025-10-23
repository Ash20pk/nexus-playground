import { useMemo, useCallback } from 'react';
import { useNetworkStore } from '@/store/networkStore';
import { useNexus } from '@/provider/NexusProvider';
import { SUPPORTED_CHAINS, TOKEN_METADATA } from '@avail-project/nexus-core';
import { getAvailableChains, DEFAULT_CHAINS } from '@/constants/networks';

export const useNetworkOptions = () => {
  const { networkType, isTestnet } = useNetworkStore();
  const { nexusSdk, isInitialized } = useNexus();

  // Get supported chains and tokens from the SDK if available
  const sdkSupportedData = useMemo(() => {
    if (!isInitialized || !nexusSdk) {
      console.log('🔌 SDK not initialized yet');
      return null;
    }

    try {
      // Use SDK's method to get supported chains and tokens
      const supportedData = nexusSdk.getSwapSupportedChainsAndTokens();
      console.log('🔌 SDK supported data:', supportedData);
      return supportedData;
    } catch (error) {
      console.warn('Failed to get supported chains from SDK:', error);
      return null;
    }
  }, [nexusSdk, isInitialized]);

  const chains = useMemo(() => {
    // Prioritize SDK supported chains data
    if (sdkSupportedData && Array.isArray(sdkSupportedData) && sdkSupportedData.length > 0) {
      console.log('🔗 Using SDK supported chains:', sdkSupportedData);
      // Convert SDK format to internal format
      const chainMap: Record<string, any> = {};
      sdkSupportedData.forEach((chainData: any) => {
        // Convert tokens from objects to symbols if needed
        const supportedTokens = chainData.tokens ? chainData.tokens.map((token: any) => {
          if (typeof token === 'string') {
            return token;
          } else if (token && token.symbol) {
            return token.symbol;
          }
          return null;
        }).filter(Boolean) : [];

        chainMap[chainData.id] = {
          id: chainData.id,
          name: chainData.name,
          logo: chainData.logo,
          nativeCurrency: {
            symbol: chainData.nativeCurrency?.symbol || 'ETH',
            name: chainData.nativeCurrency?.name || 'Ethereum',
            decimals: chainData.nativeCurrency?.decimals || 18
          },
          supportedTokens
        };
      });
      return chainMap;
    }
    console.log('🔗 Using fallback chains for testnet:', isTestnet());
    return getAvailableChains(isTestnet());
  }, [sdkSupportedData, isTestnet]);

  const tokens = useMemo(() => {
    // Extract all unique tokens from SDK supported chains
    if (sdkSupportedData && Array.isArray(sdkSupportedData) && sdkSupportedData.length > 0) {
      const allTokens = new Set<string>();
      sdkSupportedData.forEach((chainData: any) => {
        if (chainData.tokens && Array.isArray(chainData.tokens)) {
          chainData.tokens.forEach((token: any) => {
            // Handle both string tokens and object tokens
            if (typeof token === 'string') {
              allTokens.add(token);
            } else if (token && token.symbol) {
              allTokens.add(token.symbol);
            }
          });
        }
      });
      const tokenArray = Array.from(allTokens);
      console.log('📋 Using SDK extracted tokens:', tokenArray);
      return tokenArray;
    }
    console.log('📋 Using fallback tokens from TOKEN_METADATA:', TOKEN_METADATA);
    // Extract token symbols from TOKEN_METADATA
    return Object.keys(TOKEN_METADATA);
  }, [sdkSupportedData]);

  const defaultChains = useMemo(() => {
    return isTestnet() ? DEFAULT_CHAINS.testnet : DEFAULT_CHAINS.mainnet;
  }, [isTestnet]);

  // Convert chains object to array format for dropdowns
  const chainOptions = useMemo(() => {
    // Handle SDK supported data directly (array format)
    if (sdkSupportedData && Array.isArray(sdkSupportedData) && sdkSupportedData.length > 0) {
      return sdkSupportedData.map((chainData: any) => {
        // Convert tokens from objects to symbols if needed
        const supportedTokens = chainData.tokens ? chainData.tokens.map((token: any) => {
          if (typeof token === 'string') {
            return token;
          } else if (token && token.symbol) {
            return token.symbol;
          }
          return null;
        }).filter(Boolean) : [];

        return {
          id: chainData.id,
          name: chainData.name,
          symbol: chainData.nativeCurrency?.symbol || 'ETH',
          logo: chainData.logo,
          supportedTokens
        };
      });
    }

    // Fallback to local constants format
    return Object.values(chains).map((chain: any) => ({
      id: chain.id,
      name: chain.name,
      symbol: chain.nativeCurrency.symbol,
      logo: chain.logo,
      supportedTokens: chain.supportedTokens || []
    }));
  }, [chains, sdkSupportedData]);

  // Token options for dropdowns
  const tokenOptions = useMemo(() => {
    if (!tokens || !Array.isArray(tokens)) {
      console.warn('⚠️ Tokens is not an array:', tokens);
      return [];
    }
    return tokens.map(token => ({
      symbol: token,
      name: token // Could be expanded with full names
    }));
  }, [tokens]);

  // Function to get supported tokens for a specific chain
  const getSupportedTokensForChain = useCallback((chainId: number): string[] => {
    if (sdkSupportedData && Array.isArray(sdkSupportedData)) {
      const chainData = sdkSupportedData.find((chain: any) => chain.id === chainId);
      const chainTokensRaw = chainData?.tokens || [];

      // Convert token objects to symbols
      const chainTokens = chainTokensRaw.map((token: any) => {
        if (typeof token === 'string') {
          return token;
        } else if (token && token.symbol) {
          return token.symbol;
        }
        return null;
      }).filter(Boolean);

      console.log(`🔍 Chain ${chainId} (${chainData?.name}) supports tokens:`, chainTokens);
      return chainTokens;
    }
    // Fallback: return all tokens (not ideal but better than nothing)
    console.log(`⚠️ No SDK data for chain ${chainId}, returning all tokens`);
    return tokens;
  }, [sdkSupportedData, tokens]);

  // Function to check if a token is supported on a specific chain
  const isTokenSupportedOnChain = useCallback((token: string, chainId: number): boolean => {
    const supportedTokens = getSupportedTokensForChain(chainId);
    const isSupported = supportedTokens.includes(token);
    console.log(`🔍 Token ${token} on chain ${chainId}: ${isSupported ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
    return isSupported;
  }, [getSupportedTokensForChain]);

  // Function to get token options for a specific chain (formatted for dropdowns)
  const getTokenOptionsForChain = useCallback((chainId: number) => {
    const chainTokens = getSupportedTokensForChain(chainId);
    return chainTokens.map(token => ({
      symbol: token,
      name: token // Could be expanded with full names
    }));
  }, [getSupportedTokensForChain]);

  // Function to get the first supported token for a chain (useful for defaults)
  const getDefaultTokenForChain = useCallback((chainId: number): string | null => {
    const chainTokens = getSupportedTokensForChain(chainId);
    return chainTokens.length > 0 ? chainTokens[0] : null;
  }, [getSupportedTokensForChain]);

  return {
    networkType,
    isTestnet: isTestnet(),
    chains,
    tokens,
    defaultChains,
    chainOptions,
    tokenOptions,
    getSupportedTokensForChain,
    isTokenSupportedOnChain,
    getTokenOptionsForChain,
    getDefaultTokenForChain,
    sdkSupportedData
  };
};