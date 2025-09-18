
import { GraphRAG, GraphNode, RankedNode } from './graphrag';
import { HNSWAdapter } from './hnswAdapter';
import { createNoteChunks, TextChunk, preprocessText } from './textProcessing';
import { createNoteChunksSemantic } from './textProcessing';
import { SemanticChunkingOptions } from './semanticChunkingConfig';
import { providerRegistry } from './providers/ProviderRegistry';
import { EmbeddingProvider } from './providers/EmbeddingProvider';
import { upsertEmbedding, deleteEmbedding, searchByEmbedding, clearEntityDB, EntityDBResult, getEntityDBCount, getAllEmbeddings } from '../vector/entitydbStore';

export interface EmbeddingWorkerMessage {
  source: string;
  text?: string | string[];
  isQuery?: boolean;
}

export interface EmbeddingWorkerResponse {
  status: 'complete' | 'error' | 'progress';
  embeddings?: number[][];
  error?: string;
}

export interface SearchResult {
  noteId: string;
  title: string;
  content: string;
  score: number;
  graphScore?: number;
}

export type SearchBackend = 'graphrag' | 'entitydb';

export interface IndexStatus {
  hasIndex: boolean;
  indexSize: number;
  needsRebuild: boolean;
  graphNodes: number;
  graphEdges: number;
}

export class EmbeddingsService {
  private graphRAG: GraphRAG | null = null;
  private hnswAdapter: HNSWAdapter | null = null;
  private isInitialized = false;
  private noteMetadata = new Map<string, { title: string; noteId: string }>();
  private currentProvider: EmbeddingProvider | null = null;
  private currentDimension: number | null = null;
  private searchBackend: SearchBackend = 'graphrag';

