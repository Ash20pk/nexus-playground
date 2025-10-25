'use client';

import { useEffect } from 'react';
import { setupConsoleInterceptor } from '@/lib/console-interceptor';

/**
 * Client component to initialize console error interceptor
 * This downgrades known non-blocking errors to warnings
 */
export function ConsoleInterceptor() {
  useEffect(() => {
    setupConsoleInterceptor();
  }, []);

  return null;
}
