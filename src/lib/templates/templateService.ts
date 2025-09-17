import { useStore } from '@livestore/react';
import { EntityTemplate, TemplateAttribute, TemplateWithAttributes, TemplateValidationResult, TemplateUsageStats, AttributeType, ENTITY_SCHEMAS } from '@/types/attributes';
import { entityTemplates$, templateAttributes$ } from '@/livestore/queries';
import { events } from '@/livestore/schema';
import { v4 as uuidv4 } from 'uuid';

export class TemplateService {
  private store: any;
  private getTemplates: () => EntityTemplate[];
  private getAttributes: () => TemplateAttribute[];

  constructor(store: any, getTemplates: () => EntityTemplate[], getAttributes: () => TemplateAttribute[]) {
    this.store = store;
    this.getTemplates = getTemplates;
    this.getAttributes = getAttributes;
  }

  // CRUD Operations for Templates
  async createTemplate(
    name: string,
    kind: string,
    attributes: Omit<TemplateAttribute, 'id' | 'templateId' | 'createdAt' | 'updatedAt'>[],
    options: {
      description?: string;
      color?: string;
      icon?: string;
      category?: string;
      isBuiltIn?: boolean;
    } = {}
  ): Promise<EntityTemplate> {
    const templateId = uuidv4();
    const now = new Date().toISOString();
    
    const template: EntityTemplate = {
      id: templateId,
      name,
      kind,
      description: options.description,
      color: options.color,
      icon: options.icon,
      isBuiltIn: options.isBuiltIn || false,
      category: options.category,
      createdAt: now,
      updatedAt: now
    };

    // Create template using LiveStore events - ensure all required fields are provided
    await this.store.dispatch(events.templateCreated({
      id: templateId,
      name,
      kind,
      description: options.description || '',
      color: options.color || '',
      icon: options.icon || '',
      isBuiltIn: options.isBuiltIn || false,
      category: options.category || '',
      createdAt: now,
      updatedAt: now
    }));

    // Create attributes
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      const attributeId = uuidv4();
      
      await this.store.dispatch(events.templateAttributeCreated({
        id: attributeId,
        templateId,
        name: attribute.name,
        type: attribute.type,
        defaultValue: attribute.defaultValue,
        unit: attribute.unit,
        required: attribute.required,
        sortOrder: attribute.sortOrder,
        category: attribute.category,
        createdAt: now,
        updatedAt: now
      }));
    }