  constructor() {
    // Don't initialize components here - wait for provider initialization
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[EmbeddingsService] Initializing...');
      
      // Initialize provider registry first
      await providerRegistry.initializeFromStorage();
      this.currentProvider = providerRegistry.getActiveProvider();
      
      if (!this.currentProvider) {
        throw new Error('No embedding provider available');
      }

      console.log(`[EmbeddingsService] Active provider: ${this.currentProvider.name} (${this.currentProvider.dimension}D)`);

      // Initialize components with provider's dimensions
      await this.initializeComponents(this.currentProvider.dimension);
      
      // Load existing embeddings from EntityDB
      await this.loadFromEntityDB();
      
      this.isInitialized = true;
      console.log('[EmbeddingsService] Initialization complete');
    } catch (error) {
      console.error('Failed to initialize embeddings service:', error);
      throw error;
    }
  }

  private async initializeComponents(dimension: number): Promise<void> {
    if (!dimension || dimension <= 0) {
      throw new Error('Invalid dimension for component initialization');
    }

    console.log(`[EmbeddingsService] Initializing components with ${dimension}D`);
    
    // Update dimension tracking
    this.currentDimension = dimension;
    
    // Initialize or recreate components with correct dimensions
    this.graphRAG = new GraphRAG(dimension);
    this.hnswAdapter = new HNSWAdapter(dimension);
    
    console.log(`[EmbeddingsService] Components initialized with ${dimension}D`);
  }

  private async loadFromEntityDB(): Promise<void> {
    if (!this.currentProvider || !this.currentDimension || !this.graphRAG) {
      return;
    }

    try {
      console.log('[EmbeddingsService] Loading existing embeddings from EntityDB...');
      
      const storedEmbeddings = await getAllEmbeddings({
        vectorPath: this.getVectorPath(),
        dimension: this.currentDimension
      });

      console.log(`[EmbeddingsService] Found ${storedEmbeddings.length} stored embeddings`);

      // Restore nodes to GraphRAG
      for (const stored of storedEmbeddings) {
        if (stored.metadata && stored.text) {
          const node: GraphNode = {
            id: stored.id,
            content: stored.text,
            embedding: stored.metadata.embedding || [],
            metadata: stored.metadata
          };
          
          this.graphRAG.addNode(node);
          this.noteMetadata.set(stored.id, { 
            title: stored.metadata.title || 'Untitled', 
            noteId: stored.metadata.originalNoteId || stored.id
          });
        }
      }

      // Rebuild graph edges if we have nodes
      if (storedEmbeddings.length > 0) {
        console.log('[EmbeddingsService] Rebuilding graph edges...');
        this.graphRAG.buildSequentialEdges({ metadataKey: 'chunkIndex', groupBy: 'originalNoteId' });
        this.graphRAG.buildSemanticEdges({
          threshold: 0.82,
          index: this.hnswAdapter,
          k: Math.min(5, Math.max(1, storedEmbeddings.length - 1))
        });
      }

      console.log('[EmbeddingsService] Successfully loaded embeddings from EntityDB');
    } catch (error) {
      console.warn('Failed to load from EntityDB:', error);
    }
  }

  async switchProvider(providerId: string, apiKey?: string): Promise<void> {
    try {
      console.log(`[EmbeddingsService] Switching to provider: ${providerId}`);
      
      // Set API key for Gemini if provided
      if (providerId === 'gemini' && apiKey) {
        const geminiProvider = providerRegistry.getProvider('gemini') as any;
        if (geminiProvider && geminiProvider.setApiKey) {
          geminiProvider.setApiKey(apiKey);
        }
      }

      await providerRegistry.setActiveProvider(providerId);
      this.currentProvider = providerRegistry.getActiveProvider();
      
      if (this.currentProvider) {
        console.log(`[EmbeddingsService] Provider switched to ${this.currentProvider.name} (${this.currentProvider.dimension}D)`);
        
        // Reinitialize components with new provider's dimensions
        await this.initializeComponents(this.currentProvider.dimension);
      }
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  getCurrentProvider(): EmbeddingProvider | null {
    return this.currentProvider;
  }

  setSearchBackend(backend: SearchBackend): void {
    this.searchBackend = backend;
    console.log(`[EmbeddingsService] Search backend set to: ${backend}`);
  }

  getSearchBackend(): SearchBackend {
    return this.searchBackend;
  }

  private getVectorPath(): string {
    const providerId = this.currentProvider?.name.toLowerCase().replace(/\s+/g, '-') || 'unknown';
    return `notes-entitydb-${providerId}-v1`;
  }

  private async generateEmbeddings(text: string | string[], isQuery = false): Promise<number[][]> {
    if (!this.currentProvider) {
      throw new Error('No embedding provider initialized');
    }

    if (!this.currentDimension) {
      throw new Error('Dimension not set - service not properly initialized');
    }

    const texts = Array.isArray(text) ? text : [text];
    console.log(`[EmbeddingsService] Generating embeddings for ${texts.length} texts using ${this.currentProvider.name} (${this.currentProvider.dimension}D)`);
    
    const embeddings = await this.currentProvider.generateEmbeddings(texts, { isQuery });
    
    // Validate embedding dimensions
    if (embeddings.length > 0 && embeddings[0].length !== this.currentDimension) {
      throw new Error(`Embedding dimension mismatch: expected ${this.currentDimension}, got ${embeddings[0].length}`);
    }
    
    console.log(`[EmbeddingsService] Generated ${embeddings.length} embeddings of ${embeddings[0]?.length || 0} dimensions`);
    return embeddings;
  }

  /**
   * Add a note to the knowledge graph with enhanced chunking options
   */
  async addNote(
    noteId: string, 
    title: string, 
    content: string,
    chunkingMethod: 'semantic' | 'basic' | 'sentences' | 'original' = 'original',
    semanticOptions: SemanticChunkingOptions = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.graphRAG || !this.hnswAdapter) {
      throw new Error('Components not initialized');
    }

    try {
      console.log(`[EmbeddingsService] Adding note ${noteId} using ${chunkingMethod} chunking`);
      
      let chunks: TextChunk[];
      
      // Use semantic chunking if requested
      if (chunkingMethod !== 'original') {
        chunks = await createNoteChunksSemantic(
          noteId, 
          title, 
          content, 
          chunkingMethod,
          {
            maxTokenSize: 500,
            similarityThreshold: 0.7,
            combineChunks: true,
            logging: false,
            ...semanticOptions
          }
        );
      } else {
        // Use original chunking method
        chunks = createNoteChunks(noteId, title, content);
      }
      
      if (chunks.length === 0) {
        console.warn(`No chunks created for note ${noteId}`);
        return;
      }

      // Generate embeddings for all chunks
      const chunkTexts = chunks.map(chunk => chunk.text);
      const embeddings = await this.generateEmbeddings(chunkTexts);

      console.log(`[EmbeddingsService] Processing ${chunks.length} chunks for note ${noteId}`);

      // Add nodes to GraphRAG and EntityDB
      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];
        const nodeId = `${noteId}_chunk_${index}`;
        const embedding = embeddings[index];
        
        // Validate embedding before adding
        if (!embedding || embedding.length !== this.currentDimension) {
          throw new Error(`Invalid embedding for chunk ${index}: expected ${this.currentDimension}D, got ${embedding?.length || 0}D`);
        }
        
        const node: GraphNode = {
          id: nodeId,
          content: chunk.text,
          embedding: embedding,
          metadata: {
            ...chunk.metadata,
            originalNoteId: noteId,
            title: title,
            chunkingMethod
          }
        };
        
        this.graphRAG!.addNode(node);
        this.noteMetadata.set(nodeId, { title, noteId });

        // Also store in EntityDB for persistence
        try {
          await upsertEmbedding({
            vectorPath: this.getVectorPath(),
            dimension: this.currentDimension!,
            id: nodeId,
            text: chunk.text,
            embedding: embedding,
            metadata: {
              ...chunk.metadata,
              originalNoteId: noteId,
              title: title,
              chunkingMethod
            }
          });
        } catch (error) {
          console.warn(`Failed to store chunk ${nodeId} in EntityDB:`, error);
        }
      }

      const totalNodes = this.graphRAG.getNodes().length;

      // Sequential: clear and group per note
      this.graphRAG.clearEdges('sequential');
      this.graphRAG.buildSequentialEdges({ metadataKey: 'chunkIndex', groupBy: 'originalNoteId' });

      // Semantic: clear edges and index, then rebuild with tighter params
      this.graphRAG.clearEdges('semantic');
      if (this.hnswAdapter && typeof (this.hnswAdapter as any).clear === 'function') {
        (this.hnswAdapter as any).clear();
      }
      this.graphRAG.buildSemanticEdges({
        threshold: 0.82,
        index: this.hnswAdapter,
        k: Math.min(5, Math.max(1, totalNodes - 1))
      });

      console.log(`[EmbeddingsService] Successfully added note ${noteId} with ${chunks.length} chunks to knowledge graph`);
    } catch (error) {
      console.error(`Failed to add note ${noteId} to embeddings:`, error);
      throw error;
    }
  }

  /**
   * Remove a note from the knowledge graph
   */
  async removeNote(noteId: string): Promise<void> {
    const nodes = this.graphRAG!.getNodes();
    const nodesToRemove = nodes.filter(node =>
      node.metadata?.originalNoteId === noteId
    );

    // Clear and rebuild the graph without the removed note
    // This is a simple approach; more sophisticated implementations
    // might selectively remove nodes and edges
    if (nodesToRemove.length > 0) {
      const remainingNodes = nodes.filter(node =>
        node.metadata?.originalNoteId !== noteId
      );

      // Rebuild the graph
      this.graphRAG!.clear();
      this.hnswAdapter!.clear();

      // Re-add remaining nodes
      remainingNodes.forEach(node => {
        this.graphRAG!.addNode(node);
      });

      // Rebuild edges with tighter constraints
      const totalNodes = remainingNodes.length;
      this.graphRAG!.buildSemanticEdges({ 
        threshold: 0.82, 
        index: this.hnswAdapter!,
        k: Math.min(5, Math.max(1, totalNodes - 1))
      });
      this.graphRAG!.buildSequentialEdges({ metadataKey: 'chunkIndex', groupBy: 'originalNoteId' });

      // Also remove from EntityDB
      try {
        const deletePromises = nodesToRemove.map(node => 
          deleteEmbedding({
            vectorPath: this.getVectorPath(),
            dimension: this.currentDimension!,
            id: node.id
          })
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.warn(`Failed to remove note ${noteId} from EntityDB:`, error);
      }

      console.log(`Removed note ${noteId} from knowledge graph and EntityDB`);
    }
  }

  /**
   * Perform semantic search using selected backend
   */
  async search(query: string, topK: number = 10): Promise<SearchResult[]> {
    if (this.searchBackend === 'entitydb') {
      return this.searchEntityDB(query, topK);
    }
    return this.searchGraphRAG(query, topK);
  }

  /**
   * Search using EntityDB backend
   */
  async searchEntityDB(query: string, topK: number = 10): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.currentProvider || !this.currentDimension) {
      throw new Error('Provider not initialized');
    }

    try {
      console.log(`[EmbeddingsService] EntityDB search for: "${query}" (top ${topK})`);
      
      const processedQuery = preprocessText(query);
      const queryEmbeddings = await this.generateEmbeddings(processedQuery, true);
      const queryEmbedding = queryEmbeddings[0];

      if (!queryEmbedding || queryEmbedding.length !== this.currentDimension) {
        throw new Error(`Query embedding dimension mismatch: expected ${this.currentDimension}, got ${queryEmbedding?.length || 0}`);
      }

      const results = await searchByEmbedding({
        vectorPath: this.getVectorPath(),
        dimension: this.currentDimension,
        queryEmbedding,
        topK
      });

      // Convert to SearchResult format
      const searchResults = results.map(result => ({
        noteId: result.metadata?.originalNoteId || result.id,
        title: result.metadata?.title || 'Untitled',
        content: result.text || result.metadata?.text || '',
        score: result.score
      }));

      console.log(`[EmbeddingsService] EntityDB found ${searchResults.length} results`);
      return searchResults;
    } catch (error) {
      console.error('EntityDB search failed:', error);
      throw error;
    }
  }

  /**
   * Search using GraphRAG backend
   */
  async searchGraphRAG(query: string, topK: number = 10): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.graphRAG) {
      throw new Error('GraphRAG not initialized');
    }

    try {
      console.log(`[EmbeddingsService] GraphRAG search for: "${query}" (top ${topK})`);
      
      const processedQuery = preprocessText(query);
      const queryEmbeddings = await this.generateEmbeddings(processedQuery, true);
      const queryEmbedding = queryEmbeddings[0];

      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      if (queryEmbedding.length !== this.currentDimension) {
        throw new Error(`Query embedding dimension mismatch: expected ${this.currentDimension}, got ${queryEmbedding.length}`);
      }

      const results = this.graphRAG.query({
        queryEmbedding,
        topK,
        randomWalkSteps: 100,
        restartProb: 0.15,
        walkEdgeType: 'semantic'
      });

      // Convert to SearchResult format
      const searchResults = results.map(result => {
        const metadata = this.noteMetadata.get(result.id);
        return {
          noteId: result.metadata?.originalNoteId || result.id,
          title: metadata?.title || result.metadata?.title || 'Untitled',
          content: result.content,
          score: result.score
        };
      });

      console.log(`[EmbeddingsService] GraphRAG found ${searchResults.length} results`);
      return searchResults;
    } catch (error) {
      console.error('GraphRAG search failed:', error);
      throw error;
    }
  }

  /**
   * Sync all notes with enhanced chunking options
   */
  async syncAllNotes(
    notes: Array<{ id: string; title: string; content: string }>,
    chunkingMethod: 'semantic' | 'basic' | 'sentences' | 'original' = 'original',
    semanticOptions: SemanticChunkingOptions = {}
  ): Promise<number> {
    let syncedCount = 0;
    
    for (const note of notes) {
      try {
        await this.addNote(note.id, note.title, note.content, chunkingMethod, semanticOptions);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync note ${note.id}:`, error);
      }
    }
    
    return syncedCount;
  }

  async getIndexStatus(): Promise<IndexStatus> {
    // Handle case when components aren't initialized yet
    if (!this.graphRAG || !this.hnswAdapter || !this.currentDimension) {
      return {
        hasIndex: false,
        indexSize: 0,
        needsRebuild: false,
        graphNodes: 0,
        graphEdges: 0
      };
    }

    const nodes = this.graphRAG.getNodes();
    const edges = this.graphRAG.getEdges();
    
    // Get count from EntityDB for persistent storage
    let entityDBCount = 0;
    try {
      entityDBCount = await getEntityDBCount({
        vectorPath: this.getVectorPath(),
        dimension: this.currentDimension
      });
    } catch (error) {
      console.warn('Failed to get EntityDB count:', error);
    }
    
    // Use EntityDB count as the authoritative source for index size
    const indexSize = Math.max(nodes.length, entityDBCount);
    
    return {
      hasIndex: indexSize > 0,
      indexSize: indexSize,
      needsRebuild: false,
      graphNodes: nodes.length,
      graphEdges: edges.length
    };
  }

  clear(): void {
    if (this.graphRAG) {
      this.graphRAG.clear();
    }
    if (this.hnswAdapter) {
      this.hnswAdapter.clear();
    }
    // Also clear EntityDB
    if (this.currentDimension) {
      try {
        clearEntityDB({
          vectorPath: this.getVectorPath(),
          dimension: this.currentDimension
        });
      } catch (error) {
        console.warn('Failed to clear EntityDB:', error);
      }
    }
  }

  async getAtlasData(): Promise<Array<{ id: string; title: string; snippet: string; vector: number[] }>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.graphRAG) {
      console.warn('[EmbeddingsService] GraphRAG not initialized, returning empty atlas data');
      return [];
    }

    try {
      const nodes = this.graphRAG.getNodes();
      console.log(`[EmbeddingsService] Extracting atlas data from ${nodes.length} nodes`);
      
      return nodes.map(node => ({
        id: node.metadata?.originalNoteId || node.id,
        title: node.metadata?.title || 'Untitled',
        snippet: node.content.slice(0, 160),
        vector: node.embedding
      }));
    } catch (error) {
      console.error('Failed to get atlas data:', error);
      return [];
    }
  }

  dispose(): void {
    if (this.currentProvider) {
      this.currentProvider.dispose();
    }
    this.clear();
    this.isInitialized = false;
  }
}

// Create a singleton instance
export const embeddingsService = new EmbeddingsService();
