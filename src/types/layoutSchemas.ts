
import { AttributeType } from './attributes';

// Layout field display types
export type FieldDisplayType = 
  | 'key-value' 
  | 'tag-list' 
  | 'stat-group' 
  | 'relationship-list' 
  | 'long-text' 
  | 'label-only'
  | 'image'
  | 'timeline'
  | 'quotes';

// Layout field definition
export interface LayoutField {
  label: string;
  attribute: string;
  display: FieldDisplayType;
  options?: {
    icon?: string;
    subFields?: { label: string; attribute: string }[];
    placeholder?: string;
    maxLength?: number;
  };
}

// Layout section definition
export interface LayoutSection {
  title: string;
  icon: string;
  color: 'identity' | 'interactions' | 'progression' | 'general';
  fields: LayoutField[];
}

// Enhanced entity schema with layout
export interface EntityLayoutSchema {
  kind: string;
  icon: string;
  layout: LayoutSection[];
}

// Predefined layout schemas
export const LAYOUT_SCHEMAS: EntityLayoutSchema[] = [
  {
    kind: 'SKILL',
    icon: 'Sparkles',
    layout: [
      {
        title: 'classification & identity',
        icon: 'Tag',
        color: 'identity',
        fields: [
          { label: 'Category', attribute: 'category', display: 'key-value' },
          { label: 'Type', attribute: 'type', display: 'key-value' },
          { label: 'Origin', attribute: 'origin', display: 'key-value' },
          { label: 'Magic System', attribute: 'magicSystem', display: 'key-value' },
          { label: 'Rarity', attribute: 'rarity', display: 'key-value' },
          { label: 'Status', attribute: 'status', display: 'key-value' },
          { label: 'Aliases', attribute: 'aliases', display: 'tag-list' },
        ],
      },
      {
        title: 'interactions',
        icon: 'Link',
        color: 'interactions',
        fields: [
          { 
            label: 'Synergies', 
            attribute: 'synergies', 
            display: 'relationship-list',
            options: { icon: 'Plus' }
          },
          { 
            label: 'Counters', 
            attribute: 'counters', 
            display: 'relationship-list',
            options: { icon: 'X' }
          },
        ]
      },
      {
        title: 'learning & progression',
        icon: 'TrendingUp',
        color: 'progression',
        fields: [
          { label: 'Difficulty (Learn)', attribute: 'difficultyLearn', display: 'key-value' },
          { label: 'Difficulty (Master)', attribute: 'difficultyMaster', display: 'key-value' },
          { label: 'Training', attribute: 'training', display: 'key-value' },
          { 
            label: 'Prerequisites', 
            attribute: 'prerequisites', 
            display: 'stat-group'
          },
          { label: 'Required Skills', attribute: 'requiredSkills', display: 'tag-list' },
          { label: 'Bloodlines', attribute: 'bloodlines', display: 'tag-list' },
          { label: 'Races', attribute: 'races', display: 'tag-list' },
          { label: 'Progression', attribute: 'progressionText', display: 'long-text' },
          { label: 'Parent Skill', attribute: 'parentSkill', display: 'key-value' },
          { label: 'Leads To', attribute: 'childSkills', display: 'tag-list' },
        ]
      }
    ]
  },
  {
    kind: 'CHARACTER',
    icon: 'User',
    layout: [
      {
        title: 'identity & appearance',
        icon: 'User',
        color: 'identity',
        fields: [
          { label: 'Full Name', attribute: 'fullName', display: 'key-value' },
          { label: 'Age', attribute: 'age', display: 'key-value' },
          { label: 'Race', attribute: 'race', display: 'key-value' },
          { label: 'Class', attribute: 'class', display: 'key-value' },
          { label: 'Background', attribute: 'background', display: 'key-value' },
          { label: 'Occupation', attribute: 'occupation', display: 'key-value' },
          { label: 'Personality', attribute: 'personality', display: 'long-text' },
        ]
      },
      {
        title: 'abilities & progression',
        icon: 'Zap',
        color: 'progression',
        fields: [
          { label: 'Level', attribute: 'level', display: 'key-value' },
          { label: 'Health', attribute: 'health', display: 'stat-group' },
          { label: 'Mana', attribute: 'mana', display: 'stat-group' },
          { label: 'Stats', attribute: 'stats', display: 'stat-group' },
        ]
      },
      {
        title: 'relationships & affiliations',
        icon: 'Users',
        color: 'interactions',
        fields: [
          { label: 'Faction', attribute: 'faction', display: 'relationship-list' },
          { label: 'Allies', attribute: 'allies', display: 'tag-list' },
          { label: 'Enemies', attribute: 'enemies', display: 'tag-list' },
        ]
      }
    ]
  }
];

// Helper function to get layout schema by kind
export function getLayoutSchema(kind: string): EntityLayoutSchema | null {
  return LAYOUT_SCHEMAS.find(schema => schema.kind.toLowerCase() === kind.toLowerCase()) || null;
}
