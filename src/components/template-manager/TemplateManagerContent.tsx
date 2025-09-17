
import React, { useState, useMemo } from 'react';
import { useStore } from '@livestore/react';
import { useTemplateService } from '@/lib/templates/templateService';
import { EntityTemplate } from '@/types/attributes';
import { entityTemplates$, templateAttributes$ } from '@/livestore/queries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Upload, Download, Palette, Settings, Loader2 } from 'lucide-react';
import { TemplateEditor } from './TemplateEditor';
import { TemplateLibrary } from './TemplateLibrary';

type ViewMode = 'library' | 'editor' | 'import-export';

export function TemplateManagerContent() {
  const { store } = useStore();
  const templateServiceFactory = useTemplateService();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [selectedTemplate, setSelectedTemplate] = useState<EntityTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Get data from LiveStore using the correct pattern
  const rawTemplates = store.useQuery(entityTemplates$) || [];
  const rawAttributes = store.useQuery(templateAttributes$) || [];
  
  // Ensure arrays
  const templates = Array.isArray(rawTemplates) ? rawTemplates : (rawTemplates ? [rawTemplates] : []);
  const attributes = Array.isArray(rawAttributes) ? rawAttributes : (rawAttributes ? [rawAttributes] : []);
  
  // Create service instance with data
  const templateService = useMemo(() => {
    return templateServiceFactory.createServiceWithData(templates, attributes);
  }, [templateServiceFactory, templates, attributes]);

  // Initialize built-in templates if none exist
  React.useEffect(() => {
    const initializeTemplates = async () => {
      try {
        setIsInitializing(true);
        const currentTemplates = templateService.getAllTemplates();
        console.log('Current templates:', currentTemplates);
        
        if (currentTemplates.length === 0) {
          console.log('No templates found, migrating built-in schemas...');
          await templateService.migrateBuiltInSchemas();
          console.log('Built-in schemas migrated successfully');
        }
      } catch (error) {
        console.error('Error initializing templates:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeTemplates();
  }, [templateService]);

  const filteredTemplates = useMemo(() => {
    try {
      const allTemplates = templateService.getAllTemplates();
      if (!searchQuery) return allTemplates;
      
      return templateService.searchTemplates(searchQuery);
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }, [templateService, searchQuery]);

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsCreatingNew(true);
    setViewMode('editor');
  };

  const handleEditTemplate = (template: EntityTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingNew(false);
    setViewMode('editor');
  };

  const handleBackToLibrary = () => {
    setSelectedTemplate(null);
    setIsCreatingNew(false);
    setViewMode('library');
  };

  const handleTemplateCreated = (template: EntityTemplate) => {
    setSelectedTemplate(template);
    setIsCreatingNew(false);
    // Stay in editor to allow further editing
  };

  const stats = useMemo(() => {
    const builtInCount = filteredTemplates.filter(t => t.isBuiltIn).length;
    const customCount = filteredTemplates.filter(t => !t.isBuiltIn).length;
    const categories = new Set(filteredTemplates.map(t => t.category).filter(Boolean));
    
    return {
      total: filteredTemplates.length,
      builtIn: builtInCount,
      custom: customCount,
      categories: categories.size
    };
  }, [filteredTemplates]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Initializing templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Template Manager</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage entity templates for your world
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} templates
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.custom} custom
            </Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 mb-4">
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="text-sm font-medium">{stats.builtIn}</div>
              <div className="text-xs text-muted-foreground">Built-in</div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="text-sm font-medium">{stats.custom}</div>
              <div className="text-xs text-muted-foreground">Custom</div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="text-sm font-medium">{stats.categories}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and actions */}
        {viewMode === 'library' && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1">
        {viewMode === 'library' && (
          <TemplateLibrary
            templates={filteredTemplates}
            onEditTemplate={handleEditTemplate}
            onCreateNew={handleCreateNew}
          />
        )}

        {viewMode === 'editor' && (
          <TemplateEditor
            template={selectedTemplate}
            isCreatingNew={isCreatingNew}
            onBack={handleBackToLibrary}
            onTemplateCreated={handleTemplateCreated}
          />
        )}
      </div>

      {/* Footer with navigation */}
      <div className="p-4 border-t">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" className="gap-2">
              <Palette className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2">
              <Settings className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="import-export" className="gap-2">
              <Upload className="h-4 w-4" />
              Share
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
