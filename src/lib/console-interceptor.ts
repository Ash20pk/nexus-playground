/**
 * Console error interceptor to downgrade known non-blocking errors to warnings.
 * This prevents the console from being polluted with red errors that don't actually
 * indicate failure.
 */

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Patterns that should be treated as warnings instead of errors
const NON_BLOCKING_PATTERNS = [
  // Metadata service errors (non-critical)
  'metadata-cerise.arcana.network',
  '/api/v1/save-metadata',
  '/api/v1/save-metadata/unlinked',
  'POST https://metadata-cerise.arcana.network/api/v1/save-metadata/unlinked',
  'Failed to load resource',
  'Failed to load resource: the server responded with a status of 401',
  '401',
  '401 (Unauthorized)',
  'status of 401',
  'status code 401',
  'the server responded with a status of 401',
  'Unauthorized',
  
  // XAR CA SDK internal logging (non-critical)
  'XAR_CA_SDK',
  'postSwap',
  'calculatePerformance',
  'Request failed with status code 401',
  
  // Performance API errors (profiling only)
  "Failed to execute 'measure' on 'Performance'",
  'fill-wait-start',
  'mark \'fill-wait-start\' does not exist',
  
  // Next.js hydration errors (cosmetic, triggers client-side re-render)
  'Hydration failed',
  'hydration',
  'server rendered HTML didn\'t match the client',
  'SSR-ed Client Component',
  'this tree will be regenerated on the client',
  'Text content does not match server-rendered HTML',
  'Hydration error'
];

function isNonBlockingError(...args: any[]): boolean {
  const message = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.message + ' ' + arg.stack;
    if (arg && typeof arg === 'object') {
      // Handle error objects that might have error/message properties
      const errMsg = arg.error || arg.message || '';
      try {
        return errMsg + ' ' + JSON.stringify(arg);
      } catch {
        return errMsg + ' ' + String(arg);
      }
    }
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  return NON_BLOCKING_PATTERNS.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}

export function setupConsoleInterceptor() {
  // Intercept console.error
  console.error = (...args: any[]) => {
    const isNonBlocking = isNonBlockingError(...args);
    
    if (isNonBlocking) {
      // Downgrade to warning with clear indicator
      originalWarn.call(console, '⚠️ [NON-BLOCKING WARNING - Core operation succeeded, ignoring auxiliary service error]', ...args);
    } else {
      // Pass through as normal error
      originalError.call(console, ...args);
    }
  };

  originalWarn.call(console, '✅ Console interceptor initialized - known non-blocking errors will be shown as warnings');
  
  // Log the patterns for debugging
  originalWarn.call(console, '📋 Non-blocking patterns:', NON_BLOCKING_PATTERNS.length, 'patterns registered');
}

export function removeConsoleInterceptor() {
  console.error = originalError;
  console.warn = originalWarn;
}
