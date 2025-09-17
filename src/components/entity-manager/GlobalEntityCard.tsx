
import React from 'react';
import { useNotes } from '@/contexts/LiveStoreNotesContext';
import { useEntitySelection } from '@/contexts/EntitySelectionContext';
import { GlobalEntity, EntityCrossReference } from '@/lib/entities/globalEntityService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  MapPin, 
  Swords, 
  Eye, 
  FileText, 
  Calendar, 
  Hash, 
  ChevronDown, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GlobalEntityCardProps {
  entity: GlobalEntity;
  crossReferences?: EntityCrossReference;
  compact?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
  allEntities?: GlobalEntity[];
}

export function GlobalEntityCard({ entity, crossReferences, compact = false, onSelect, isSelected = false, allEntities = [] }: GlobalEntityCardProps) {
  const { selectItem } = useNotes();
  const { setSelectedEntity } = useEntitySelection();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toUpperCase()) {
      case 'CHARACTER':
      case 'NPC':
        return Users;
      case 'LOCATION':
        return MapPin;
      case 'FACTION':
      case 'ORGANIZATION':
        return Swords;
      default:
        return Eye;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType.toUpperCase()) {
      case 'CHARACTER':
      case 'NPC':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'LOCATION':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'FACTION':
      case 'ORGANIZATION':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleNoteClick = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card selection
    selectItem(noteId);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card selection
    setIsExpanded(!isExpanded);
  };

  const handleRelatedEntitiesClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card selection
  };

  const handleRelatedEntityClick = (relatedEntityKey: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card selection
    
    // Parse the entity key to get kind and label
    const [kind, label] = relatedEntityKey.split(':');
    
    // Find the entity in the allEntities array
    const targetEntity = allEntities.find(entity => 
      entity.kind === kind && entity.label === label
    );
    
    if (targetEntity) {
      setSelectedEntity(targetEntity);
    }
  };

  const Icon = getEntityIcon(entity.kind);
  const colorClass = getEntityColor(entity.kind);

  if (compact) {
    return (
      <Card 
        className={`hover:shadow-sm transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={onSelect}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium truncate">{entity.label}</span>
              <Badge className={`text-xs ${colorClass}`}>
                {entity.kind}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {entity.occurrences}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandClick}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="flex flex-wrap gap-1">
                {entity.noteTitles.slice(0, 3).map((title, index) => (
                  <Button
                    key={entity.noteIds[index]}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={(e) => handleNoteClick(entity.noteIds[index], e)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {title}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                ))}
                {entity.noteTitles.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{entity.noteTitles.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">{entity.label}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${colorClass}`}>
                  {entity.kind}
                </Badge>
                <span className="text-xs">•</span>
                <span className="text-xs">
                  {entity.occurrences} mention{entity.occurrences !== 1 ? 's' : ''}
                </span>
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(entity.lastMentioned), { addSuffix: true })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Notes containing this entity */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Appears in {entity.noteIds.length} note{entity.noteIds.length !== 1 ? 's' : ''}
          </h4>
          <div className="flex flex-wrap gap-2">
            {entity.noteTitles.map((title, index) => (
              <Button
                key={entity.noteIds[index]}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => handleNoteClick(entity.noteIds[index], e)}
              >
                {title}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            ))}
          </div>
        </div>

        {/* Related entities */}
        {crossReferences && crossReferences.relatedEntities.length > 0 && (
          <>
            <Separator />
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-0 h-auto"
                  onClick={handleRelatedEntitiesClick}
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Related entities ({crossReferences.relatedEntities.length})
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ScrollArea className="h-24">
                  <div className="flex flex-wrap gap-1">
                    {crossReferences.relatedEntities.slice(0, 10).map((relatedEntityKey) => {
                      const [kind, label] = relatedEntityKey.split(':');
                      return (
                        <Badge 
                          key={relatedEntityKey} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={(e) => handleRelatedEntityClick(relatedEntityKey, e)}
                        >
                          {label}
                        </Badge>
                      );
                    })}
                    {crossReferences.relatedEntities.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{crossReferences.relatedEntities.length - 10} more
                      </Badge>
                    )}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Entity attributes if present */}
        {entity.attributes && Object.keys(entity.attributes).length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Attributes</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                {Object.entries(entity.attributes).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
