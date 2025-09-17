
import React, { useState } from 'react';
import { useStore } from '@livestore/react';
import { EntityTemplate } from '@/types/attributes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTemplateService } from '@/lib/templates/templateService';
import { entityTemplates$, templateAttributes$ } from '@/livestore/queries';

interface TemplateEditorProps {
  template: EntityTemplate | null;
  isCreatingNew: boolean;
  onBack: () => void;
  onTemplateCreated: (template: EntityTemplate) => void;
}

export function TemplateEditor({ template, isCreatingNew, onBack, onTemplateCreated }: TemplateEditorProps) {
  const { store } = useStore();
  const templateServiceFactory = useTemplateService();
  const { toast } = useToast();
  
  // Get data from store using the correct LiveStore pattern
  const rawTemplates = store.useQuery(entityTemplates$) || [];
  const rawAttributes = store.useQuery(templateAttributes$) || [];
  const templates = Array.isArray(rawTemplates) ? rawTemplates : (rawTemplates ? [rawTemplates] : []);
  const attributes = Array.isArray(rawAttributes) ? rawAttributes : (rawAttributes ? [rawAttributes] : []);
  
  // Create service instance
  const templateService = templateServiceFactory.createServiceWithData(templates, attributes);
  
  const [formData, setFormData] = useState({
    name: template?.name || '',
    kind: template?.kind || '',
    description: template?.description || '',
    category: template?.category || ''
  });

  const handleSave = async () => {
    try {
      if (isCreatingNew) {
        const newTemplate = await templateService.createTemplate(
          formData.name,
          formData.kind.toUpperCase(),
          [], // Start with no attributes
          {
            description: formData.description,
            category: formData.category
          }
        );
        onTemplateCreated(newTemplate);
        toast({
          title: 'Template created',
          description: `"${formData.name}" has been created successfully.`
        });
      } else if (template) {
        await templateService.updateTemplate(template.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category
        });
        toast({
          title: 'Template updated',
          description: `"${formData.name}" has been updated successfully.`
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to save template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">
          {isCreatingNew ? 'Create Template' : `Edit ${template?.name}`}
        </h2>
      </div>

      <div className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Template name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Kind</label>
              <Input
                value={formData.kind}
                onChange={(e) => setFormData({ ...formData, kind: e.target.value })}
                placeholder="ENTITY_TYPE"
                disabled={!isCreatingNew}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Template description"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Template category"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t">
        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isCreatingNew ? 'Create Template' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
