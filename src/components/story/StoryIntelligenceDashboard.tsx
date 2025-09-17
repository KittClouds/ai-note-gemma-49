
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Users, 
  MapPin, 
  Clock, 
  Layers,
  TreePine,
  Network,
  Target,
  ChevronRight,
  Plus
} from 'lucide-react';
import { storyStructureService } from '@/lib/story/storyStructureService';
import { StoryStructure, StoryStructureNode, StoryHierarchyLevel } from '@/types/storyStructure';
import { useNotes } from '@/contexts/NotesContext';

interface StoryIntelligenceDashboardProps {
  className?: string;
}

export function StoryIntelligenceDashboard({ className }: StoryIntelligenceDashboardProps) {
  const [structure, setStructure] = useState<StoryStructure | null>(null);
  const [activeView, setActiveView] = useState('structural');
  const [viewData, setViewData] = useState<any>(null);
  const { state: notesState } = useNotes();

  useEffect(() => {
    // Initialize story structure
    const storyStructure = storyStructureService.initializeStructure();
    setStructure(storyStructure);
    setActiveView(storyStructure.activeView);
  }, []);

  useEffect(() => {
    if (structure) {
      const data = storyStructureService.getStructureByPerspective(activeView);
      setViewData(data);
    }
  }, [structure, activeView]);

  const handlePerspectiveChange = (perspectiveId: string) => {
    setActiveView(perspectiveId);
    storyStructureService.switchPerspective(perspectiveId);
  };

  const handleCreateNode = (level: StoryHierarchyLevel, parentId?: string) => {
    const title = prompt(`Enter ${level} title:`);
    if (title) {
      storyStructureService.createNode(title, level, parentId);
      const updatedStructure = storyStructureService.getStructure();
      setStructure(updatedStructure);
    }
  };

  const getLevelIcon = (level: StoryHierarchyLevel) => {
    const icons = {
      series: BookOpen,
      book: BookOpen,
      act: Layers,
      chapter: TreePine,
      scene: Target
    };
    return icons[level] || BookOpen;
  };

  const getLevelColor = (level: StoryHierarchyLevel) => {
    const colors = {
      series: 'bg-purple-100 text-purple-800',
      book: 'bg-blue-100 text-blue-800',
      act: 'bg-green-100 text-green-800',
      chapter: 'bg-yellow-100 text-yellow-800',
      scene: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const renderHierarchicalView = () => {
    if (!viewData) return <div>No structure data</div>;

    const renderNode = (node: any, depth: number = 0) => {
      const Icon = getLevelIcon(node.level);
      const colorClass = getLevelColor(node.level);

      return (
        <div key={node.id} className={`ml-${depth * 4} mb-2`}>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100">
            <Icon className="h-4 w-4" />
            <span className="font-medium">{node.title}</span>
            <Badge variant="outline" className={colorClass}>
              {node.level}
            </Badge>
            {node.noteIds.length > 0 && (
              <Badge variant="secondary">{node.noteIds.length} notes</Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCreateNode('scene', node.id)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="ml-4 mt-2">
              {node.children.map((child: any) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    return (
      <ScrollArea className="h-96">
        {viewData.map((node: any) => renderNode(node))}
        <div className="mt-4 p-2">
          <Button
            variant="outline"
            onClick={() => handleCreateNode('book')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        </div>
      </ScrollArea>
    );
  };

  const renderTimelineView = () => {
    if (!viewData || viewData.type !== 'timeline') {
      return <div>No timeline data available</div>;
    }

    return (
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {viewData.events.map((event: any) => {
            const Icon = getLevelIcon(event.level);
            const colorClass = getLevelColor(event.level);

            return (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{event.title}</span>
                    <Badge variant="outline" className={colorClass}>
                      {event.level}
                    </Badge>
                  </div>
                  {event.start && (
                    <div className="text-sm text-gray-600 mb-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {event.start}
                    </div>
                  )}
                  {event.characters.length > 0 && (
                    <div className="flex gap-1 mb-1">
                      <Users className="h-3 w-3 mt-0.5" />
                      {event.characters.map((char: string) => (
                        <Badge key={char} variant="secondary" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {event.noteIds.length > 0 && (
                    <Badge variant="outline">{event.noteIds.length} notes</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const renderCharacterView = () => {
    if (!viewData || viewData.type !== 'character-grouped') {
      return <div>No character data available</div>;
    }

    return (
      <ScrollArea className="h-96">
        {viewData.groups.map((group: any) => (
          <div key={group.character} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{group.character}</span>
              <Badge variant="outline">{group.nodes.length} appearances</Badge>
            </div>
            <div className="space-y-2 ml-6">
              {group.nodes.map((node: any) => {
                const Icon = getLevelIcon(node.level);
                const colorClass = getLevelColor(node.level);

                return (
                  <div key={node.id} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                    <Icon className="h-3 w-3" />
                    <span className="text-sm">{node.title}</span>
                    <Badge variant="outline" className={`${colorClass} text-xs`}>
                      {node.level}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>
    );
  };

  const renderThematicView = () => {
    if (!viewData || viewData.type !== 'theme-grouped') {
      return <div>No thematic data available</div>;
    }

    return (
      <ScrollArea className="h-96">
        {viewData.groups.map((group: any) => (
          <div key={group.theme} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Network className="h-4 w-4" />
              <span className="font-semibold">{group.theme}</span>
              <Badge variant="outline">{group.nodes.length} elements</Badge>
            </div>
            <div className="space-y-2 ml-6">
              {group.nodes.map((node: any) => {
                const Icon = getLevelIcon(node.level);
                const colorClass = getLevelColor(node.level);

                return (
                  <div key={node.id} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                    <Icon className="h-3 w-3" />
                    <span className="text-sm">{node.title}</span>
                    <Badge variant="outline" className={`${colorClass} text-xs`}>
                      {node.level}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>
    );
  };

  const renderViewContent = () => {
    switch (activeView) {
      case 'structural':
        return renderHierarchicalView();
      case 'chronological':
        return renderTimelineView();
      case 'character':
        return renderCharacterView();
      case 'thematic':
        return renderThematicView();
      default:
        return renderHierarchicalView();
    }
  };

  if (!structure) {
    return <div>Loading story structure...</div>;
  }

  const perspective = structure.perspectives.find(p => p.id === activeView);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreePine className="h-5 w-5" />
          Story Intelligence Dashboard
        </CardTitle>
        <CardDescription>
          Multi-dimensional story structure and narrative analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={handlePerspectiveChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="structural">Structure</TabsTrigger>
            <TabsTrigger value="chronological">Timeline</TabsTrigger>
            <TabsTrigger value="character">Characters</TabsTrigger>
            <TabsTrigger value="thematic">Themes</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{perspective?.name}</span>
                <Badge variant="secondary">{perspective?.type}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{Object.keys(structure.nodes).length} elements</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{notesState.items.length} notes</span>
              </div>
            </div>

            <TabsContent value="structural">
              {renderViewContent()}
            </TabsContent>

            <TabsContent value="chronological">
              {renderViewContent()}
            </TabsContent>

            <TabsContent value="character">
              {renderViewContent()}
            </TabsContent>

            <TabsContent value="thematic">
              {renderViewContent()}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
