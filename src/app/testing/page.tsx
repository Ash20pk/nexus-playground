'use client';

import { TransferTester } from '@/components/transfer/TransferTester';
import { NexusSDKStatus } from '@/components/NexusSDKStatus';

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight">
                Nexus Testing Lab
              </h1>
              <p className="text-sm text-gray-700 font-semibold">
                Test SDK Features in Real-Time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* SDK Status */}
        <NexusSDKStatus />

        {/* Transfer Testing */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer Operations</h2>
          <TransferTester />
        </div>
      </div>
    </div>
  );
}