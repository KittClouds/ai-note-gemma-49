
export type StoryHierarchyLevel = 'series' | 'book' | 'act' | 'chapter' | 'scene';

export interface StoryStructureNode {
  id: string;
  title: string;
  level: StoryHierarchyLevel;
  parentId?: string;
  order: number;
  noteIds: string[]; // Notes associated with this structural element
  metadata: {
    description?: string;
    timelineStart?: string;
    timelineEnd?: string;
    characters?: string[];
    locations?: string[];
    themes?: string[];
    pov?: string;
    status?: 'draft' | 'in-progress' | 'complete' | 'needs-revision';
  };
  createdAt: string;
  updatedAt: string;
}

export interface StoryPerspective {
  id: string;
  name: string;
  type: 'chronological' | 'structural' | 'character' | 'thematic' | 'location';
  filters?: {
    characterId?: string;
    theme?: string;
    location?: string;
    timeRange?: { start: string; end: string };
  };
  viewConfig: {
    groupBy: string;
    sortBy: string;
    displayMode: 'timeline' | 'hierarchy' | 'grid' | 'list';
  };
}

export interface StoryStructure {
  id: string;
  title: string;
  description?: string;
  rootNodes: string[]; // Top-level series/book IDs
  nodes: Record<string, StoryStructureNode>;
  perspectives: StoryPerspective[];
  activeView: string; // Current perspective ID
  createdAt: string;
  updatedAt: string;
}
