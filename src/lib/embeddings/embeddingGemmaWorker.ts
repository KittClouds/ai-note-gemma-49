import { pipeline } from "@huggingface/transformers";

class EmbeddingGemmaFeatureExtractionPipeline {
  static model_id = "onnx-community/embeddinggemma-300m-ONNX";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      console.log('[EmbeddingGemmaWorker] Loading EmbeddingGemma model...');
      
      this.instance = await pipeline("feature-extraction", this.model_id, {
        dtype: "fp32", // Options: "fp32" | "q8" | "q4"
        progress_callback
      });
    }

    return this.instance;
  }
}

// Request queue for handling multiple embedding requests
const requestQueue = new Map();
let isProcessing = false;
let isInitialized = false;

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  const { type, id, texts, options } = event.data;

  if (type === 'initialize') {
    try {
      console.log('[EmbeddingGemmaWorker] Initializing EmbeddingGemma 300M model...');
      
      await EmbeddingGemmaFeatureExtractionPipeline.getInstance((x) => {
        self.postMessage({ type: 'progress', data: x });
      });

      isInitialized = true;
      self.postMessage({ type: 'ready' });
      console.log('[EmbeddingGemmaWorker] EmbeddingGemma model ready');
    } catch (error) {
      console.error('[EmbeddingGemmaWorker] Failed to initialize:', error);
      self.postMessage({ type: 'error', error: error.message });
    }
    return;
  }

  if (type === 'generate') {
    if (!isInitialized) {
      self.postMessage({
        type: 'error',
        id,
        error: 'Worker not initialized'
      });
      return;
    }

    // Handle batch requests
    if (Array.isArray(texts)) {
      try {
        const extractor = await EmbeddingGemmaFeatureExtractionPipeline.getInstance();

        console.log(`[EmbeddingGemmaWorker] Processing ${texts.length} texts`);

        // Generate embeddings using pipeline
        const embeddings = await extractor(texts, { 
          pooling: 'mean', 
          normalize: true 
        });

        // Send batch results back
        self.postMessage({
          type: 'complete',
          id,
          embeddings: embeddings.tolist()
        });
      } catch (error) {
        console.error('[EmbeddingGemmaWorker] Generation failed:', error);
        self.postMessage({
          type: 'error',
          id,
          error: error.message
        });
      }
      return;
    }

    // Handle single requests with queue
    if (id) {
      requestQueue.set(id, { texts, options });
      
      if (!isProcessing) {
        processQueue();
      }
      return;
    }
  }
});

async function processQueue() {
  if (isProcessing || requestQueue.size === 0 || !isInitialized) return;
  
  isProcessing = true;
  
  try {
    const extractor = await EmbeddingGemmaFeatureExtractionPipeline.getInstance();
    
    // Process requests in batches for efficiency
    const batchSize = 5;
    const entries = Array.from(requestQueue.entries());
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchTexts = batch.map(([_, { texts }]) => {
        return Array.isArray(texts) ? texts[0] : texts;
      });
      
      // Generate embeddings using pipeline
      const embeddings = await extractor(batchTexts, { 
        pooling: 'mean', 
        normalize: true 
      });
      const embeddingList = embeddings.tolist();
      
      // Send individual responses
      batch.forEach(([id], index) => {
        self.postMessage({
          type: 'complete',
          id,
          embeddings: [embeddingList[index]]
        });
        requestQueue.delete(id);
      });
    }
  } catch (error) {
    console.error('[EmbeddingGemmaWorker] Queue processing failed:', error);
    // Send error to all pending requests
    for (const [id] of requestQueue) {
      self.postMessage({
        type: 'error',
        id,
        error: error.message
      });
    }
    requestQueue.clear();
  }
  
  isProcessing = false;
  
  // Process any new requests that came in
  if (requestQueue.size > 0) {
    setTimeout(processQueue, 10);
  }
}