    return template;
  }

  async updateTemplate(templateId: string, updates: Partial<EntityTemplate>): Promise<void> {
    const now = new Date().toISOString();
    
    await this.store.dispatch(events.templateUpdated({
      id: templateId,
      updatedAt: now,
      updates: updates
    }));
  }

  async deleteTemplate(templateId: string): Promise<void> {
    // Check if template is in use
    const usage = await this.getTemplateUsage(templateId);
    if (usage.usageCount > 0) {
      throw new Error(`Cannot delete template: ${usage.usageCount} entities are using this template`);
    }

    await this.store.dispatch(events.templateDeleted({ id: templateId }));
  }

  async duplicateTemplate(templateId: string, newName: string): Promise<EntityTemplate> {
    const template = this.getTemplateWithAttributes(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return this.createTemplate(
      newName,
      template.template.kind,
      template.attributes.map((attr, index) => ({
        name: attr.name,
        type: attr.type,
        defaultValue: attr.defaultValue,
        unit: attr.unit,
        required: attr.required,
        sortOrder: attr.sortOrder,
        category: attr.category
      })),
      {
        description: template.template.description,
        color: template.template.color,
        icon: template.template.icon,
        category: template.template.category
      }
    );
  }

  // CRUD Operations for Template Attributes
  async addTemplateAttribute(
    templateId: string,
    attribute: Omit<TemplateAttribute, 'id' | 'templateId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const attributeId = uuidv4();
    const now = new Date().toISOString();

    await this.store.dispatch(events.templateAttributeCreated({
      id: attributeId,
      templateId,
      name: attribute.name,
      type: attribute.type,
      defaultValue: attribute.defaultValue,
      unit: attribute.unit,
      required: attribute.required,
      sortOrder: attribute.sortOrder,
      category: attribute.category,
      createdAt: now,
      updatedAt: now
    }));
  }

  async updateTemplateAttribute(attributeId: string, updates: Partial<TemplateAttribute>): Promise<void> {
    const now = new Date().toISOString();
    
    await this.store.dispatch(events.templateAttributeUpdated({
      id: attributeId,
      updatedAt: now,
      updates: updates
    }));
  }

  async deleteTemplateAttribute(attributeId: string): Promise<void> {
    await this.store.dispatch(events.templateAttributeDeleted({ id: attributeId }));
  }

  // Query Operations
  getAllTemplates(): EntityTemplate[] {
    try {
      const templates = this.getTemplates();
      const templatesArray = Array.isArray(templates) ? templates : (templates ? [templates] : []);
      return templatesArray.sort((a, b) => {
        // Built-in templates first, then alphabetical
        if (a.isBuiltIn !== b.isBuiltIn) {
          return a.isBuiltIn ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error getting all templates:', error);
      return [];
    }
  }

  getTemplate(templateId: string): EntityTemplate | null {
    try {
      const templates = this.getAllTemplates();
      return templates.find(t => t.id === templateId) || null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  getTemplateByKind(kind: string): EntityTemplate | null {
    try {
      const templates = this.getAllTemplates();
      return templates.find(t => t.kind === kind) || null;
    } catch (error) {
      console.error('Error getting template by kind:', error);
      return null;
    }
  }

  getTemplateWithAttributes(templateId: string): TemplateWithAttributes | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    try {
      const allAttributes = this.getAttributes();
      const attributesArray = Array.isArray(allAttributes) ? allAttributes : (allAttributes ? [allAttributes] : []);
      const attributes = attributesArray
        .filter(attr => attr.templateId === templateId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return { template, attributes };
    } catch (error) {
      console.error('Error getting template with attributes:', error);
      return { template, attributes: [] };
    }
  }

  getTemplatesByCategory(category?: string): EntityTemplate[] {
    const allTemplates = this.getAllTemplates();
    if (!category) return allTemplates;
    
    return allTemplates.filter(template => template.category === category);
  }

  // Search and Filter
  searchTemplates(query: string): EntityTemplate[] {
    const allTemplates = this.getAllTemplates();
    const lowerQuery = query.toLowerCase();
    
    return allTemplates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.kind.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.category?.toLowerCase().includes(lowerQuery)
    );
  }

  // Template Validation
  validateTemplate(template: EntityTemplate, attributes: TemplateAttribute[]): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    if (!template.kind?.trim()) {
      errors.push('Template kind is required');
    }

    // Validate attributes
    const attributeNames = new Set<string>();
    attributes.forEach((attr, index) => {
      if (!attr.name?.trim()) {
        errors.push(`Attribute ${index + 1} is missing a name`);
      } else if (attributeNames.has(attr.name)) {
        errors.push(`Duplicate attribute name: ${attr.name}`);
      } else {
        attributeNames.add(attr.name);
      }

      if (!attr.type) {
        errors.push(`Attribute ${attr.name || index + 1} is missing a type`);
      }
    });

    // Warnings
    if (attributes.length === 0) {
      warnings.push('Template has no attributes');
    }

    if (!template.description) {
      warnings.push('Template has no description');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Usage Analytics
  async getTemplateUsage(templateId: string): Promise<TemplateUsageStats> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return {
      templateId,
      usageCount: 0,
      lastUsed: undefined,
      entitiesUsingTemplate: []
    };
  }

  // Export/Import
  exportTemplate(templateId: string): any {
    const templateWithAttributes = this.getTemplateWithAttributes(templateId);
    if (!templateWithAttributes) {
      throw new Error('Template not found');
    }

    return {
      version: '1.0',
      template: {
        name: templateWithAttributes.template.name,
        kind: templateWithAttributes.template.kind,
        description: templateWithAttributes.template.description,
        color: templateWithAttributes.template.color,
        icon: templateWithAttributes.template.icon,
        category: templateWithAttributes.template.category
      },
      attributes: templateWithAttributes.attributes.map(attr => ({
        name: attr.name,
        type: attr.type,
        defaultValue: attr.defaultValue,
        unit: attr.unit,
        required: attr.required,
        category: attr.category
      })),
      exportedAt: new Date().toISOString()
    };
  }

  async importTemplate(templateData: any): Promise<EntityTemplate> {
    if (!templateData.version || !templateData.template || !templateData.attributes) {
      throw new Error('Invalid template data format');
    }

    const { template, attributes } = templateData;
    
    // Check if template kind already exists
    const existingTemplate = this.getTemplateByKind(template.kind);
    if (existingTemplate) {
      throw new Error(`Template with kind '${template.kind}' already exists`);
    }

    return this.createTemplate(
      template.name,
      template.kind,
      attributes.map((attr, index) => ({
        name: attr.name,
        type: attr.type,
        defaultValue: attr.defaultValue,
        unit: attr.unit,
        required: attr.required,
        sortOrder: index,
        category: attr.category
      })),
      {
        description: template.description,
        color: template.color,
        icon: template.icon,
        category: template.category
      }
    );
  }

  // Migration from built-in schemas
  async migrateBuiltInSchemas(): Promise<void> {
    for (const schema of ENTITY_SCHEMAS) {
      const existingTemplate = this.getTemplateByKind(schema.kind);
      if (existingTemplate) continue; // Skip if already exists

      const attributes = schema.attributes.map((attr, index) => ({
        name: attr.name,
        type: attr.type as AttributeType,
        defaultValue: attr.defaultValue,
        unit: attr.unit,
        required: false,
        sortOrder: index,
        category: undefined
      }));

      await this.createTemplate(
        schema.kind.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        schema.kind,
        attributes,
        {
          description: `Built-in ${schema.kind} template`,
          isBuiltIn: true
        }
      );
    }
  }
}

// Hook to use template service with proper LiveStore integration
export function useTemplateService() {
  const store = useStore();
  
  // We need to import these hooks at the component level
  // This is a temporary solution - we'll return a factory function
  return {
    createServiceWithData: (templates: EntityTemplate[], attributes: TemplateAttribute[]) => {
      return new TemplateService(store, () => templates, () => attributes);
    }
  };
}
