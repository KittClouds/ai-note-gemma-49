
import React from 'react';
import { EntityLayoutSchema } from '@/types/layoutSchemas';
import { TypedAttribute } from '@/types/attributes';
import { SectionCard } from './sections/SectionCard';

interface FactSheetProps {
  entity: {
    kind: string;
    label: string;
    attributes?: Record<string, any>;
  };
  layoutSchema: EntityLayoutSchema;
  typedAttributes: TypedAttribute[];
  onAttributeUpdate?: (attributeName: string, value: any) => void;
}

export function FactSheet({ 
  entity, 
  layoutSchema, 
  typedAttributes,
  onAttributeUpdate 
}: FactSheetProps) {
  // Convert typed attributes to a lookup map
  const attributeMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (Array.isArray(typedAttributes)) {
      typedAttributes.forEach(attr => {
        map[attr.name] = attr.value;
      });
    }
    return map;
  }, [typedAttributes]);

  // Ensure layout is an array before mapping
  const layoutSections = React.useMemo(() => {
    if (!layoutSchema?.layout || !Array.isArray(layoutSchema.layout)) {
      return [];
    }
    return layoutSchema.layout;
  }, [layoutSchema]);

  return (
    <div className="space-y-6">
      {/* Entity Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {entity.label.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{entity.label}</h2>
          <p className="text-sm text-muted-foreground">{entity.kind}</p>
        </div>
      </div>

      {/* Layout Sections */}
      {layoutSections.map((section, index) => (
        <SectionCard
          key={section.title}
          section={section}
          entityData={attributeMap}
          onAttributeUpdate={onAttributeUpdate}
        />
      ))}
    </div>
  );
}
