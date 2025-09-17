
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Loader2, Shield, RefreshCw } from 'lucide-react';
import { useBrowserCompatibility } from '@/hooks/useBrowserCompatibility';

interface EnhancedLoadingScreenProps {
  stage: { stage: string };
}

export const EnhancedLoadingScreen: React.FC<EnhancedLoadingScreenProps> = ({ stage }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false);
  const compatibility = useBrowserCompatibility();

  useEffect(() => {
    // Simulate loading progress based on stage
    const stageProgress: Record<string, number> = {
      'initializing': 10,
      'loading-schema': 30,
      'connecting-worker': 50,
      'syncing': 70,
      'ready': 100,
    };

    const progress = stageProgress[stage.stage] || 20;
    setLoadingProgress(progress);

    // Show compatibility warning after 5 seconds if still loading
    const timer = setTimeout(() => {
      if (progress < 100) {
        setShowCompatibilityWarning(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [stage.stage]);

  useEffect(() => {
    // Show warning immediately if ad blocker detected
    if (compatibility.hasAdBlocker && !compatibility.isChecking) {
      setShowCompatibilityWarning(true);
    }
  }, [compatibility]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md w-full px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4">
          <Loader2 className="h-12 w-12" />
        </div>
        
        <div className="text-lg font-medium text-foreground mb-2">
          Loading LiveStore
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          {stage.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>

        <Progress value={loadingProgress} className="w-full mb-6" />

        {showCompatibilityWarning && (
          <div className="space-y-4 mt-6">
            {compatibility.hasAdBlocker && (
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertTitle>Browser Extension Detected</AlertTitle>
                <AlertDescription>
                  An ad blocker or privacy extension may be preventing the app from loading.
                </AlertDescription>
              </Alert>
            )}

            {!compatibility.canLoadModules && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Loading Issues</AlertTitle>
                <AlertDescription className="space-y-2">
                  <div>If the app doesn't load soon, try:</div>
                  <div>• Disabling browser extensions temporarily</div>
                  <div>• Using an incognito/private window</div>
                  <div>• Refreshing the page</div>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleReload} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-muted-foreground">
            Stage: {stage.stage} | Progress: {loadingProgress}%
          </div>
        )}
      </div>
    </div>
  );
};
