const { generateEmbedding } = require('./embed');
const { getVectorStore } = require('./ingest');

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

// Search for most similar chunks based on query
async function searchSimilarChunks(query, topK = 3) {
  try {
    // Get vector store
    const vectorStore = getVectorStore();
    
    if (vectorStore.chunks.length === 0) {
      console.log('No documents in vector store');
      return [];
    }
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Calculate similarities
    const similarities = vectorStore.embeddings.map((embedding, index) => {
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return {
        chunk: vectorStore.chunks[index],
        similarity: similarity,
        index: index
      };
    });
    
    // Sort by similarity (descending) and take top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, topK);
    
    console.log(`Found ${topResults.length} similar chunks for query: "${query}"`);
    
    return topResults.map(result => ({
      text: result.chunk.text,
      source: result.chunk.source,
      chunkIndex: result.chunk.chunkIndex,
      similarity: result.similarity
    }));
    
  } catch (error) {
    console.error('Error searching similar chunks:', error);
    throw error;
  }
}

// Build context string from search results
function buildContext(searchResults) {
  if (searchResults.length === 0) {
    return "No relevant context found in the documents.";
  }
  
  return searchResults.map((result, index) => {
    return `[Context ${index + 1} from ${result.source}]:\n${result.text}`;
  }).join('\n\n');
}

module.exports = {
  searchSimilarChunks,
  buildContext,
  cosineSimilarity
};
