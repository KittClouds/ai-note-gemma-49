
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Shield, Wifi, WifiOff } from 'lucide-react';

interface LiveStoreErrorBoundaryProps {
  children: React.ReactNode;
}

interface LiveStoreErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorType: 'module-loading' | 'initialization' | 'websocket' | 'unknown';
}

export class LiveStoreErrorBoundary extends React.Component<
  LiveStoreErrorBoundaryProps,
  LiveStoreErrorBoundaryState
> {
  constructor(props: LiveStoreErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
    };
  }

  static getDerivedStateFromError(error: Error): LiveStoreErrorBoundaryState {
    console.error('[LiveStore Error Boundary] Caught error:', error);
    
    // Determine error type based on error message
    let errorType: 'module-loading' | 'initialization' | 'websocket' | 'unknown' = 'unknown';
    
    if (error.message.includes('WebSocket') || 
        error.message.includes('wss://') ||
        error.message.includes('connection failed')) {
      errorType = 'websocket';
    } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('module')) {
      errorType = 'module-loading';
    } else if (error.message.includes('LiveStore') || 
               error.message.includes('adapter') ||
               error.message.includes('worker')) {
      errorType = 'initialization';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LiveStore Error Boundary] Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { errorType, error } = this.state;

      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>
                {errorType === 'websocket' && (
                  <>
                    The application is running in offline mode. Real-time sync is temporarily unavailable, but all your data is saved locally.
                  </>
                )}
                {errorType === 'module-loading' && (
                  <>
                    It looks like a browser extension (ad blocker or privacy tool) is preventing the app from loading properly.
                  </>
                )}
                {errorType === 'initialization' && (
                  <>
                    There was an issue initializing the application's data storage system.
                  </>
                )}
                {errorType === 'unknown' && (
                  <>
                    An unexpected error occurred while loading the application.
                  </>
                )}
              </AlertDescription>
            </Alert>

            {errorType === 'websocket' && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Offline Mode</AlertTitle>
                <AlertDescription className="space-y-2">
                  <div>• Your notes are still saved and accessible locally</div>
                  <div>• Changes will be preserved between sessions</div>
                  <div>• Sync will resume when connection is restored</div>
                </AlertDescription>
              </Alert>
            )}

            {errorType === 'module-loading' && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Possible Solutions</AlertTitle>
                <AlertDescription className="space-y-2">
                  <div>• Temporarily disable ad blockers or privacy extensions</div>
                  <div>• Add this site to your extension's allowlist</div>
                  <div>• Try opening in an incognito/private window</div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload App
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error?.stack || error?.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
