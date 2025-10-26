"use client";

import {
  EthereumProvider,
  NexusSDK,
  OnAllowanceHookData,
  OnIntentHookData,
} from "@avail-project/nexus-core";
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useCallback,
  SetStateAction,
  Dispatch,
  useRef,
} from "react";
import { useAccount, useConfig } from "wagmi";
import { useNetworkStore } from "@/store/networkStore";

interface NexusContextType {
  nexusSdk: NexusSDK | undefined;
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: string | null;
  allowanceModal: OnAllowanceHookData | null;
  setAllowanceModal: Dispatch<SetStateAction<OnAllowanceHookData | null>>;
  intentModal: OnIntentHookData | null;
  setIntentModal: Dispatch<SetStateAction<OnIntentHookData | null>>;
  cleanupSDK: () => void;
  retryInitialization: () => void;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

interface NexusProviderProps {
  children: ReactNode;
  isConnected: boolean;
}

export const NexusProvider: React.FC<NexusProviderProps> = ({
  children,
  isConnected,
}) => {
  const [nexusSdk, setNexusSdk] = useState<NexusSDK | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [allowanceModal, setAllowanceModal] =
    useState<OnAllowanceHookData | null>(null);
  const [intentModal, setIntentModal] = useState<OnIntentHookData | null>(null);

  // Track the network type that the SDK was initialized with
  const initializedNetworkType = useRef<string | null>(null);
  // Track if we're currently cleaning up to prevent re-initialization
  const isCleaningUp = useRef<boolean>(false);
  // Debounce network changes to prevent rapid reinitializations
  const networkChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  const { connector } = useAccount();
  const config = useConfig();
  const { networkType } = useNetworkStore();

  // Helper function to detect and validate provider
  const getEIP1193Provider = useCallback(async (): Promise<EthereumProvider> => {
    let provider: EthereumProvider | undefined;

    // Strategy 1: Try window.ethereum first (most reliable for browser wallets)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const windowProvider = (window as any).ethereum as EthereumProvider;
      if (typeof windowProvider.request === 'function') {
        provider = windowProvider;
        console.log('🔌 Using window.ethereum provider');
      }
    }

    // Strategy 2: Try wagmi connector if window.ethereum not available
    if (!provider && connector) {
      try {
        if (typeof (connector as any).getProvider === 'function') {
          const connectorProvider = await (connector as any).getProvider();
          if (connectorProvider && typeof connectorProvider.request === 'function') {
            provider = connectorProvider as EthereumProvider;
            console.log('🔌 Using wagmi connector provider');
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to get provider from connector:', error);
      }
    }

    // Validate provider has required EIP-1193 methods
    if (!provider || typeof provider.request !== 'function') {
      throw new Error("No EIP-1193 compatible provider found. Please ensure your wallet is connected properly.");
    }

    return provider;
  }, [connector]);

  // Main initialization function following documentation best practices
  const initializeSDK = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializing || isCleaningUp.current) {
      console.log('🔍 Skipping initialization - already in progress or cleaning up');
      return;
    }

    console.log('🔍 Starting SDK initialization:', {
      isConnected,
      hasSDK: !!nexusSdk,
      hasConnector: !!connector,
      networkType,
      isInitializing,
      isCleaningUp: isCleaningUp.current
    });

    // Validate preconditions
    if (!isConnected) {
      console.log('❌ Cannot initialize - not connected to wallet');
      return;
    }

    if (!connector) {
      console.log('❌ Cannot initialize - no wallet connector available');
      setInitializationError("No wallet connector available");
      return;
    }

    if (nexusSdk) {
      console.log('🔍 SDK already exists, skipping initialization');
      return;
    }

    try {
      setIsInitializing(true);
      setInitializationError(null);
      console.log('✅ Starting SDK initialization process...');

      // Get and validate provider
      console.log('🔌 Detecting wallet provider...');
      const provider = await getEIP1193Provider();

      // Create SDK instance with appropriate network
      const isTestnet = networkType === 'testnet';
      console.log(`🏗️ Creating NexusSDK instance for ${isTestnet ? 'testnet' : 'mainnet'}...`);

      const sdk = new NexusSDK({
        network: isTestnet ? "testnet" : "mainnet",
        debug: process.env.NODE_ENV === 'development', // Only debug in development
      });

      // Initialize SDK with provider
      console.log('🔄 Initializing SDK with provider...');
      await sdk.initialize(provider);

      // SDK initialization successful
      console.log(`✅ NexusSDK initialized successfully for ${networkType} mode`);

      // Set SDK state
      setNexusSdk(sdk);
      initializedNetworkType.current = networkType;

      // Log supported chains and tokens for debugging
      if (process.env.NODE_ENV === 'development') {
        try {
          console.log("🔌 Supported chains:", sdk.utils.getSupportedChains());
          const supportedData = sdk.getSwapSupportedChainsAndTokens();
          console.log("🔌 Supported tokens data:", supportedData);
        } catch (error) {
          console.warn('⚠️ Could not log supported chains/tokens:', error);
        }
      }

      // Setup hooks for allowance and intent handling
      sdk.setOnAllowanceHook(async (data: OnAllowanceHookData) => {
        console.log('🔓 Allowance hook triggered:', data);
        setAllowanceModal(data);

        try {
          // Auto-approve with max allowances for now
          // TODO: Implement proper UI for user consent
          const allowances = data.sources.map(() => 'max');
          console.log('🔓 Auto-approving allowances with max values');
          await data.allow(allowances);
          console.log('🔓 Allowances approved successfully');
        } catch (error) {
          console.error('🔓 Error approving allowances:', error);
          data.deny();
        }
      });

      sdk.setOnIntentHook((data: OnIntentHookData) => {
        console.log('💡 Intent hook triggered:', data);
        setIntentModal(data);

        try {
          // Auto-approve intents for now
          // TODO: Implement proper UI for user consent
          console.log('💡 Auto-approving intent');
          data.allow();
          console.log('💡 Intent approved successfully');
        } catch (error) {
          console.error('💡 Error approving intent:', error);
          data.deny();
        }
      });

      // Mark as initialized
      setIsInitialized(true);
      console.log(`🎉 SDK ready for use in ${networkType} mode`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error("❌ Failed to initialize NexusSDK:", error);

      setInitializationError(errorMessage);
      setIsInitialized(false);
      setNexusSdk(undefined);
      initializedNetworkType.current = null;
    } finally {
      setIsInitializing(false);
    }
  }, [isConnected, connector, networkType, nexusSdk, isInitializing, getEIP1193Provider]);

