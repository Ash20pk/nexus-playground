import { useMemo } from 'react';
import { useNetworkOptions } from './useNetworkOptions';

export interface TokenOption {
  symbol: string;
  name: string;
}

export interface ChainTokensHook {
  availableTokens: TokenOption[];
  isTokenValid: (token: string) => boolean;
  getValidatedToken: (token: string) => string | null;
  defaultToken: string | null;
}

/**
 * Hook to get available tokens for a specific chain
 * Dynamically filters tokens based on what the SDK supports for that chain
 */
export const useChainTokens = (chainId: number | null): ChainTokensHook => {
  const {
    getTokenOptionsForChain,
    isTokenSupportedOnChain,
    getDefaultTokenForChain
  } = useNetworkOptions();

  const availableTokens = useMemo(() => {
    if (!chainId) return [];
    return getTokenOptionsForChain(chainId);
  }, [chainId, getTokenOptionsForChain]);

  const isTokenValid = useMemo(() => {
    return (token: string) => {
      if (!chainId || !token) return false;
      return isTokenSupportedOnChain(token, chainId);
    };
  }, [chainId, isTokenSupportedOnChain]);

  const getValidatedToken = useMemo(() => {
    return (token: string) => {
      if (!chainId) return null;
      return isTokenSupportedOnChain(token, chainId) ? token : null;
    };
  }, [chainId, isTokenSupportedOnChain]);

  const defaultToken = useMemo(() => {
    if (!chainId) return null;
    return getDefaultTokenForChain(chainId);
  }, [chainId, getDefaultTokenForChain]);

  return {
    availableTokens,
    isTokenValid,
    getValidatedToken,
    defaultToken
  };
};