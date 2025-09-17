
import React from 'react';
import { useNotes } from '@/contexts/LiveStoreNotesContext';
import { useEntitySelection } from '@/contexts/EntitySelectionContext';
import { parseNoteConnections } from '@/utils/parsingUtils';
import { SimpleLayout } from './layouts/SimpleLayout';
import { TypedAttribute, ENTITY_SCHEMAS, AttributeType } from '@/types/attributes';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Database, FileText } from 'lucide-react';

export const OverviewContainer = () => {
  const { selectedNote } = useNotes();
  const { selectedEntity: globalSelectedEntity } = useEntitySelection();
  const [selectedEntity, setSelectedEntity] = React.useState<any>(null);

  // Parse connections reactively
  const connections = React.useMemo(() => {
    if (!selectedNote) return null;
    
    try {
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;
      
      return parseNoteConnections(contentObj);
    } catch (error) {
      console.error('Failed to parse note content for overview:', error);
      return null;
    }
  }, [selectedNote?.content]);

  const entities = connections?.entities || [];

  // Group entities by kind
  const entityGroups = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    (Array.isArray(entities) ? entities : []).forEach(entity => {
      if (!groups[entity.kind]) {
        groups[entity.kind] = [];
      }
      groups[entity.kind].push(entity);
    });
    return groups;
  }, [entities]);

  // Auto-select entity
  React.useEffect(() => {
    const entitiesArray = Array.isArray(entities) ? entities : [];

    if (entitiesArray.length === 0) {
      setSelectedEntity(null);
      return;
    }

    if (globalSelectedEntity) {
      const matchingEntity = entitiesArray.find(entity => 
        entity.kind === globalSelectedEntity.kind && entity.label === globalSelectedEntity.label
      );
      if (matchingEntity) {
        setSelectedEntity(matchingEntity);
        return;
      }
    }

    if (!selectedEntity) {
      setSelectedEntity(entitiesArray[0]);
    }
  }, [entities, selectedEntity, globalSelectedEntity]);

  // Convert entity attributes to typed attributes
  const typedAttributes = React.useMemo((): TypedAttribute[] => {
    if (!selectedEntity?.attributes) return [];

    let parsedAttributes: Record<string, any> = {};

    if (typeof selectedEntity.attributes === 'string') {
      try {
        parsedAttributes = JSON.parse(selectedEntity.attributes);
      } catch (error) {
        parsedAttributes = { text: selectedEntity.attributes };
      }
    } else if (selectedEntity.attributes && typeof selectedEntity.attributes === 'object') {
      parsedAttributes = selectedEntity.attributes;
    }

    const entitySchema = ENTITY_SCHEMAS.find(schema => schema.kind === selectedEntity.kind);
    const attributes: TypedAttribute[] = [];

    Object.entries(parsedAttributes).forEach(([key, value]) => {
      const schemaAttr = entitySchema?.attributes.find(attr => attr.name === key);
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

    return attributes;
  }, [selectedEntity]);

  if (!selectedNote) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Note Selected</h3>
        <p className="text-muted-foreground text-center">
          Select a note to view its entity overview
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Overview</h2>
          <Badge variant="outline">
            {Array.isArray(entities) ? entities.length : 0} entities
          </Badge>
        </div>

        {/* Entity List */}
        {entities.length > 0 && (
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
        )}

        {/* Current Note Info */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Current Note:</span>
            <span className="text-muted-foreground truncate">
              {selectedNote.title || 'Untitled'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!selectedEntity ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-0">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Entity Selected</h3>
            <p className="text-muted-foreground">
              {entities.length === 0 
                ? "No entities found in this note"
                : "Select an entity from the list above to view its attributes"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">{selectedEntity.label}</h3>
              <Badge variant="secondary">{selectedEntity.kind}</Badge>
            </div>
            <SimpleLayout attributes={typedAttributes} onAttributeClick={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
};
