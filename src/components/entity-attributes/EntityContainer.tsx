import React from 'react';
import { useNotes } from '@/contexts/LiveStoreNotesContext';
import { useEntitySelection } from '@/contexts/EntitySelectionContext';
import { EditableAttributePanel } from './EditableAttributePanel';
import { SimpleLayout } from './layouts/SimpleLayout';
import { parseNoteConnections } from '@/utils/parsingUtils';
import { TypedAttribute, ENTITY_SCHEMAS, AttributeType } from '@/types/attributes';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Database, FileText, Edit } from 'lucide-react';
import { toast } from 'sonner';

export const EntityContainer = () => {
  const { selectedNote, updateNoteContent } = useNotes();
  const { selectedEntity: globalSelectedEntity } = useEntitySelection();
  const [selectedEntity, setSelectedEntity] = React.useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  // Parse connections reactively
  const connections = React.useMemo(() => {
    if (!selectedNote) return null;
    
    try {
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;
      
      return parseNoteConnections(contentObj);
    } catch (error) {
      console.error('Failed to parse note content for entity editing:', error);
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

  // Auto-select entity with improved synchronization
  React.useEffect(() => {
    const entitiesArray = Array.isArray(entities) ? entities : [];

    if (entitiesArray.length === 0) {
      setSelectedEntity(null);
      return;
    }

    // First, try to keep the currently selected entity if it still exists
    if (selectedEntity) {
      const stillExists = entitiesArray.find(entity => 
        entity.kind === selectedEntity.kind && entity.label === selectedEntity.label
      );
      if (stillExists) {
        // Update with the latest version of the entity
        setSelectedEntity(stillExists);
        return;
      }
    }

    // Then try global selected entity
    if (globalSelectedEntity) {
      const matchingEntity = entitiesArray.find(entity => 
        entity.kind === globalSelectedEntity.kind && entity.label === globalSelectedEntity.label
      );
      if (matchingEntity) {
        setSelectedEntity(matchingEntity);
        return;
      }
    }

    // Fallback to first entity
    setSelectedEntity(entitiesArray[0]);
  }, [entities, globalSelectedEntity]);

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
  }, [selectedEntity]);

  // Handle attribute updates
  const handleAttributeUpdate = (attributeName: string, value: any) => {
    if (!selectedNote || !selectedEntity) return;

    try {
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;

      const updateEntityInContent = (node: any): any => {
        if (node.type === 'entity' && 
            node.attrs?.kind === selectedEntity.kind && 
            node.attrs?.label === selectedEntity.label) {
          
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
      const contentObj = typeof selectedNote.content === 'string' 
        ? JSON.parse(selectedNote.content) 
        : selectedNote.content;

      const updateEntityInContent = (node: any): any => {
        if (node.type === 'entity' && 
            node.attrs?.kind === selectedEntity.kind && 
            node.attrs?.label === selectedEntity.label) {
          
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

  if (!selectedNote) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Note Selected</h3>
        <p className="text-muted-foreground text-center">
          Select a note to edit its entities
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Entity</h2>
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
                  <SelectGroup key={kind}>
                    <SelectLabel className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted">
                      {kind}
                    </SelectLabel>
                    {entityList.map(entity => (
                      <SelectItem key={entity.label} value={entity.label}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
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
                : "Select an entity from the list above to edit its attributes"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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

            {isEditing ? (
              <EditableAttributePanel
                entity={selectedEntity}
                typedAttributes={typedAttributes}
                onAttributeUpdate={handleAttributeUpdate}
                onAddAttribute={handleAddAttribute}
              />
            ) : (
              <SimpleLayout attributes={typedAttributes} onAttributeClick={() => {}} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
