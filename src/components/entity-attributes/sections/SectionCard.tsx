
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutSection } from '@/types/layoutSchemas';
import { KeyValueRenderer } from '../field-renderers/KeyValueRenderer';
import { TagListRenderer } from '../field-renderers/TagListRenderer';
import { StatGroupRenderer } from '../field-renderers/StatGroupRenderer';
import { RelationshipListRenderer } from '../field-renderers/RelationshipListRenderer';
import { LongTextRenderer } from '../field-renderers/LongTextRenderer';
import * as Icons from 'lucide-react';

interface SectionCardProps {
  section: LayoutSection;
  entityData: Record<string, any>;
  onAttributeUpdate?: (attributeName: string, value: any) => void;
}

export function SectionCard({ section, entityData, onAttributeUpdate }: SectionCardProps) {
  const IconComponent = Icons[section.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
  
  // Define border colors based on section type
  const borderColorMap = {
    identity: 'hsl(200, 100%, 50%)',
    interactions: 'hsl(280, 100%, 70%)', 
    progression: 'hsl(330, 100%, 70%)',
    general: 'hsl(210, 20%, 70%)'
  };

  const renderField = (field: any) => {
    const value = entityData[field.attribute];
    
    switch (field.display) {
      case 'key-value':
        return (
          <KeyValueRenderer
            key={field.attribute}
            label={field.label}
            value={value}
            onChange={(newValue) => onAttributeUpdate?.(field.attribute, newValue)}
          />
        );
      case 'tag-list':
        return (
          <TagListRenderer
            key={field.attribute}
            label={field.label}
            tags={value || []}
            onChange={(newTags) => onAttributeUpdate?.(field.attribute, newTags)}
          />
        );
      case 'stat-group':
        return (
          <StatGroupRenderer
            key={field.attribute}
            label={field.label}
            stats={value}
            onChange={(newStats) => onAttributeUpdate?.(field.attribute, newStats)}
          />
        );
      case 'relationship-list':
        return (
          <RelationshipListRenderer
            key={field.attribute}
            label={field.label}
            relationships={value || []}
            icon={field.options?.icon}
            onChange={(newRelationships) => onAttributeUpdate?.(field.attribute, newRelationships)}
          />
        );
      case 'long-text':
        return (
          <LongTextRenderer
            key={field.attribute}
            label={field.label}
            text={value || ''}
            onChange={(newText) => onAttributeUpdate?.(field.attribute, newText)}
          />
        );
      default:
        return (
          <KeyValueRenderer
            key={field.attribute}
            label={field.label}
            value={value}
            onChange={(newValue) => onAttributeUpdate?.(field.attribute, newValue)}
          />
        );
    }
  };

  // Ensure fields is an array before mapping
  const sectionFields = React.useMemo(() => {
    if (!section.fields || !Array.isArray(section.fields)) {
      return [];
    }
    return section.fields;
  }, [section.fields]);

  return (
    <Card 
      className="bg-card/50 backdrop-blur-sm"
      style={{ 
        borderColor: borderColorMap[section.color],
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4" />}
          <Badge 
            variant="outline" 
            className="text-xs font-medium"
            style={{ borderColor: borderColorMap[section.color] }}
          >
            {section.title}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sectionFields.map(renderField)}
      </CardContent>
    </Card>
  );
}
