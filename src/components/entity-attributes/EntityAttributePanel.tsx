import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash2, Database, FileText, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { SimpleLayout } from './layouts/SimpleLayout';
import { CharacterSheetLayout } from './layouts/CharacterSheetLayout';
import { EditableAttributePanel } from './EditableAttributePanel';
import { ParsedConnections } from '@/utils/parsingUtils';
import { TypedAttribute, ENTITY_SCHEMAS, AttributeType } from '@/types/attributes';
import { GlobalEntity } from '@/lib/entities/globalEntityService';
import { useNotes } from '@/contexts/LiveStoreNotesContext';

interface EntityAttributePanelProps {
  connections?: ParsedConnections | null;
  noteTitle?: string;
  globalSelectedEntity?: GlobalEntity | null;
}

export function EntityAttributePanel({
  connections,
  noteTitle = 'Untitled Note',
  globalSelectedEntity
}: EntityAttributePanelProps) {
  const entities = connections?.entities || [];
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('editable');
  const [isEditing, setIsEditing] = useState(true);
  const { selectedNote, updateNoteContent } = useNotes();

  // Debug logging to see the raw entity data structure
  useEffect(() => {
    console.log('EntityAttributePanel - Raw entities:', entities);
    console.log('EntityAttributePanel - Selected entity:', selectedEntity);
    if (selectedEntity?.attributes) {
      console.log('EntityAttributePanel - Selected entity attributes:', selectedEntity.attributes);
      console.log('EntityAttributePanel - Attributes type:', typeof selectedEntity.attributes);
    }
  }, [entities, selectedEntity]);

  // Group entities by kind
  const entityGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    (Array.isArray(entities) ? entities : []).forEach(entity => {
      if (!groups[entity.kind]) {
        groups[entity.kind] = [];
      }
      groups[entity.kind].push(entity);
    });
    return groups;
  }, [entities]);

  // Auto-select entity - prioritize globalSelectedEntity, then first entity
  useEffect(() => {
    const entitiesArray = Array.isArray(entities) ? entities : [];

    if (entitiesArray.length === 0) {
      setSelectedEntity(null);
      return;
    }

    // If there's a global selected entity, try to find it in current note's entities
    if (globalSelectedEntity) {
      const matchingEntity = entitiesArray.find(entity => 
        entity.kind === globalSelectedEntity.kind && entity.label === globalSelectedEntity.label
      );
      if (matchingEntity) {
        setSelectedEntity(matchingEntity);
        return;
      }
    }

    // Fallback to first entity if no global selection or it's not in current note
    if (!selectedEntity) {
      setSelectedEntity(entitiesArray[0]);
      return;
    }

    const isCurrentEntityStillValid = entitiesArray.some(entity => 
      entity.kind === selectedEntity.kind && entity.label === selectedEntity.label
    );
    if (!isCurrentEntityStillValid) {
      setSelectedEntity(entitiesArray[0]);
    }
  }, [entities, selectedEntity, globalSelectedEntity]);

  // Convert entity attributes to typed attributes with improved parsing
  const typedAttributes = useMemo((): TypedAttribute[] => {
    if (!selectedEntity?.attributes) return [];
    console.log('Converting attributes for entity:', selectedEntity.label);
    console.log('Raw attributes:', selectedEntity.attributes);

    let parsedAttributes: Record<string, any> = {};

    // Handle different attribute formats - fix the JSON parsing issue
    if (typeof selectedEntity.attributes === 'string') {
      try {
        parsedAttributes = JSON.parse(selectedEntity.attributes);
        console.log('Parsed JSON string attributes:', parsedAttributes);
      } catch (error) {
        console.warn('Failed to parse attributes as JSON:', error);
        parsedAttributes = { text: selectedEntity.attributes };
      }
    } else if (selectedEntity.attributes && typeof selectedEntity.attributes === 'object') {
      // If it's already an object, use it directly - don't try to JSON.parse it
      parsedAttributes = selectedEntity.attributes;
      console.log('Using object attributes directly:', parsedAttributes);
    } else {
      // Handle any other cases
      console.warn('Unexpected attributes format:', selectedEntity.attributes);
      parsedAttributes = {};
    }

    const entitySchema = ENTITY_SCHEMAS.find(schema => schema.kind === selectedEntity.kind);
    const attributes: TypedAttribute[] = [];
    console.log('Found schema for kind:', selectedEntity.kind, entitySchema);

    // Convert parsed attributes to typed attributes
    Object.entries(parsedAttributes).forEach(([key, value]) => {
      const schemaAttr = entitySchema?.attributes.find(attr => attr.name === key);
      console.log(`Processing attribute ${key}:`, value, 'Schema:', schemaAttr);
      attributes.push({
        id: `entity-${key}-${Date.now()}`,
        name: key,
        type: schemaAttr?.type || 'Text',
        value: value as any,
        unit: schemaAttr?.unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Add missing schema attributes with default values
    if (entitySchema) {
      entitySchema.attributes.forEach(schemaAttr => {
        if (!attributes.find(attr => attr.name === schemaAttr.name)) {
          console.log(`Adding missing schema attribute: ${schemaAttr.name}`);
          attributes.push({
            id: `schema-${schemaAttr.name}-${Date.now()}`,
            name: schemaAttr.name,
            type: schemaAttr.type,
            value: schemaAttr.defaultValue || '',
            unit: schemaAttr.unit,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
    }

    console.log('Final typed attributes:', attributes);
    return attributes;
  }, [selectedEntity]);

  // Handle attribute updates
  const handleAttributeUpdate = (attributeName: string, value: any) => {
    if (!selectedNote || !selectedEntity) return;

    try {
      // Parse the current note content
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;

      // Find and update the entity in the note content
      const updateEntityInContent = (node: any): any => {
        if (node.type === 'entity' && 
            node.attrs?.kind === selectedEntity.kind && 
            node.attrs?.label === selectedEntity.label) {
          
          // Parse existing attributes
          let currentAttributes = {};
          if (node.attrs.attributes) {
            if (typeof node.attrs.attributes === 'string') {
              try {
                currentAttributes = JSON.parse(node.attrs.attributes);
              } catch (e) {
                currentAttributes = {};
              }
            } else {
              currentAttributes = node.attrs.attributes;
            }
          }

          // Update the attribute
          const updatedAttributes = {
            ...currentAttributes,
            [attributeName]: value
          };

          return {
            ...node,
            attrs: {
              ...node.attrs,
              attributes: updatedAttributes
            }
          };
        }

        // Recursively search in content array
        if (node.content && Array.isArray(node.content)) {
          return {
            ...node,
            content: node.content.map(updateEntityInContent)
          };
        }

        return node;
      };

      const updatedContent = updateEntityInContent(contentObj);
      const updatedContentString = JSON.stringify(updatedContent);
      
      updateNoteContent(selectedNote.id, updatedContentString);
      
      toast.success(`Updated ${attributeName} for ${selectedEntity.label}`);
    } catch (error) {
      console.error('Error updating attribute:', error);
      toast.error('Failed to update attribute');
    }
  };

  // Handle adding new attributes
  const handleAddAttribute = (name: string, type: AttributeType, value: any) => {
    if (!selectedNote || !selectedEntity) return;

    try {
      // Parse the current note content
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;

      // Find and update the entity in the note content
      const updateEntityInContent = (node: any): any => {
        if (node.type === 'entity' && 
            node.attrs?.kind === selectedEntity.kind && 
            node.attrs?.label === selectedEntity.label) {
          
          // Parse existing attributes
          let currentAttributes = {};
          if (node.attrs.attributes) {
            if (typeof node.attrs.attributes === 'string') {
              try {
                currentAttributes = JSON.parse(node.attrs.attributes);
              } catch (e) {
                currentAttributes = {};
              }
            } else {
              currentAttributes = node.attrs.attributes;
            }
          }

          // Add the new attribute
          const updatedAttributes = {
            ...currentAttributes,
            [name]: value
          };

          return {
            ...node,
            attrs: {
              ...node.attrs,
              attributes: updatedAttributes
            }
          };
        }

        // Recursively search in content array
        if (node.content && Array.isArray(node.content)) {
          return {
            ...node,
            content: node.content.map(updateEntityInContent)
          };
        }

        return node;
      };

      const updatedContent = updateEntityInContent(contentObj);
      const updatedContentString = JSON.stringify(updatedContent);
      
      updateNoteContent(selectedNote.id, updatedContentString);
      
      toast.success(`Added ${name} to ${selectedEntity.label}`);
    } catch (error) {
      console.error('Error adding attribute:', error);
      toast.error('Failed to add attribute');
    }
  };

  const renderEntityContent = () => {
    if (!selectedEntity) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-0">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Entity Selected</h3>
          <p className="text-muted-foreground">
            Select an entity from the list to view and edit its attributes
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{selectedEntity.label}</h3>
            <Badge variant="secondary">{selectedEntity.kind}</Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1"
          >
            <Edit className="h-3 w-3" />
            {isEditing ? 'View Only' : 'Edit'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editable">Edit</TabsTrigger>
            <TabsTrigger value="simple">Overview</TabsTrigger>
            <TabsTrigger value="character">Character</TabsTrigger>
          </TabsList>

          <TabsContent value="editable" className="space-y-4">
            <EditableAttributePanel
              entity={selectedEntity}
              typedAttributes={typedAttributes}
              onAttributeUpdate={handleAttributeUpdate}
              onAddAttribute={handleAddAttribute}
            />
          </TabsContent>

          <TabsContent value="simple" className="space-y-4">
            <SimpleLayout attributes={typedAttributes} onAttributeClick={() => {}} />
          </TabsContent>

          <TabsContent value="character" className="space-y-4">
            <CharacterSheetLayout attributes={typedAttributes} onAttributeClick={() => {}} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Entity Attributes</h2>
          <Badge variant="outline">
            {Array.isArray(entities) ? entities.length : 0} entities
          </Badge>
        </div>

        {/* Entity List */}
        <div className="space-y-2">
          <Label>Select Entity</Label>
          <Select 
            value={selectedEntity?.label || ''} 
            onValueChange={value => {
              const entity = (Array.isArray(entities) ? entities : []).find(e => e.label === value);
              setSelectedEntity(entity || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an entity..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(entityGroups).map(([kind, entityList]) => (
                <React.Fragment key={kind}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted">
                    {kind}
                  </div>
                  {entityList.map(entity => (
                    <SelectItem key={entity.label} value={entity.label}>
                      {entity.label}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Note Info */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Current Note:</span>
            <span className="text-muted-foreground truncate">
              {noteTitle}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderEntityContent()}
      </div>
    </div>
  );
}
