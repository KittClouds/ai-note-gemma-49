
import { Note } from '@/types/notes';
import { QPSConfig, SearchResult } from './types';
import { TextProcessor } from './TextProcessor';
import { IndexStore } from './IndexStore';
import { Indexer } from './Indexer';
import { Searcher } from './Searcher';
import { Serializable, SerializedFields } from '@/lib/serialization';
import { createChecksum } from '@/lib/utils/checksum';

export interface QPSSearchResult {
  noteId: string;
  title: string;
  content: string;
  score: number;
}

export interface QPSIndexStatus {
  hasIndex: boolean;
  totalDocuments: number;
  totalTokens: number;
  indexSize: number;
  needsRebuild: boolean;
}

const DEFAULT_CONFIG: Required<QPSConfig> = {
  maxSegments: 16,
  proximityBonus: 0.5,
};

class QPSService extends Serializable {
  ns_serializable = true;
  ns_namespace = ['notes', 'search', 'qps'];
  private config: Required<QPSConfig>;
  private textProcessor: TextProcessor;
  private store: IndexStore;
  private indexer: Indexer;
  private searcher: Searcher;

  constructor(kwargs?: SerializedFields) {
    super(kwargs);
    this.config = { ...DEFAULT_CONFIG, ...(kwargs?.config || {}) };
    this.textProcessor = new TextProcessor();
    this.store = new IndexStore();
    
    // Restore serialized data if available
    if (kwargs?.storeData) {
      this.store.deserialize(kwargs.storeData);
    }
    
    this.indexer = new Indexer(this.config, this.textProcessor, this.store);
    this.searcher = new Searcher(this.config, this.textProcessor, this.store);
    
    console.log("🔮 QPSService (Quantum Proximity Search) initialized");
  }

  get ns_attributes(): SerializedFields {
    return {
      config: this.config,
      storeData: this.store.serialize(),
    };
  }

  async search(query: string, limit: number = 10): Promise<QPSSearchResult[]> {
    if (!query.trim()) return [];
    
    console.log(`🔍 QPS searching for: "${query}"`);
    
    try {
      const results = await this.searcher.search(query);
      
      return results.slice(0, limit).map(result => {
        const doc = this.store.getDoc(result.docId);
        return {
          noteId: result.docId,
          title: this.extractTitle(result.content),
          content: result.content,
          score: result.score,
        };
      });
    } catch (error) {
      console.error('QPS search failed:', error);
      throw error;
    }
  }

  syncAllNotes(notes: Note[]): number {
    console.log(`📚 Syncing ${notes.length} notes to QPS index`);
    
    this.store.clear();
    let syncedCount = 0;

    for (const note of notes) {
      if (note.type === 'note' && note.content) {
        try {
          // Use async method synchronously for now - can be improved later
          this.indexer.index(note.id, note.content);
          syncedCount++;
        } catch (error) {
          console.warn(`Failed to index note ${note.id}:`, error);
        }
      }
    }

    console.log(`✅ QPS indexed ${syncedCount} notes`);
    return syncedCount;
  }

  getIndexStatus(): QPSIndexStatus {
    const totalDocuments = this.store.docStore.size;
    const totalTokens = Array.from(this.store.invertedIndex.keys()).length;
    
    return {
      hasIndex: totalDocuments > 0,
      totalDocuments,
      totalTokens,
      indexSize: totalDocuments,
      needsRebuild: false,
    };
  }

  clearIndex(): void {
    this.store.clear();
    console.log("🗑️ QPS index cleared");
  }

  /**
   * Generate a checksum for the current index state
   */
  async getIndexChecksum(): Promise<string> {
    const indexData = {
      config: this.config,
      storeData: this.store.serialize()
    };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(indexData));
    return await createChecksum(data);
  }

  /**
   * Serialize the index for persistence
   */
  serialize(): string {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Deserialize and restore index from serialized data
   */
  static deserialize(serializedData: string): QPSService {
    const data = JSON.parse(serializedData);
    if (data.type === 'constructor' && data.kwargs) {
      return new QPSService(data.kwargs);
    }
    throw new Error('Invalid serialized QPS data');
  }

  /**
   * Get index metadata for persistence
   */
  async getIndexMetadata() {
    return {
      version: '1.0',
      documentCount: this.store.docStore.size,
      tokenCount: this.store.invertedIndex.size,
      checksum: await this.getIndexChecksum(),
      config: this.config
    };
  }

  private extractTitle(content: string): string {
    // Extract first line or first 50 characters as title
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length <= 100) {
      return firstLine;
    }
    return content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
  }
}

export const qpsService = new QPSService();
export { QPSService };
