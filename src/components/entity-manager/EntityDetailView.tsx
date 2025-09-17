import React, { useState } from 'react';
import { GlobalEntity } from '@/lib/entities/globalEntityService';
import { useNotes } from '@/contexts/LiveStoreNotesContext';
import { useEntitySelection } from '@/contexts/EntitySelectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
  Users, 
  MapPin, 
  Swords, 
  Eye, 
  FileText, 
  Calendar, 
  Hash, 
  ExternalLink,
  Settings,
  Info,
  Network,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ENTITY_SCHEMAS } from '@/types/attributes';

interface EntityDetailViewProps {
  entity: GlobalEntity;
}

export function EntityDetailView({ entity }: EntityDetailViewProps) {
  const { selectItem } = useNotes();
  const { setSelectedEntity } = useEntitySelection();
  const [activeTab, setActiveTab] = useState('overview');

  const handleBackClick = () => {
    setSelectedEntity(null);
  };

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

  const handleNoteClick = (noteId: string) => {
    selectItem(noteId);
  };

  const Icon = getEntityIcon(entity.kind);
  const colorClass = getEntityColor(entity.kind);
  const entitySchema = ENTITY_SCHEMAS.find(schema => schema.kind === entity.kind);

  return (
    <div className="h-full flex flex-col">
      {/* Back Navigation Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Entity List
          </Button>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={handleBackClick}
                  className="cursor-pointer"
                >
                  Entity Manager
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground">
                  {entity.kind}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{entity.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Entity Header */}
      <div className="p-4 border-b">
        <div className="flex items-start gap-4">
          <Icon className="h-8 w-8 mt-1" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{entity.label}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-sm ${colorClass}`}>
                {entity.kind}
              </Badge>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {entity.occurrences} mention{entity.occurrences !== 1 ? 's' : ''}
              </span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {entity.noteIds.length} note{entity.noteIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Last mentioned {formatDistanceToNow(new Date(entity.lastMentioned), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Attributes
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Relations
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-4 space-y-4 m-0">
            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{entity.occurrences}</div>
                    <div className="text-xs text-muted-foreground">Total mentions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{entity.noteIds.length}</div>
                    <div className="text-xs text-muted-foreground">Notes referenced</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs font-medium">Timeline</div>
                  <div className="text-xs text-muted-foreground">
                    First mentioned: {formatDistanceToNow(new Date(entity.firstMentioned), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last mentioned: {formatDistanceToNow(new Date(entity.lastMentioned), { addSuffix: true })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Referenced Notes
                </CardTitle>
                <CardDescription>
                  Notes where this entity appears
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entity.noteTitles.map((title, index) => (
                    <div key={entity.noteIds[index]} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm">{title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNoteClick(entity.noteIds[index])}
                        className="h-6 text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attributes" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entity Attributes</CardTitle>
                <CardDescription>
                  {entitySchema 
                    ? `Schema-based attributes for ${entity.kind} entities`
                    : 'Custom attributes for this entity'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {entity.attributes && Object.keys(entity.attributes).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(entity.attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start p-2 rounded border">
                        <div className="font-medium text-sm capitalize">{key}</div>
                        <div className="text-sm text-muted-foreground text-right">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attributes defined for this entity.</p>
                    <p className="text-sm mt-2">
                      Add attributes to provide more details about this entity.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {entitySchema && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Schema Information</CardTitle>
                  <CardDescription>
                    Available attributes for {entity.kind} entities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {entitySchema.attributes.map((attr) => (
                      <div key={attr.name} className="flex justify-between items-center p-2 rounded bg-muted">
                        <span className="text-sm font-medium">{attr.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {attr.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entity Relationships</CardTitle>
                <CardDescription>
                  How this entity relates to others in your world
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Relationship analysis coming soon.</p>
                  <p className="text-sm mt-2">
                    This will show entities that frequently appear together.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
