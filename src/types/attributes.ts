export type AttributeType = 
  | 'Text' 
  | 'Number' 
  | 'Boolean' 
  | 'Date' 
  | 'List' 
  | 'EntityLink' 
  | 'URL' 
  | 'ProgressBar' 
  | 'StatBlock' 
  | 'Relationship'
  | 'RichText'
  | 'ImageURL' 
  | 'ColorPicker' 
  | 'Rating' 
  | 'Tags' 
  | 'FileReference';

export type AttributeValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | string[] 
  | EntityReference 
  | ProgressBarValue 
  | StatBlockValue 
  | RelationshipValue
  | RichTextValue
  | ImageURLValue
  | ColorPickerValue
  | RatingValue
  | TagsValue
  | FileReferenceValue;

export interface TypedAttribute {
  id: string;
  name: string;
  type: AttributeType;
  value: AttributeValue;
  unit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressBarValue {
  current: number;
  maximum: number;
}

// Made StatBlockValue flexible - now supports any stat names and numbers
export interface StatBlockValue {
  [statName: string]: number;
}

// New types for custom stat schemas
export interface StatSchema {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  stats: StatDefinition[];
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatDefinition {
  name: string;
  displayName: string;
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  description?: string;
}

// Built-in stat schemas
export const STAT_SCHEMAS: StatSchema[] = [
  {
    id: 'dnd-classic',
    name: 'D&D Classic',
    description: 'Traditional Dungeons & Dragons ability scores',
    genre: 'Fantasy',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: [
      { name: 'strength', displayName: 'Strength', defaultValue: 10, minValue: 1, maxValue: 20 },
      { name: 'dexterity', displayName: 'Dexterity', defaultValue: 10, minValue: 1, maxValue: 20 },
      { name: 'constitution', displayName: 'Constitution', defaultValue: 10, minValue: 1, maxValue: 20 },
      { name: 'intelligence', displayName: 'Intelligence', defaultValue: 10, minValue: 1, maxValue: 20 },
      { name: 'wisdom', displayName: 'Wisdom', defaultValue: 10, minValue: 1, maxValue: 20 },
      { name: 'charisma', displayName: 'Charisma', defaultValue: 10, minValue: 1, maxValue: 20 }
    ]
  },
  {
    id: 'world-of-darkness',
    name: 'World of Darkness',
    description: 'Attributes from World of Darkness system',
    genre: 'Horror',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: [
      { name: 'strength', displayName: 'Strength', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'dexterity', displayName: 'Dexterity', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'stamina', displayName: 'Stamina', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'charisma', displayName: 'Charisma', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'manipulation', displayName: 'Manipulation', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'appearance', displayName: 'Appearance', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'perception', displayName: 'Perception', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'intelligence', displayName: 'Intelligence', defaultValue: 1, minValue: 1, maxValue: 5 },
      { name: 'wits', displayName: 'Wits', defaultValue: 1, minValue: 1, maxValue: 5 }
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Cyberpunk 2020/RED style attributes',
    genre: 'Sci-Fi',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: [
      { name: 'intelligence', displayName: 'Intelligence', defaultValue: 5, minValue: 1, maxValue: 10 },
      { name: 'reflexes', displayName: 'Reflexes', defaultValue: 5, minValue: 1, maxValue: 10 },
      { name: 'technique', displayName: 'Technique', defaultValue: 5, minValue: 1, maxValue: 10 },
      { name: 'cool', displayName: 'Cool', defaultValue: 5, minValue: 1, maxValue: 10 },
      { name: 'body', displayName: 'Body', defaultValue: 5, minValue: 1, maxValue: 10 },
      { name: 'dexterity', displayName: 'Dexterity', defaultValue: 5, minValue: 1, maxValue: 10 },
      { name: 'empathy', displayName: 'Empathy', defaultValue: 5, minValue: 1, maxValue: 10 },
      { name: 'move', displayName: 'Move', defaultValue: 5, minValue: 1, maxValue: 10 }
    ]
  },
  {
    id: 'generic-simple',
    name: 'Generic Simple',
    description: 'Simple three-attribute system',
    genre: 'Universal',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: [
      { name: 'physical', displayName: 'Physical', defaultValue: 3, minValue: 1, maxValue: 6 },
      { name: 'mental', displayName: 'Mental', defaultValue: 3, minValue: 1, maxValue: 6 },
      { name: 'social', displayName: 'Social', defaultValue: 3, minValue: 1, maxValue: 6 }
    ]
  }
];

export interface RelationshipValue {
  entityId: string;
  entityLabel: string;
  relationshipType: string;
}

export interface EntityReference {
  id: string;
  label: string;
  kind: string;
}

// Extended attribute value interfaces
export interface RichTextValue {
  content: string;
  format?: 'markdown' | 'html';
}

export interface ImageURLValue {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ColorPickerValue {
  hex: string;
  rgb?: { r: number; g: number; b: number };
  hsl?: { h: number; s: number; l: number };
}

export interface RatingValue {
  rating: number;
  maxRating: number;
  showStars?: boolean;
}

export interface TagsValue {
  tags: string[];
  separator?: string;
}

export interface FileReferenceValue {
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface EntitySchemaAttribute {
  name: string;
  type: AttributeType;
  defaultValue: any;
  unit?: string;
}

export interface EntitySchema {
  kind: string;
  attributes: EntitySchemaAttribute[];
}

// Template Management Types
export interface EntityTemplate {
  id: string;
  name: string;
  kind: string;
  description?: string;
  color?: string;
  icon?: string;
  isBuiltIn: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateAttribute {
  id: string;
  templateId: string;
  name: string;
  type: AttributeType;
  defaultValue: any;
  unit?: string;
  required: boolean;
  sortOrder: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateWithAttributes {
  template: EntityTemplate;
  attributes: TemplateAttribute[];
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateUsageStats {
  templateId: string;
  usageCount: number;
  lastUsed?: string;
  entitiesUsingTemplate: { kind: string; label: string; noteId: string }[];
}

// Updated ENTITY_SCHEMAS to use flexible stat schemas
export const ENTITY_SCHEMAS: EntitySchema[] = [
  {
    kind: 'CHARACTER',
    attributes: [
      { name: 'level', type: 'Number', defaultValue: 1 },
      { name: 'class', type: 'Text', defaultValue: '' },
      { name: 'race', type: 'Text', defaultValue: '' },
      { name: 'alignment', type: 'Text', defaultValue: 'Neutral' },
      { name: 'health', type: 'ProgressBar', defaultValue: { current: 100, maximum: 100 } },
      { name: 'mana', type: 'ProgressBar', defaultValue: { current: 50, maximum: 50 } },
      { name: 'stats', type: 'StatBlock', defaultValue: { 
        strength: 10, dexterity: 10, constitution: 10, 
        intelligence: 10, wisdom: 10, charisma: 10 
      }},
      { name: 'background', type: 'Text', defaultValue: '' },
      { name: 'occupation', type: 'Text', defaultValue: '' },
      { name: 'faction', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'FACTION' } }
    ]
  },
  {
    kind: 'NPC',
    attributes: [
      { name: 'role', type: 'Text', defaultValue: '' },
      { name: 'attitude', type: 'Text', defaultValue: 'Neutral' },
      { name: 'importance', type: 'Number', defaultValue: 5 },
      { name: 'location', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'LOCATION' } },
      { name: 'faction', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'FACTION' } },
      { name: 'relationships', type: 'List', defaultValue: [] },
      { name: 'secrets', type: 'List', defaultValue: [] },
      { name: 'goals', type: 'Text', defaultValue: '' },
      { name: 'description', type: 'Text', defaultValue: '' }
    ]
  },
  {
    kind: 'LOCATION',
    attributes: [
      { name: 'type', type: 'Text', defaultValue: '' },
      { name: 'size', type: 'Text', defaultValue: 'Medium' },
      { name: 'population', type: 'Number', defaultValue: 0 },
      { name: 'danger_level', type: 'Number', defaultValue: 1 },
      { name: 'climate', type: 'Text', defaultValue: '' },
      { name: 'terrain', type: 'Text', defaultValue: '' },
      { name: 'notable_features', type: 'List', defaultValue: [] },
      { name: 'resources', type: 'List', defaultValue: [] },
      { name: 'controlling_faction', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'FACTION' } },
      { name: 'connected_locations', type: 'List', defaultValue: [] }
    ]
  },
  {
    kind: 'SCENE',
    attributes: [
      { name: 'type', type: 'Text', defaultValue: 'Roleplay' },
      { name: 'difficulty', type: 'Number', defaultValue: 1 },
      { name: 'duration', type: 'Number', defaultValue: 30, unit: 'minutes' },
      { name: 'location', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'LOCATION' } },
      { name: 'participants', type: 'List', defaultValue: [] },
      { name: 'objectives', type: 'List', defaultValue: [] },
      { name: 'rewards', type: 'List', defaultValue: [] },
      { name: 'consequences', type: 'Text', defaultValue: '' },
      { name: 'mood', type: 'Text', defaultValue: '' },
      { name: 'tension', type: 'Number', defaultValue: 5 }
    ]
  },
  {
    kind: 'ITEM',
    attributes: [
      { name: 'type', type: 'Text', defaultValue: 'Miscellaneous' },
      { name: 'rarity', type: 'Text', defaultValue: 'Common' },
      { name: 'value', type: 'Number', defaultValue: 0, unit: 'gold' },
      { name: 'weight', type: 'Number', defaultValue: 1, unit: 'lbs' },
      { name: 'magical', type: 'Boolean', defaultValue: false },
      { name: 'damage', type: 'Text', defaultValue: '' },
      { name: 'armor_class', type: 'Number', defaultValue: 0 },
      { name: 'properties', type: 'List', defaultValue: [] },
      { name: 'attunement', type: 'Boolean', defaultValue: false },
      { name: 'owner', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'CHARACTER' } },
      { name: 'location', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'LOCATION' } }
    ]
  },
  {
    kind: 'FACTION',
    attributes: [
      { name: 'type', type: 'Text', defaultValue: 'Organization' },
      { name: 'alignment', type: 'Text', defaultValue: 'Neutral' },
      { name: 'influence', type: 'ProgressBar', defaultValue: { current: 50, maximum: 100 } },
      { name: 'resources', type: 'ProgressBar', defaultValue: { current: 50, maximum: 100 } },
      { name: 'territory', type: 'List', defaultValue: [] },
      { name: 'leader', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'NPC' } },
      { name: 'goals', type: 'List', defaultValue: [] },
      { name: 'enemies', type: 'List', defaultValue: [] },
      { name: 'allies', type: 'List', defaultValue: [] },
      { name: 'reputation', type: 'Number', defaultValue: 0 }
    ]
  },
  {
    kind: 'EVENT',
    attributes: [
      { name: 'type', type: 'Text', defaultValue: 'Plot' },
      { name: 'status', type: 'Text', defaultValue: 'Planned' },
      { name: 'date', type: 'Date', defaultValue: new Date().toISOString() },
      { name: 'location', type: 'EntityLink', defaultValue: { id: '', label: '', kind: 'LOCATION' } },
      { name: 'participants', type: 'List', defaultValue: [] },
      { name: 'consequences', type: 'List', defaultValue: [] },
      { name: 'triggers', type: 'List', defaultValue: [] },
      { name: 'importance', type: 'Number', defaultValue: 5 },
      { name: 'related_events', type: 'List', defaultValue: [] },
      { name: 'outcome', type: 'Text', defaultValue: '' }
    ]
  }
];
