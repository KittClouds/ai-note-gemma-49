
import React from 'react';
import { useNotes } from '@/contexts/LiveStoreNotesContext';
import { useEntitySelection } from '@/contexts/EntitySelectionContext';
import { parseNoteConnections } from '@/utils/parsingUtils';
import { getLayoutSchema } from '@/types/layoutSchemas';
import { FactSheet } from './FactSheet';
import { ENTITY_SCHEMAS } from '@/types/attributes';
import { Database, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { toast } from 'sonner';

export function FactSheetContainer() {
  const { selectedNote, updateNoteContent } = useNotes();
  const { selectedEntity, setSelectedEntity } = useEntitySelection();
  
  // Parse connections reactively
  const connections = React.useMemo(() => {
    if (!selectedNote) return null;
    
    try {
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;
      
      return parseNoteConnections(contentObj);
    } catch (error) {
      console.error('Failed to parse note content for fact sheet:', error);
      return null;
    }
  }, [selectedNote?.content]);

  // Ensure entities is always an array
  const entities = React.useMemo(() => {
    const rawEntities = connections?.entities;
    if (!rawEntities) return [];
    if (Array.isArray(rawEntities)) return rawEntities;
    return [];
  }, [connections?.entities]);
  
  // Auto-select entity - prioritize globalSelectedEntity, then first entity
  const currentEntity = React.useMemo(() => {
    if (entities.length === 0) return null;

    // If there's a global selected entity, try to find it in current note's entities
    if (selectedEntity) {
      const matchingEntity = entities.find(entity => 
        entity.kind === selectedEntity.kind && entity.label === selectedEntity.label
      );
      if (matchingEntity) return matchingEntity;
    }

    // Fallback to first entity
    return entities[0];
  }, [entities, selectedEntity]);

  // Handle attribute updates
  const handleAttributeUpdate = (attributeName: string, value: any) => {
    if (!selectedNote || !currentEntity) return;

    try {
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;

      const updateEntityInContent = (node: any): any => {
        if (node.type === 'entity' && 
            node.attrs?.kind === currentEntity.kind && 
            node.attrs?.label === currentEntity.label) {
          
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
      
      toast.success(`Updated ${attributeName} for ${currentEntity.label}`);
    } catch (error) {
      console.error('Error updating attribute:', error);
      toast.error('Failed to update attribute');
    }
  };

  // Handle entity selection change
  const handleEntityChange = (entityId: string) => {
    const [kind, label] = entityId.split('|');
    const entity = entities.find(e => e.kind === kind && e.label === label);
    if (entity) {
      // Convert Entity to GlobalEntity format for the context
      const globalEntity = {
        ...entity,
        occurrences: 1,
        noteIds: [selectedNote?.id || ''],
        noteTitles: [selectedNote?.title || ''],
        firstMentioned: selectedNote?.createdAt || new Date().toISOString(),
        lastMentioned: selectedNote?.updatedAt || new Date().toISOString()
      };
      setSelectedEntity(globalEntity);
    }
  };

  // Group entities by kind for dropdown
  const groupedEntities = React.useMemo(() => {
    const groups: Record<string, typeof entities> = {};
    entities.forEach(entity => {
      if (!groups[entity.kind]) {
        groups[entity.kind] = [];
      }
      groups[entity.kind].push(entity);
    });
    return groups;
  }, [entities]);

  // Get layout schema for the current entity
  const layoutSchema = React.useMemo(() => {
    if (!currentEntity) return null;
    return getLayoutSchema(currentEntity.kind);
  }, [currentEntity]);

  // Convert entity attributes to typed attributes
  const typedAttributes = React.useMemo(() => {
    if (!currentEntity?.attributes) return [];

    let parsedAttributes: Record<string, any> = {};

    if (typeof currentEntity.attributes === 'string') {
      try {
        parsedAttributes = JSON.parse(currentEntity.attributes);
      } catch (error) {
        console.warn('Failed to parse attributes as JSON:', error);
        parsedAttributes = { text: currentEntity.attributes };
      }
    } else if (currentEntity.attributes && typeof currentEntity.attributes === 'object') {
      parsedAttributes = currentEntity.attributes;
    }

    const entitySchema = ENTITY_SCHEMAS.find(schema => schema.kind === currentEntity.kind);
    const attributes: any[] = [];

    // Convert parsed attributes to typed attributes
    Object.entries(parsedAttributes).forEach(([key, value]) => {
      const schemaAttr = entitySchema?.attributes.find(attr => attr.name === key);
      attributes.push({
        id: `entity-${key}-${Date.now()}`,
        name: key,
        type: schemaAttr?.type || 'Text',
        value: value,
        unit: schemaAttr?.unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Add missing schema attributes with default values
    if (entitySchema) {
      entitySchema.attributes.forEach(schemaAttr => {
        if (!attributes.find(attr => attr.name === schemaAttr.name)) {
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

    return attributes;
  }, [currentEntity]);

  // Show empty state if no entity
  if (!currentEntity) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <Database className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Entity Selected</h3>
        <p className="text-muted-foreground">
          Select an entity from your note to view its detailed fact sheet
        </p>
      </div>
    );
  }

  // Show message if no layout schema available
  if (!layoutSchema) {
    return (
      <div className="h-full overflow-auto">
        {/* Header with entity selector */}
        <div className="sticky top-0 bg-background border-b border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Fact Sheet</h2>
              <Badge variant="secondary">{entities.length}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{selectedNote?.title}</span>
            </div>
          </div>

          {entities.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Entity</label>
              <Select
                value={`${currentEntity.kind}|${currentEntity.label}`}
                onValueChange={handleEntityChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(groupedEntities).map(([kind, kindEntities]) => (
                    <SelectGroup key={kind}>
                      <SelectLabel className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {kind}
                      </SelectLabel>
                      {kindEntities.map((entity) => (
                        <SelectItem
                          key={`${entity.kind}|${entity.label}`}
                          value={`${entity.kind}|${entity.label}`}
                          className="pl-6"
                        >
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Layout Available</h3>
          <p className="text-muted-foreground">
            No custom fact sheet layout is available for {currentEntity.kind} entities yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Switch to the Details tab to view attributes in the standard format.
          </p>
        </div>
      </div>
    );
  }

  // Render fact sheet with header
  return (
    <div className="h-full overflow-auto">
      {/* Header with entity selector */}
      <div className="sticky top-0 bg-background border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Fact Sheet</h2>
            <Badge variant="secondary">{entities.length}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{selectedNote?.title}</span>
          </div>
        </div>

        {entities.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Entity</label>
            <Select
              value={`${currentEntity.kind}|${currentEntity.label}`}
              onValueChange={handleEntityChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(groupedEntities).map(([kind, kindEntities]) => (
                  <SelectGroup key={kind}>
                    <SelectLabel className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {kind}
                    </SelectLabel>
                    {kindEntities.map((entity) => (
                      <SelectItem
                        key={`${entity.kind}|${entity.label}`}
                        value={`${entity.kind}|${entity.label}`}
                        className="pl-6"
                      >
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Fact Sheet Content */}
      <div className="p-4">
        <FactSheet
          entity={currentEntity}
          layoutSchema={layoutSchema}
          typedAttributes={typedAttributes}
          onAttributeUpdate={handleAttributeUpdate}
        />
      </div>
    </div>
  );
}
