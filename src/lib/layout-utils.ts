
export interface LayoutDimensions {
  availableHeight: string;
  availableWidth: string;
  headerHeight: number;
  connectionsHeight: number;
}

export const LAYOUT_CONSTANTS = {
  HEADER_HEIGHT: 64, // Header height in px
  CONNECTIONS_PANEL_HEIGHT: 300, // Default connections panel height
  TOOLBAR_HEIGHT: 40, // Reduced toolbar height
  LEFT_SIDEBAR_WIDTH: 256, // 16rem in px
  RIGHT_SIDEBAR_WIDTH: 256, // 16rem in px
} as const;

export function calculateAvailableHeight(options: {
  includeConnections?: boolean;
  includeToolbar?: boolean;
  customOffset?: number;
  forHeader?: boolean;
} = {}): string {
  const { 
    includeConnections = false, 
    includeToolbar = false, 
    customOffset = 0,
    forHeader = false
  } = options;

  // For header, we don't need to subtract header height
  if (forHeader) {
    return '100vh';
  }

  let totalOffset = LAYOUT_CONSTANTS.HEADER_HEIGHT + customOffset;
  
  if (includeConnections) {
    totalOffset += LAYOUT_CONSTANTS.CONNECTIONS_PANEL_HEIGHT;
  }
  
  if (includeToolbar) {
    totalOffset += LAYOUT_CONSTANTS.TOOLBAR_HEIGHT;
  }

  return `calc(100vh - ${totalOffset}px)`;
}

export function calculateAvailableWidth(options: {
  leftSidebarOpen?: boolean;
  rightSidebarOpen?: boolean;
  isMobile?: boolean;
  forHeader?: boolean;
} = {}): string {
  const {
    leftSidebarOpen = true,
    rightSidebarOpen = true,
    isMobile = false,
    forHeader = false
  } = options;

  // On mobile, sidebars are overlays, so use full width
  if (isMobile) {
    return '100%';
  }

  // Since we're using flexbox layout flow, we don't need to calculate widths manually
  // The flex containers will handle the space distribution automatically
  return '100%';
}

export function getLayoutDimensions(options: {
  includeConnections?: boolean;
  includeToolbar?: boolean;
  leftSidebarOpen?: boolean;
  rightSidebarOpen?: boolean;
  isMobile?: boolean;
  forHeader?: boolean;
}): LayoutDimensions {
  return {
    availableHeight: calculateAvailableHeight(options),
    availableWidth: calculateAvailableWidth(options),
    headerHeight: LAYOUT_CONSTANTS.HEADER_HEIGHT,
    connectionsHeight: LAYOUT_CONSTANTS.CONNECTIONS_PANEL_HEIGHT,
  };
}
