
import { StoryStructure, StoryStructureNode, StoryPerspective, StoryHierarchyLevel } from '@/types/storyStructure';
import { Note } from '@/types/notes';
import { v4 as uuidv4 } from 'uuid';

export class StoryStructureService {
  private structure: StoryStructure | null = null;
  private readonly STORAGE_KEY = 'story-structure';

  /**
   * Initialize or load existing story structure
   */
  public initializeStructure(title: string = 'My Story'): StoryStructure {
    const saved = this.loadFromStorage();
    if (saved) {
      this.structure = saved;
      return saved;
    }

    // Create default perspectives
    const defaultPerspectives: StoryPerspective[] = [
      {
        id: 'chronological',
        name: 'Timeline View',
        type: 'chronological',
        viewConfig: {
          groupBy: 'timeline',
          sortBy: 'timelineStart',
          displayMode: 'timeline'
        }
      },
      {
        id: 'structural',
        name: 'Structure View',
        type: 'structural',
        viewConfig: {
          groupBy: 'level',
          sortBy: 'order',
          displayMode: 'hierarchy'
        }
      },
      {
        id: 'character',
        name: 'Character View',
        type: 'character',
        viewConfig: {
          groupBy: 'character',
          sortBy: 'timelineStart',
          displayMode: 'grid'
        }
      },
      {
        id: 'thematic',
        name: 'Theme View',
        type: 'thematic',
        viewConfig: {
          groupBy: 'theme',
          sortBy: 'relevance',
          displayMode: 'grid'
        }
      }
    ];

    this.structure = {
      id: uuidv4(),
      title,
      rootNodes: [],
      nodes: {},
      perspectives: defaultPerspectives,
      activeView: 'structural',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.structure;
  }

  /**
   * Create a new story structure node
   */
  public createNode(
    title: string,
    level: StoryHierarchyLevel,
    parentId?: string,
    metadata: Partial<StoryStructureNode['metadata']> = {}
  ): StoryStructureNode {
    if (!this.structure) {
      throw new Error('Story structure not initialized');
    }

    const node: StoryStructureNode = {
      id: uuidv4(),
      title,
      level,
      parentId,
      order: this.getNextOrder(parentId, level),
      noteIds: [],
      metadata: {
        status: 'draft',
        ...metadata
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.structure.nodes[node.id] = node;
    
    if (!parentId) {
      this.structure.rootNodes.push(node.id);
    }

    this.structure.updatedAt = new Date().toISOString();
    this.saveToStorage();

    console.log('[StoryStructure] Created node:', node.title, level);
    return node;
  }

  /**
   * Associate notes with a story structure node
   */
  public associateNotes(nodeId: string, noteIds: string[]): void {
    if (!this.structure || !this.structure.nodes[nodeId]) {
      throw new Error('Node not found');
    }

    this.structure.nodes[nodeId].noteIds = [...new Set([...this.structure.nodes[nodeId].noteIds, ...noteIds])];
    this.structure.nodes[nodeId].updatedAt = new Date().toISOString();
    this.structure.updatedAt = new Date().toISOString();
    this.saveToStorage();

    console.log('[StoryStructure] Associated notes with node:', nodeId, noteIds);
  }

  /**
   * Get story structure organized by perspective
   */
  public getStructureByPerspective(perspectiveId: string): any {
    if (!this.structure) return null;

    const perspective = this.structure.perspectives.find(p => p.id === perspectiveId);
    if (!perspective) return null;

    switch (perspective.type) {
      case 'structural':
        return this.getHierarchicalView();
      case 'chronological':
        return this.getChronologicalView();
      case 'character':
        return this.getCharacterView(perspective.filters?.characterId);
      case 'thematic':
        return this.getThematicView();
      default:
        return this.getHierarchicalView();
    }
  }

  /**
   * Get hierarchical structure view
   */
  public getHierarchicalView(): any {
    if (!this.structure) return null;

    const buildHierarchy = (nodeIds: string[], level: number = 0): any[] => {
      return nodeIds.map(nodeId => {
        const node = this.structure!.nodes[nodeId];
        if (!node) return null;

        const children = Object.values(this.structure!.nodes)
          .filter(n => n.parentId === nodeId)
          .sort((a, b) => a.order - b.order)
          .map(n => n.id);

        return {
          ...node,
          level,
          children: children.length > 0 ? buildHierarchy(children, level + 1) : []
        };
      }).filter(Boolean);
    };

    return buildHierarchy(this.structure.rootNodes);
  }

  /**
   * Get chronological timeline view
   */
  public getChronologicalView(): any {
    if (!this.structure) return null;

    const nodesWithTimeline = Object.values(this.structure.nodes)
      .filter(node => node.metadata.timelineStart)
      .sort((a, b) => {
        const timeA = new Date(a.metadata.timelineStart!).getTime();
        const timeB = new Date(b.metadata.timelineStart!).getTime();
        return timeA - timeB;
      });

    return {
      type: 'timeline',
      events: nodesWithTimeline.map(node => ({
        id: node.id,
        title: node.title,
        level: node.level,
        start: node.metadata.timelineStart,
        end: node.metadata.timelineEnd,
        characters: node.metadata.characters || [],
        locations: node.metadata.locations || [],
        noteIds: node.noteIds
      }))
    };
  }

  /**
   * Get character-focused view
   */
  public getCharacterView(characterId?: string): any {
    if (!this.structure) return null;

    const characterNodes = Object.values(this.structure.nodes)
      .filter(node => 
        !characterId || (node.metadata.characters && node.metadata.characters.includes(characterId))
      );

    const groupedByCharacter: Record<string, any[]> = {};

    characterNodes.forEach(node => {
      const characters = node.metadata.characters || ['Unknown'];
      characters.forEach(char => {
        if (!groupedByCharacter[char]) {
          groupedByCharacter[char] = [];
        }
        groupedByCharacter[char].push(node);
      });
    });

    return {
      type: 'character-grouped',
      groups: Object.entries(groupedByCharacter).map(([character, nodes]) => ({
        character,
        nodes: nodes.sort((a, b) => {
          if (a.metadata.timelineStart && b.metadata.timelineStart) {
            return new Date(a.metadata.timelineStart).getTime() - new Date(b.metadata.timelineStart).getTime();
          }
          return a.order - b.order;
        })
      }))
    };
  }

  /**
   * Get thematic clustering view
   */
  public getThematicView(): any {
    if (!this.structure) return null;

    const thematicNodes = Object.values(this.structure.nodes)
      .filter(node => node.metadata.themes && node.metadata.themes.length > 0);

    const groupedByTheme: Record<string, any[]> = {};

    thematicNodes.forEach(node => {
      const themes = node.metadata.themes || ['Uncategorized'];
      themes.forEach(theme => {
        if (!groupedByTheme[theme]) {
          groupedByTheme[theme] = [];
        }
        groupedByTheme[theme].push(node);
      });
    });

    return {
      type: 'theme-grouped',
      groups: Object.entries(groupedByTheme).map(([theme, nodes]) => ({
        theme,
        nodes: nodes.sort((a, b) => a.order - b.order)
      }))
    };
  }

  /**
   * Switch active perspective
   */
  public switchPerspective(perspectiveId: string): void {
    if (!this.structure) return;

    const perspective = this.structure.perspectives.find(p => p.id === perspectiveId);
    if (perspective) {
      this.structure.activeView = perspectiveId;
      this.structure.updatedAt = new Date().toISOString();
      this.saveToStorage();
      console.log('[StoryStructure] Switched to perspective:', perspective.name);
    }
  }

  /**
   * Get current structure
   */
  public getStructure(): StoryStructure | null {
    return this.structure;
  }

  private getNextOrder(parentId?: string, level?: StoryHierarchyLevel): number {
    if (!this.structure) return 0;

    const siblings = Object.values(this.structure.nodes).filter(node => 
      node.parentId === parentId && (!level || node.level === level)
    );

    return siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
  }

  private saveToStorage(): void {
    if (this.structure) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.structure));
      } catch (error) {
        console.error('[StoryStructure] Failed to save to storage:', error);
      }
    }
  }

  private loadFromStorage(): StoryStructure | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('[StoryStructure] Failed to load from storage:', error);
      return null;
    }
  }
}

export const storyStructureService = new StoryStructureService();
