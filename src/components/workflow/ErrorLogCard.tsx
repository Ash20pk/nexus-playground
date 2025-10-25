'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Info,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorLogCardProps {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  error: {
    message: string;
    details?: string;
    timestamp: string;
    errorType?: 'validation' | 'network' | 'execution' | 'timeout' | 'unknown';
    originalError?: any;
    context?: Record<string, any>;
    suggestions?: string[];
    retryable?: boolean;
  };
  onClose: () => void;
  onRetry?: () => void;
}

const ERROR_TYPE_CONFIG = {
  validation: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
    label: 'Validation Error'
  },
  network: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Zap,
    label: 'Network Error'
  },
  execution: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: AlertCircle,
    label: 'Execution Error'
  },
  timeout: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Clock,
    label: 'Timeout Error'
  },
  unknown: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Info,
    label: 'Unknown Error'
  }
};

export const ErrorLogCard: React.FC<ErrorLogCardProps> = ({
  nodeId,
  nodeName,
  nodeType,
  error,
  onClose,
  onRetry
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawError, setShowRawError] = useState(false);

  const errorConfig = ERROR_TYPE_CONFIG[error.errorType || 'unknown'];
  const ErrorIcon = errorConfig.icon;

  const handleCopyError = async () => {
    const errorInfo = {
      nodeId,
      nodeName,
      nodeType,
      timestamp: error.timestamp,
      message: error.message,
      details: error.details,
      context: error.context,
      originalError: error.originalError
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="w-96 max-w-full border-red-200 shadow-lg bg-red-50/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div className="p-1 bg-red-100 rounded-full">
              <ErrorIcon className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-red-900">
                Node Execution Failed
              </CardTitle>
              <p className="text-xs text-red-700 mt-1">
                {nodeName} ({nodeType})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge className={cn("text-xs", errorConfig.color)}>
            {errorConfig.label}
          </Badge>
          {error.retryable && (
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
              Retryable
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Error Message */}
        <div>
          <h4 className="text-sm font-medium text-red-900 mb-1">Error Message</h4>
          <p className="text-sm text-red-800 bg-red-100/50 p-2 rounded border">
            {error.message}
          </p>
        </div>

        {/* Error Details */}
        {error.details && (
          <div>
            <h4 className="text-sm font-medium text-red-900 mb-1">Details</h4>
            <p className="text-xs text-red-700 bg-red-100/30 p-2 rounded border">
              {error.details}
            </p>
          </div>
        )}

        {/* Suggestions */}
        {error.suggestions && error.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-900 mb-1">💡 Suggestions</h4>
            <ul className="text-sm text-green-800 bg-green-100/50 p-2 rounded border space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="h-3 w-3" />
          <span>Failed at {formatTimestamp(error.timestamp)}</span>
        </div>

        {/* Expandable Technical Details */}
        {(error.context || error.originalError) && (
          <div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 p-0 text-xs text-gray-600 hover:text-gray-800"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Technical Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Technical Details
                </>
              )}
            </Button>

            {isExpanded && (
              <div className="mt-2 space-y-2">
                {/* Context Information */}
                {error.context && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-1">Context</h5>
                    <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded border overflow-x-auto">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw Error */}
                {error.originalError && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-xs font-medium text-gray-700">Raw Error</h5>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 p-0 text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => setShowRawError(!showRawError)}
                      >
                        {showRawError ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    {showRawError && (
                      <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto">
                        {typeof error.originalError === 'string'
                          ? error.originalError
                          : JSON.stringify(error.originalError, null, 2)
                        }
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-red-200">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-300 hover:bg-gray-50"
            onClick={handleCopyError}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Error
          </Button>

          {error.retryable && onRetry && (
            <Button
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onRetry}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Retry Node
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 ml-auto"
            onClick={() => window.open('https://docs.nexus.com/troubleshooting', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};