
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash2 } from 'lucide-react';
import { KeyValueRenderer } from './field-renderers/KeyValueRenderer';
import { TagListRenderer } from './field-renderers/TagListRenderer';
import { EditableStatGroupRenderer } from './field-renderers/EditableStatGroupRenderer';
import { LongTextRenderer } from './field-renderers/LongTextRenderer';
import { TypedAttribute, ENTITY_SCHEMAS, AttributeType } from '@/types/attributes';

interface EditableAttributePanelProps {
  entity: {
    kind: string;
    label: string;
    attributes?: Record<string, any>;
  };
  typedAttributes: TypedAttribute[];
  onAttributeUpdate: (attributeName: string, value: any) => void;
  onAddAttribute?: (name: string, type: AttributeType, value: any) => void;
}

export function EditableAttributePanel({
  entity,
  typedAttributes,
  onAttributeUpdate,
  onAddAttribute
}: EditableAttributePanelProps) {
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeType, setNewAttributeType] = useState<AttributeType>('Text');
  const [showAddForm, setShowAddForm] = useState(false);

  // Get schema for the entity kind
  const entitySchema = ENTITY_SCHEMAS.find(schema => schema.kind === entity.kind);

  // Group attributes by type for better organization
  const attributeGroups = useMemo(() => {
    const groups: Record<string, TypedAttribute[]> = {
      identity: [],
      stats: [],
      relationships: [],
      other: []
    };

    typedAttributes.forEach(attr => {
      if (['level', 'class', 'race', 'alignment', 'background', 'occupation'].includes(attr.name)) {
        groups.identity.push(attr);
      } else if (['health', 'mana', 'stats', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(attr.name)) {
        groups.stats.push(attr);
      } else if (['faction', 'relationships', 'allies', 'enemies'].includes(attr.name)) {
        groups.relationships.push(attr);
      } else {
        groups.other.push(attr);
      }
    });

    return groups;
  }, [typedAttributes]);

  const renderAttributeField = (attribute: TypedAttribute) => {
    switch (attribute.type) {
      case 'ProgressBar':
        return (
          <EditableStatGroupRenderer
            key={attribute.id}
            label={attribute.name}
            stats={attribute.value}
            onChange={(newStats) => onAttributeUpdate(attribute.name, newStats)}
          />
        );
      case 'StatBlock':
        return (
          <EditableStatGroupRenderer
            key={attribute.id}
            label={attribute.name}
            stats={attribute.value}
            onChange={(newStats) => onAttributeUpdate(attribute.name, newStats)}
          />
        );
      case 'List':
        return (
          <TagListRenderer
            key={attribute.id}
            label={attribute.name}
            tags={attribute.value as string[] || []}
            onChange={(newTags) => onAttributeUpdate(attribute.name, newTags)}
          />
        );
      case 'Text':
        if (attribute.name === 'description' || attribute.name === 'background' || attribute.name === 'personality') {
          return (
            <LongTextRenderer
              key={attribute.id}
              label={attribute.name}
              text={attribute.value as string || ''}
              onChange={(newText) => onAttributeUpdate(attribute.name, newText)}
            />
          );
        }
        return (
          <KeyValueRenderer
            key={attribute.id}
            label={attribute.name}
            value={attribute.value}
            onChange={(newValue) => onAttributeUpdate(attribute.name, newValue)}
          />
        );
      default:
        return (
          <KeyValueRenderer
            key={attribute.id}
            label={attribute.name}
            value={attribute.value}
            onChange={(newValue) => onAttributeUpdate(attribute.name, newValue)}
          />
        );
    }
  };

  const renderAttributeGroup = (title: string, attributes: TypedAttribute[], colorClass: string) => {
    if (attributes.length === 0) return null;

    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className={`text-sm font-medium ${colorClass} flex items-center gap-2`}>
            {title}
            <Badge variant="outline" className="text-xs">
              {attributes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {attributes.map(renderAttributeField)}
        </CardContent>
      </Card>
    );
  };

  const handleAddAttribute = () => {
    if (!newAttributeName.trim() || !onAddAttribute) return;

    // Get default value based on type
    let defaultValue: any = '';
    switch (newAttributeType) {
      case 'Number':
        defaultValue = 0;
        break;
      case 'Boolean':
        defaultValue = false;
        break;
      case 'List':
        defaultValue = [];
        break;
      case 'ProgressBar':
        defaultValue = { current: 50, maximum: 100 };
        break;
      case 'StatBlock':
        defaultValue = { 
          strength: 10, dexterity: 10, constitution: 10,
          intelligence: 10, wisdom: 10, charisma: 10 
        };
        break;
      default:
        defaultValue = '';
    }

    onAddAttribute(newAttributeName.trim(), newAttributeType, defaultValue);
    setNewAttributeName('');
    setNewAttributeType('Text');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Entity Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold">{entity.label}</h3>
          <Badge variant="secondary">{entity.kind}</Badge>
        </div>
        {onAddAttribute && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Attribute
          </Button>
        )}
      </div>

      {/* Add Attribute Form */}
      {showAddForm && onAddAttribute && (
        <Card className="border-dashed border-primary/50">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="Attribute name"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newAttributeType} onValueChange={(value) => setNewAttributeType(value as AttributeType)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Text">Text</SelectItem>
                    <SelectItem value="Number">Number</SelectItem>
                    <SelectItem value="Boolean">Boolean</SelectItem>
                    <SelectItem value="List">List</SelectItem>
                    <SelectItem value="ProgressBar">Progress Bar</SelectItem>
                    <SelectItem value="StatBlock">Stat Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddAttribute} className="flex-1">
                <Save className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attribute Groups */}
      {renderAttributeGroup('Identity & Core', attributeGroups.identity, 'text-blue-400')}
      {renderAttributeGroup('Stats & Abilities', attributeGroups.stats, 'text-green-400')}
      {renderAttributeGroup('Relationships', attributeGroups.relationships, 'text-purple-400')}
      {renderAttributeGroup('Other Attributes', attributeGroups.other, 'text-gray-400')}

      {/* Empty State */}
      {typedAttributes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No attributes found for this entity.</p>
          <p className="text-sm mt-1">Add attributes to customize this entity.</p>
        </div>
      )}
    </div>
  );
}