  // Enhanced cleanup function following documentation best practices
  const cleanupSDK = useCallback(async (reason: string = 'manual') => {
    if (!nexusSdk || isCleaningUp.current) {
      return;
    }

    try {
      isCleaningUp.current = true;
      console.log(`🧹 Starting SDK cleanup (reason: ${reason})`);

      // Clear state first to prevent new operations
      setIsInitialized(false);
      setInitializationError(null);

      // Properly deinitialize SDK following documentation
      await nexusSdk.deinit();
      console.log('✅ SDK deinitialized successfully');

      // Clear all state
      setNexusSdk(undefined);
      initializedNetworkType.current = null;
      setAllowanceModal(null);
      setIntentModal(null);

      console.log(`🧹 SDK cleanup completed (reason: ${reason})`);
    } catch (error) {
      console.error('⚠️ Error during SDK cleanup:', error);
      // Force clear state even if cleanup failed
      setNexusSdk(undefined);
      setIsInitialized(false);
      initializedNetworkType.current = null;
    } finally {
      isCleaningUp.current = false;
    }
  }, [nexusSdk]);

  // Retry initialization function
  const retryInitialization = useCallback(async () => {
    console.log('🔄 Retrying SDK initialization...');
    setInitializationError(null);

    if (nexusSdk) {
      await cleanupSDK('retry');
    }

    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      initializeSDK();
    }, 100);
  }, [cleanupSDK, initializeSDK, nexusSdk]);

  // Main effect to handle SDK lifecycle with debouncing for network changes
  useEffect(() => {
    // Clear any existing timeout to debounce rapid changes
    if (networkChangeTimeout.current) {
      clearTimeout(networkChangeTimeout.current);
      networkChangeTimeout.current = null;
    }

    const handleSDKLifecycle = async () => {
      console.log('🔍 SDK lifecycle effect triggered:', {
        isConnected,
        hasSDK: !!nexusSdk,
        hasConnector: !!connector,
        networkType,
        initializedWith: initializedNetworkType.current,
        isInitializing,
        isCleaningUp: isCleaningUp.current
      });

      // Skip if already processing
      if (isInitializing || isCleaningUp.current) {
        console.log('🔍 Skipping lifecycle handling - operation in progress');
        return;
      }

      // Case 1: Wallet disconnected - cleanup SDK (immediate, no debounce)
      if (!isConnected) {
        if (nexusSdk) {
          console.log('🔌 Wallet disconnected, cleaning up SDK');
          await cleanupSDK('disconnected');
        }
        return;
      }

      // Case 2: Network changed - debounce to prevent rapid switches
      if (nexusSdk && initializedNetworkType.current !== null && initializedNetworkType.current !== networkType) {
        console.log(`🔄 Network switch detected: ${initializedNetworkType.current} → ${networkType}, debouncing...`);

        // Debounce network changes to prevent rapid reinitializations
        networkChangeTimeout.current = setTimeout(async () => {
          console.log('🔄 Processing debounced network change');
          if (nexusSdk && initializedNetworkType.current !== networkType) {
            await cleanupSDK('network_change');
            // Trigger reinitialization after cleanup
            setTimeout(() => {
              if (isConnected && !nexusSdk && connector && !isInitializing) {
                console.log(`🚀 Reinitializing SDK for ${networkType} network after network change`);
                initializeSDK();
              }
            }, 100);
          }
        }, 300); // 300ms debounce
        return;
      }

      // Case 3: Ready to initialize - all conditions met
      if (isConnected && !nexusSdk && connector && !isInitializing) {
        console.log(`🚀 Ready to initialize SDK for ${networkType} network`);
        await initializeSDK();
      }
    };

    handleSDKLifecycle().catch((error) => {
      console.error('❌ Error in SDK lifecycle handling:', error);
      setInitializationError(error instanceof Error ? error.message : 'SDK lifecycle error');
    });

    // Cleanup timeout on unmount
    return () => {
      if (networkChangeTimeout.current) {
        clearTimeout(networkChangeTimeout.current);
        networkChangeTimeout.current = null;
      }
    };
  }, [isConnected, networkType, nexusSdk, connector, isInitializing, initializeSDK, cleanupSDK]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (nexusSdk && !isCleaningUp.current) {
        console.log('🧹 Component unmounting, cleaning up SDK');
        // Use sync cleanup for unmount to avoid React warnings
        try {
          nexusSdk.deinit();
        } catch (error) {
          console.warn('⚠️ Error during unmount cleanup:', error);
        }
      }
    };
  }, [nexusSdk]);

  const contextValue: NexusContextType = useMemo(
    () => ({
      nexusSdk,
      isInitialized,
      isInitializing,
      initializationError,
      allowanceModal,
      setAllowanceModal,
      intentModal,
      setIntentModal,
      cleanupSDK,
      retryInitialization,
    }),
    [nexusSdk, isInitialized, isInitializing, initializationError, allowanceModal, intentModal, cleanupSDK, retryInitialization],
  );

  return (
    <NexusContext.Provider value={contextValue}>
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (context === undefined) {
    throw new Error("useNexus must be used within a NexusProvider");
  }
  return context;
};
