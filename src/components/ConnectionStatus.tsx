
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'local-only'>('local-only');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Since we're running in local-only mode, set status accordingly
    setSyncStatus('local-only');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusInfo = () => {
    if (syncStatus === 'local-only') {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        text: 'Local Only',
        variant: 'secondary' as const,
        tooltip: 'Running in local-only mode. All data is saved locally and will persist between sessions.'
      };
    }
    
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: 'Offline',
        variant: 'destructive' as const,
        tooltip: 'No internet connection. Working offline.'
      };
    }

    return {
      icon: <Wifi className="h-3 w-3" />,
      text: 'Online',
      variant: 'default' as const,
      tooltip: 'Connected and ready to sync.'
    };
  };

  const status = getStatusInfo();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={status.variant} className={`flex items-center gap-1 ${className}`}>
            {status.icon}
            <span className="text-xs">{status.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
