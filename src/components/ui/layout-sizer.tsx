
import React from 'react';
import { useLayoutDimensions } from '@/hooks/useLayoutDimensions';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutSizerProps {
  children: React.ReactNode;
  className?: string;
  includeConnections?: boolean;
  includeToolbar?: boolean;
  forHeader?: boolean;
  style?: React.CSSProperties;
}

export function LayoutSizer({ 
  children, 
  className = '', 
  includeConnections = false,
  includeToolbar = false,
  forHeader = false,
  style = {},
  ...props 
}: LayoutSizerProps) {
  const dimensions = useLayoutDimensions({ includeConnections, includeToolbar, forHeader });
  const isMobile = useIsMobile();

  return (
    <div 
      className={className}
      style={{
        // Only set height for non-header elements or when specifically needed
        ...(forHeader ? {} : { height: dimensions.availableHeight }),
        // Use full width since we're now using flexbox layout
        width: '100%',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
