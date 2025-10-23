'use client';

import React from 'react';
import { useNexus } from '@/provider/NexusProvider';
import { useNetworkStore } from '@/store/networkStore';

export const NexusSDKStatus: React.FC = () => {
  const {
    nexusSdk,
    isInitialized,
    isInitializing,
    initializationError,
    retryInitialization
  } = useNexus();
  const { networkType } = useNetworkStore();

  const getStatusColor = () => {
    if (initializationError) return 'text-red-500';
    if (isInitializing) return 'text-yellow-500';
    if (isInitialized) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (initializationError) return 'Error';
    if (isInitializing) return 'Initializing...';
    if (isInitialized) return 'Ready';
    return 'Not Initialized';
  };

  const getStatusIcon = () => {
    if (initializationError) return '❌';
    if (isInitializing) return '⏳';
    if (isInitialized) return '✅';
    return '⚪';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Nexus SDK Status
      </h3>

      <div className="space-y-3">
        {/* Main Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:
          </span>
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            <span>{getStatusIcon()}</span>
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </div>

        {/* Network */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Network:
          </span>
          <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            {networkType}
          </span>
        </div>

        {/* SDK Instance */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            SDK Instance:
          </span>
          <span className={`text-sm ${nexusSdk ? 'text-green-600' : 'text-gray-500'}`}>
            {nexusSdk ? 'Created' : 'None'}
          </span>
        </div>

        {/* Error Display */}
        {initializationError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <div className="flex items-start">
              <span className="text-red-500 mr-2">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Initialization Failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {initializationError}
                </p>
              </div>
            </div>
            <button
              onClick={retryInitialization}
              className="mt-2 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Retry Initialization
            </button>
          </div>
        )}

        {/* Loading State */}
        {isInitializing && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Setting up SDK for {networkType} network...
              </span>
            </div>
          </div>
        )}

        {/* Success State */}
        {isInitialized && nexusSdk && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">🎉</span>
                <span className="text-sm text-green-800 dark:text-green-200">
                  SDK is ready for {networkType} operations
                </span>
              </div>

              {/* Quick Info */}
              <div className="text-xs text-green-600 dark:text-green-300">
                <div>• Cross-chain operations enabled</div>
                <div>• Chain abstraction active</div>
                <div>• Event hooks configured</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Debug Info
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
            {JSON.stringify({
              isInitialized,
              isInitializing,
              hasSDK: !!nexusSdk,
              networkType,
              error: initializationError,
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};