import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GlobalEntity } from '@/lib/entities/globalEntityService';

interface EntitySelectionContextType {
  selectedEntity: GlobalEntity | null;
  setSelectedEntity: (entity: GlobalEntity | null) => void;
}

const EntitySelectionContext = createContext<EntitySelectionContextType | undefined>(undefined);

export function EntitySelectionProvider({ children }: { children: ReactNode }) {
  const [selectedEntity, setSelectedEntity] = useState<GlobalEntity | null>(null);

  return (
    <EntitySelectionContext.Provider value={{ selectedEntity, setSelectedEntity }}>
      {children}
    </EntitySelectionContext.Provider>
  );
}

export function useEntitySelection() {
  const context = useContext(EntitySelectionContext);
  if (context === undefined) {
    throw new Error('useEntitySelection must be used within an EntitySelectionProvider');
  }
  return context;
}