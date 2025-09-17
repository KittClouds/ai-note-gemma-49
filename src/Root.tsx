
import React, { useEffect } from 'react';
import { makePersistedAdapter } from '@livestore/adapter-web';
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker';
import { LiveStoreProvider } from '@livestore/react';
import { batchUpdates, getBatchingInfo } from './utils/reactCompat';
import App from './App';
import LiveStoreWorker from './livestore/livestore.worker?worker';
import { schema } from './livestore/schema';
import { LiveStoreErrorBoundary } from './components/LiveStoreErrorBoundary';
import { EnhancedLoadingScreen } from './components/EnhancedLoadingScreen';
import { debugWasmRequest } from './utils/wasmUtils';

const storeId = 'notes-app-store';

// Enhanced adapter configuration with sync disabled to prevent WebSocket errors
const createAdapter = () => {
  try {
    console.log('[Root] Creating LiveStore adapter in local-only mode...');
    
    // Create adapter without sync configuration to avoid WebSocket connection attempts
    const adapter = makePersistedAdapter({
      storage: { type: 'opfs' },
      worker: LiveStoreWorker,
      sharedWorker: LiveStoreSharedWorker,
      // Sync is intentionally omitted to run in local-only mode
      // This prevents WebSocket connection attempts that were causing errors
    });

    console.log('[Root] LiveStore adapter created successfully in local-only mode');
    return adapter;
  } catch (error) {
    console.error('[Root] Failed to create LiveStore adapter:', error);
    
    // Enhanced error analysis for WASM issues
    if (error instanceof Error) {
      if (error.message.includes('magic word') || error.message.includes('WebAssembly')) {
        console.error('[Root] WASM loading issue detected. This may be due to:');
        console.error('1. Incorrect MIME type for .wasm files');
        console.error('2. Server returning HTML instead of binary WASM');
        console.error('3. Corrupted WASM files');
        console.error('4. Missing Cross-Origin headers');
        
        // Try to debug potential WASM requests
        setTimeout(() => {
          const potentialWasmUrls = [
            '/node_modules/@livestore/wa-sqlite/dist/wa-sqlite.wasm',
            '/node_modules/@livestore/wa-sqlite/wa-sqlite.wasm',
            './wa-sqlite.wasm'
          ];
          
          potentialWasmUrls.forEach(url => {
            debugWasmRequest(url).catch(console.error);
          });
        }, 1000);
      } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        throw new Error('LiveStore modules blocked by browser extension. Please disable ad blockers or privacy extensions.');
      } else if (error.message.includes('worker')) {
        throw new Error('LiveStore worker initialization failed. This may be due to browser security settings.');
      }
    }
    
    throw new Error(`LiveStore adapter creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create adapter with error handling
let adapter: ReturnType<typeof makePersistedAdapter>;
try {
  adapter = createAdapter();
} catch (error) {
  console.error('[Root] Adapter creation failed, will be handled by error boundary:', error);
  // Let the error boundary handle this
  throw error;
}

// Log batching info for debugging
console.log('[Root] Batching configuration:', getBatchingInfo());

export const Root: React.FC = () => {
  useEffect(() => {
    // Enhanced error listener for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[Root] Unhandled promise rejection:', event.reason);
      
      // Check for LiveStore related errors
      if (event.reason && typeof event.reason === 'object') {
        const message = event.reason.message || '';
        if (message.includes('LiveStore') || 
            message.includes('ERR_BLOCKED_BY_CLIENT') ||
            message.includes('eventlog') ||
            message.includes('@livestore') ||
            message.includes('WebAssembly') ||
            message.includes('WebSocket') ||
            message.includes('magic word')) {
          console.error('[Root] LiveStore/WASM/WebSocket related issue detected:', message);
        }
      }
    };

    // Enhanced error listener for general errors
    const handleError = (event: ErrorEvent) => {
      console.error('[Root] Global error:', event.error);
      
      if (event.error && event.error.message) {
        const message = event.error.message;
        if (message.includes('ERR_BLOCKED_BY_CLIENT') || 
            message.includes('@livestore') ||
            message.includes('eventlog') ||
            message.includes('WebAssembly') ||
            message.includes('WebSocket') ||
            message.includes('magic word')) {
          console.error('[Root] LiveStore/WASM/WebSocket related error detected');
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <LiveStoreErrorBoundary>
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        renderLoading={(stage) => <EnhancedLoadingScreen stage={stage} />}
        batchUpdates={batchUpdates}
        storeId={storeId}
      >
        <App />
      </LiveStoreProvider>
    </LiveStoreErrorBoundary>
  );
};
