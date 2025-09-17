
import { Note } from '@/types/notes';
import { parseAllNotes, Entity, Triple } from '@/utils/parsingUtils';

export interface GlobalEntity extends Entity {
  occurrences: number;
  noteIds: string[];
  noteTitles: string[];
  firstMentioned: string; // ISO date string
  lastMentioned: string; // ISO date string
}

export interface EntityUsageStats {
  totalEntities: number;
  entitiesByType: Record<string, number>;
  mostUsedEntities: GlobalEntity[];
  recentEntities: GlobalEntity[];
  orphanedEntities: GlobalEntity[]; // entities mentioned only once
}

export interface EntityCrossReference {
  entityId: string;
  relatedEntities: string[];
  coOccurrenceCount: number;
  sharedNotes: string[];
}

export class GlobalEntityService {
  
  /**
   * Analyze all entities across the entire project
   */
  public analyzeGlobalEntities(notes: Note[]): {
    globalEntities: GlobalEntity[];
    entityStats: EntityUsageStats;
    crossReferences: EntityCrossReference[];
  } {
    console.log('[GlobalEntityService] Analyzing entities across', notes.length, 'notes');
    
    // Parse all notes to get entities
    const { entitiesMap } = parseAllNotes(notes.map(note => ({
      id: note.id,
      content: note.content,
      type: note.type
    })));
    
    // Create a map to aggregate entity data
    const entityAggregation = new Map<string, {
      entity: Entity;
      noteIds: string[];
      noteTitles: string[];
      dates: string[];
    }>();
    
    // Process each note's entities
    Array.from(entitiesMap.entries()).forEach(([noteId, entities]) => {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
      
      entities.forEach(entity => {
        const entityKey = `${entity.kind}:${entity.label}`;
        
        if (!entityAggregation.has(entityKey)) {
          entityAggregation.set(entityKey, {
            entity,
            noteIds: [],
            noteTitles: [],
            dates: []
          });
        }
        
        const aggregated = entityAggregation.get(entityKey)!;
        if (!aggregated.noteIds.includes(noteId)) {
          aggregated.noteIds.push(noteId);
          aggregated.noteTitles.push(note.title);
          aggregated.dates.push(note.updatedAt);
        }
      });
    });
    
    // Convert to GlobalEntity objects
    const globalEntities: GlobalEntity[] = Array.from(entityAggregation.values()).map(aggregated => ({
      ...aggregated.entity,
      occurrences: aggregated.noteIds.length,
      noteIds: aggregated.noteIds,
      noteTitles: aggregated.noteTitles,
      firstMentioned: aggregated.dates.sort()[0],
      lastMentioned: aggregated.dates.sort().reverse()[0]
    }));
    
    // Generate statistics
    const entityStats = this.generateEntityStats(globalEntities);
    
    // Generate cross-references
    const crossReferences = this.generateCrossReferences(globalEntities, entitiesMap);
    
    console.log('[GlobalEntityService] Analysis complete:', {
      totalEntities: globalEntities.length,
      entityTypes: Object.keys(entityStats.entitiesByType).length
    });
    
    return {
      globalEntities,
      entityStats,
      crossReferences
    };
  }
  
  /**
   * Generate usage statistics for entities
   */
  private generateEntityStats(globalEntities: GlobalEntity[]): EntityUsageStats {
    const entitiesByType: Record<string, number> = {};
    
    globalEntities.forEach(entity => {
      entitiesByType[entity.kind] = (entitiesByType[entity.kind] || 0) + 1;
    });
    
    // Sort by occurrences for most used
    const mostUsedEntities = [...globalEntities]
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);
    
    // Sort by last mentioned for recent entities
    const recentEntities = [...globalEntities]
      .sort((a, b) => new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime())
      .slice(0, 10);
    
    // Find orphaned entities (mentioned only once)
    const orphanedEntities = globalEntities.filter(entity => entity.occurrences === 1);
    
    return {
      totalEntities: globalEntities.length,
      entitiesByType,
      mostUsedEntities,
      recentEntities,
      orphanedEntities
    };
  }
  
  /**
   * Generate cross-references between entities
   */
  private generateCrossReferences(
    globalEntities: GlobalEntity[], 
    entitiesMap: Map<string, Entity[]>
  ): EntityCrossReference[] {
    const crossReferences: EntityCrossReference[] = [];
    
    globalEntities.forEach(entity => {
      const entityKey = `${entity.kind}:${entity.label}`;
      const relatedEntities = new Set<string>();
      const sharedNotes = new Set<string>();
      
      // Find entities that co-occur in the same notes
      entity.noteIds.forEach(noteId => {
        const noteEntities = entitiesMap.get(noteId) || [];
        noteEntities.forEach(otherEntity => {
          const otherKey = `${otherEntity.kind}:${otherEntity.label}`;
          if (otherKey !== entityKey) {
            relatedEntities.add(otherKey);
            sharedNotes.add(noteId);
          }
        });
      });
      
      if (relatedEntities.size > 0) {
        crossReferences.push({
          entityId: entityKey,
          relatedEntities: Array.from(relatedEntities),
          coOccurrenceCount: relatedEntities.size,
          sharedNotes: Array.from(sharedNotes)
        });
      }
    });
    
    return crossReferences;
  }
  
  /**
   * Search entities globally
   */
  public searchEntities(
    globalEntities: GlobalEntity[], 
    query: string, 
    filters?: {
      entityTypes?: string[];
      minOccurrences?: number;
      maxOccurrences?: number;
    }
  ): GlobalEntity[] {
    let filtered = globalEntities;
    
    // Apply text search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(entity => 
        entity.label.toLowerCase().includes(lowerQuery) ||
        entity.kind.toLowerCase().includes(lowerQuery) ||
        entity.noteTitles.some(title => title.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply filters
    if (filters) {
      if (filters.entityTypes && filters.entityTypes.length > 0) {
        filtered = filtered.filter(entity => filters.entityTypes!.includes(entity.kind));
      }
      
      if (filters.minOccurrences !== undefined) {
        filtered = filtered.filter(entity => entity.occurrences >= filters.minOccurrences!);
      }
      
      if (filters.maxOccurrences !== undefined) {
        filtered = filtered.filter(entity => entity.occurrences <= filters.maxOccurrences!);
      }
    }
    
    return filtered;
  }
  
  /**
   * Get entities by type
   */
  public getEntitiesByType(globalEntities: GlobalEntity[]): Record<string, GlobalEntity[]> {
    const entitiesByType: Record<string, GlobalEntity[]> = {};
    
    globalEntities.forEach(entity => {
      if (!entitiesByType[entity.kind]) {
        entitiesByType[entity.kind] = [];
      }
      entitiesByType[entity.kind].push(entity);
    });
    
    // Sort entities within each type by occurrences (descending)
    Object.keys(entitiesByType).forEach(type => {
      entitiesByType[type].sort((a, b) => b.occurrences - a.occurrences);
    });
    
    return entitiesByType;
  }
}

export const globalEntityService = new GlobalEntityService();
