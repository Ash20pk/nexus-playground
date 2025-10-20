import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

export const WorkflowLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <Button
        size="sm"
        variant="outline"
        className="fixed bottom-8 right-8 rounded-full h-10 w-10 p-0 z-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Info className="h-5 w-5" />
      </Button>

      {/* Legend Panel */}
      {isOpen && (
        <Card className="fixed bottom-20 right-8 w-80 z-20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Connection Guide</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input Handles */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Input Handles (Left)</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Trigger (Top)</span>
                    <p className="text-xs text-gray-600">Required - Starts node execution</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-500 border-2 border-white flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Amount (Bottom)</span>
                    <p className="text-xs text-gray-600">Optional - Receives amount from previous node</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Handles */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Output Handles (Right)</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Transaction (Top)</span>
                    <p className="text-xs text-gray-600">Triggers next node execution</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Amount (Bottom)</span>
                    <p className="text-xs text-gray-600">Sends amount to next node</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Instructions */}
            <div className="pt-3 border-t border-gray-200">
              <h4 className="font-semibold text-sm mb-2">How to Connect</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Drag from output (right) to input (left)</li>
                <li>• Connect trigger outputs to trigger inputs</li>
                <li>• Connect amount outputs to amount inputs</li>
                <li>• Delete connections in Node Configuration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
