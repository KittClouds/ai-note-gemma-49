
import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface RightSidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

const RightSidebarContext = createContext<RightSidebarContextType | null>(null);

export function useRightSidebar() {
  const context = useContext(RightSidebarContext);
  if (!context) {
    throw new Error('useRightSidebar must be used within RightSidebarProvider');
  }
  return context;
}

interface RightSidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function RightSidebarProvider({ children, defaultOpen = true }: RightSidebarProviderProps) {
  const [open, setOpen] = useState(defaultOpen);

  const toggleOpen = () => setOpen(!open);

  return (
    <RightSidebarContext.Provider value={{ open, setOpen, toggleOpen }}>
      {children}
    </RightSidebarContext.Provider>
  );
}

interface RightSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function RightSidebar({ children, className }: RightSidebarProps) {
  const { open } = useRightSidebar();
  const isMobile = useIsMobile();

  if (isMobile) {
    // On mobile, use overlay behavior
    return (
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 bg-background shadow-lg transition-transform duration-200 ease-linear",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {children}
      </div>
    );
  }

  // On desktop, use layout flow
  return (
    <div
      className={cn(
        "h-full bg-background transition-all duration-200 ease-linear flex flex-col",
        open ? "w-64" : "w-0 overflow-hidden",
        className
      )}
    >
      {open && children}
    </div>
  );
}

interface RightSidebarTriggerProps {
  className?: string;
}

export function RightSidebarTrigger({ className }: RightSidebarTriggerProps) {
  const { toggleOpen } = useRightSidebar();

  return (
    <button
      onClick={toggleOpen}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9",
        className
      )}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 2.75C8 2.47386 8.22386 2.25 8.5 2.25H13.5C13.7761 2.25 14 2.47386 14 2.75V12.25C14 12.5261 13.7761 12.75 13.5 12.75H8.5C8.22386 12.75 8 12.5261 8 12.25V2.75ZM8.5 1.25C7.67157 1.25 7 1.92157 7 2.75V12.25C7 13.0784 7.67157 13.75 8.5 13.75H13.5C14.3284 13.75 15 13.0784 15 12.25V2.75C15 1.92157 14.3284 1.25 13.5 1.25H8.5ZM2 3.75C2 3.47386 2.22386 3.25 2.5 3.25H5.5C5.77614 3.25 6 3.47386 6 3.75C6 4.02614 5.77614 4.25 5.5 4.25H2.5C2.22386 4.25 2 4.02614 2 3.75ZM2 6.75C2 6.47386 2.22386 6.25 2.5 6.25H5.5C5.77614 6.25 6 6.47386 6 6.75C6 7.02614 5.77614 7.25 5.5 7.25H2.5C2.22386 7.25 2 7.02614 2 6.75ZM2 9.75C2 9.47386 2.22386 9.25 2.5 9.25H5.5C5.77614 9.25 6 9.47386 6 9.75C6 10.0261 5.77614 10.25 5.5 10.25H2.5C2.22386 10.25 2 10.0261 2 9.75Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
      <span className="sr-only">Toggle right sidebar</span>
    </button>
  );
}
