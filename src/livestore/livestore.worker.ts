
import { makeWorker } from '@livestore/adapter-web/worker';
import { schema } from './schema';

try {
  console.log('[LiveStore Worker] Initializing worker in local-only mode...');
  
  makeWorker({
    schema,
    // Sync configuration is intentionally omitted to run in local-only mode
    // This prevents WebSocket connection attempts that were causing errors
    // sync: {
    //   backend: makeSomeSyncBackend({ url: import.meta.env.VITE_LIVESTORE_SYNC_URL }),
    //   initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
    // },
  });
  
  console.log('[LiveStore Worker] Worker initialized successfully in local-only mode');
} catch (error) {
  console.error('[LiveStore Worker] Failed to initialize worker:', error);
  
  // Handle specific error types
  if (error instanceof Error) {
    if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.warn('[LiveStore Worker] Module blocked by browser extension');
    } else if (error.message.includes('eventlog')) {
      console.warn('[LiveStore Worker] Event logging module blocked');
    } else if (error.message.includes('WebSocket')) {
      console.warn('[LiveStore Worker] WebSocket connection blocked or failed');
    }
  }
  
  // Post error message back to main thread
  if (typeof self !== 'undefined' && self.postMessage) {
    self.postMessage({
      type: 'WORKER_ERROR',
      error: error instanceof Error ? error.message : 'Unknown worker error'
    });
  }
}
