
import React, { useState, useMemo } from 'react';
import { useNotes } from '@/contexts/LiveStoreNotesContext';
import { useEntitySelection } from '@/contexts/EntitySelectionContext';
import { globalEntityService, GlobalEntity, EntityUsageStats } from '@/lib/entities/globalEntityService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Search, Filter, BarChart3, Users, MapPin, Swords, Eye, FileText, ArrowLeft } from 'lucide-react';
import { GlobalEntityCard } from './GlobalEntityCard';
import { EntityDetailView } from './EntityDetailView';

type SortOption = 'alphabetical' | 'frequency' | 'recent' | 'type';
type ViewMode = 'overview' | 'by-type' | 'statistics';

export function GlobalEntityManagerContent() {
  const { state } = useNotes();
  const { selectedEntity, setSelectedEntity } = useEntitySelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('frequency');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [minOccurrences, setMinOccurrences] = useState<number>(1);

  // Get all notes for global analysis
  const allNotes = useMemo(() => {
    return state.items.filter(item => item.type === 'note');
  }, [state.items]);

  // Analyze global entities
  const { globalEntities, entityStats, crossReferences } = useMemo(() => {
    console.log('GlobalEntityManagerContent: Analyzing global entities from', allNotes.length, 'notes');
    return globalEntityService.analyzeGlobalEntities(allNotes);
  }, [allNotes]);

  // Get unique entity types for filtering
  const entityTypes = useMemo(() => {
    return Array.from(new Set(globalEntities.map(entity => entity.kind))).sort();
  }, [globalEntities]);

  // Apply search and filters
  const filteredEntities = useMemo(() => {
    let filtered = globalEntityService.searchEntities(globalEntities, searchQuery, {
      entityTypes: selectedEntityTypes.length > 0 ? selectedEntityTypes : undefined,
      minOccurrences
    });

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.label.localeCompare(b.label));
        break;
      case 'frequency':
        filtered.sort((a, b) => b.occurrences - a.occurrences);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime());
        break;
      case 'type':
        filtered.sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label));
        break;
    }

    return filtered;
  }, [globalEntities, searchQuery, selectedEntityTypes, sortBy, minOccurrences]);

  // Group entities by type for type view
  const entitiesByType = useMemo(() => {
    return globalEntityService.getEntitiesByType(filteredEntities);
  }, [filteredEntities]);

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

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedEntityTypes([]);
    setMinOccurrences(1);
    setSortBy('frequency');
  };

  // If an entity is selected, show the detail view
  if (selectedEntity) {
    return <EntityDetailView entity={selectedEntity} />;
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header with project stats */}
      <div className="p-4 border-b">
        <div className="mb-4 p-3 bg-muted rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">World Bible</div>
              <div className="text-xs text-muted-foreground">
                {entityStats.totalEntities} entities across {allNotes.length} notes
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {Object.keys(entityStats.entitiesByType).length} types
            </Badge>
          </div>
          
          {/* Quick stats */}
          <div className="flex gap-2 text-xs">
            <Badge variant="outline">
              Most used: {entityStats.mostUsedEntities[0]?.label || 'None'} ({entityStats.mostUsedEntities[0]?.occurrences || 0})
            </Badge>
            {entityStats.orphanedEntities.length > 0 && (
              <Badge variant="destructive">
                {entityStats.orphanedEntities.length} orphaned
              </Badge>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search entities, types, or notes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedEntityTypes.length > 0 ? selectedEntityTypes.join(',') : 'all-types'}
              onValueChange={(value) => setSelectedEntityTypes(value === 'all-types' ? [] : value.split(','))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All types</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frequency">By usage</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="type">By type</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={minOccurrences.toString()}
              onValueChange={(value) => setMinOccurrences(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">All entities</SelectItem>
                <SelectItem value="2">2+ mentions</SelectItem>
                <SelectItem value="3">3+ mentions</SelectItem>
                <SelectItem value="5">5+ mentions</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs with content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="by-type">By Type</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {filteredEntities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No entities found matching your criteria.</p>
                  <p className="mt-2 text-sm">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredEntities.map((entity, index) => (
                    <GlobalEntityCard
                      key={`${entity.kind}:${entity.label}:${index}`}
                      entity={entity}
                      crossReferences={crossReferences.find(ref => ref.entityId === `${entity.kind}:${entity.label}`)}
                      allEntities={globalEntities}
                      onSelect={() => setSelectedEntity(entity)}
                      isSelected={selectedEntity?.kind === entity.kind && selectedEntity?.label === entity.label}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="by-type" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {Object.entries(entitiesByType).map(([type, entities]) => {
                const Icon = getEntityIcon(type);
                return (
                  <Card key={type}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="h-4 w-4" />
                        {type}
                        <Badge variant="secondary" className="text-xs">
                          {entities.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {entities.map((entity, index) => (
                        <GlobalEntityCard
                          key={`${entity.kind}:${entity.label}:${index}`}
                          entity={entity}
                          crossReferences={crossReferences.find(ref => ref.entityId === `${entity.kind}:${entity.label}`)}
                          allEntities={globalEntities}
                          compact
                          onSelect={() => setSelectedEntity(entity)}
                          isSelected={selectedEntity?.kind === entity.kind && selectedEntity?.label === entity.label}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="statistics" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Usage Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Entities by Type</h4>
                      <div className="space-y-2">
                        {Object.entries(entityStats.entitiesByType).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm">{type}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Most Used Entities</h4>
                      <div className="space-y-2">
                        {entityStats.mostUsedEntities.slice(0, 5).map((entity) => (
                          <div key={`${entity.kind}:${entity.label}`} className="flex justify-between items-center">
                            <span className="text-sm">{entity.label}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{entity.kind}</Badge>
                              <Badge>{entity.occurrences}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {entityStats.orphanedEntities.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Orphaned Entities</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Entities mentioned only once - consider developing these further
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {entityStats.orphanedEntities.slice(0, 10).map((entity) => (
                              <Badge key={`${entity.kind}:${entity.label}`} variant="destructive" className="text-xs">
                                {entity.label}
                              </Badge>
                            ))}
                            {entityStats.orphanedEntities.length > 10 && (
                              <Badge variant="outline" className="text-xs">
                                +{entityStats.orphanedEntities.length - 10} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
