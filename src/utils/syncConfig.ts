
// Configuration for LiveStore sync behavior
export interface SyncConfig {
  enabled: boolean;
  url?: string;
  timeout: number;
  retryAttempts: number;
}

// Default configuration - sync disabled to prevent WebSocket errors
export const defaultSyncConfig: SyncConfig = {
  enabled: false, // Disabled by default to run in local-only mode
  timeout: 5000,
  retryAttempts: 3,
};

// Get sync configuration from environment variables or defaults
export const getSyncConfig = (): SyncConfig => {
  return {
    enabled: import.meta.env.VITE_LIVESTORE_SYNC_ENABLED === 'true' || false,
    url: import.meta.env.VITE_LIVESTORE_SYNC_URL,
    timeout: parseInt(import.meta.env.VITE_LIVESTORE_SYNC_TIMEOUT || '5000'),
    retryAttempts: parseInt(import.meta.env.VITE_LIVESTORE_SYNC_RETRIES || '3'),
  };
};

// Check if sync should be enabled based on environment and configuration
export const shouldEnableSync = (): boolean => {
  const config = getSyncConfig();
  return config.enabled && !!config.url;
};

// Log current sync configuration
export const logSyncConfig = (): void => {
  const config = getSyncConfig();
  console.log('[Sync Config]', {
    enabled: config.enabled,
    hasUrl: !!config.url,
    timeout: config.timeout,
    retryAttempts: config.retryAttempts,
  });
};
