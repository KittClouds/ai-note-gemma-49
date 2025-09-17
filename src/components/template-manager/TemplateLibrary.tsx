
import React, { useState } from 'react';
import { useStore } from '@livestore/react';
import { EntityTemplate } from '@/types/attributes';
import { useTemplateService } from '@/lib/templates/templateService';
import { entityTemplates$, templateAttributes$ } from '@/livestore/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Edit, 
  MoreVertical, 
  Copy, 
  Trash, 
  Download, 
  Users, 
  MapPin, 
  Swords, 
  Eye,
  Crown,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateLibraryProps {
  templates: EntityTemplate[];
  onEditTemplate: (template: EntityTemplate) => void;
  onCreateNew: () => void;
}

export function TemplateLibrary({ templates, onEditTemplate, onCreateNew }: TemplateLibraryProps) {
  const { store } = useStore();
  const templateServiceFactory = useTemplateService();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EntityTemplate | null>(null);

  // Get data from store using the correct LiveStore pattern
  const rawTemplates = store.useQuery(entityTemplates$) || [];
  const rawAttributes = store.useQuery(templateAttributes$) || [];
  const storeTemplates = Array.isArray(rawTemplates) ? rawTemplates : (rawTemplates ? [rawTemplates] : []);
  const storeAttributes = Array.isArray(rawAttributes) ? rawAttributes : (rawAttributes ? [rawAttributes] : []);
  
  // Create service instance
  const templateService = templateServiceFactory.createServiceWithData(storeTemplates, storeAttributes);

  const getTemplateIcon = (template: EntityTemplate) => {
    if (template.icon) {
      // Could implement custom icon support here
      return Eye;
    }
    
    // Default icons based on kind
    switch (template.kind.toUpperCase()) {
      case 'CHARACTER':
      case 'NPC':
        return Users;
      case 'LOCATION':
        return MapPin;
      case 'FACTION':
      case 'ORGANIZATION':
        return Swords;
      case 'ITEM':
        return Package;
      default:
        return Eye;
    }
  };

  const handleDuplicate = async (template: EntityTemplate) => {
    try {
      const newName = `${template.name} (Copy)`;
      await templateService.duplicateTemplate(template.id, newName);
      toast({
        title: 'Template duplicated',
        description: `Created "${newName}" successfully.`
      });
    } catch (error) {
      toast({
        title: 'Failed to duplicate template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      await templateService.deleteTemplate(templateToDelete.id);
      toast({
        title: 'Template deleted',
        description: `"${templateToDelete.name}" has been deleted.`
      });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      toast({
        title: 'Failed to delete template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleExport = (template: EntityTemplate) => {
    try {
      const exportData = templateService.exportTemplate(template.id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${template.kind.toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Template exported',
        description: `"${template.name}" exported successfully.`
      });
    } catch (error) {
      toast({
        title: 'Failed to export template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const promptDelete = (template: EntityTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((groups, template) => {
    const category = template.category || (template.isBuiltIn ? 'Built-in' : 'Uncategorized');
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(template);
    return groups;
  }, {} as Record<string, EntityTemplate[]>);

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first template
              </p>
              <Button onClick={onCreateNew}>
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                    <Badge variant="outline" className="text-xs">
                      {categoryTemplates.length}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {categoryTemplates.map((template) => {
                      const Icon = getTemplateIcon(template);
                      
                      return (
                        <Card 
                          key={template.id} 
                          className="transition-all hover:shadow-md cursor-pointer"
                          onClick={() => onEditTemplate(template)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="p-2 rounded-md"
                                  style={{ 
                                    backgroundColor: template.color || 'hsl(var(--muted))',
                                    color: 'hsl(var(--muted-foreground))'
                                  }}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {template.name}
                                    {template.isBuiltIn && (
                                      <Crown className="h-3 w-3 text-yellow-500" />
                                    )}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {template.kind} • {template.description || 'No description'}
                                  </CardDescription>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTemplate(template);
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(template);
                                  }}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleExport(template);
                                  }}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                  </DropdownMenuItem>
                                  {!template.isBuiltIn && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          promptDelete(template);
                                        }}
                                        className="text-destructive"
                                      >
                                        <Trash className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
              {templateToDelete?.isBuiltIn && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  This is a built-in template. Deleting it may affect existing entities.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
