const gooseai = require('../services/gooseai');

// Generate embedding for a single text
async function generateEmbedding(text) {
  try {
    const embedding = await gooseai.createEmbedding(text);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Generate embeddings for multiple texts in batch
async function generateBatchEmbeddings(texts) {
  try {
    const embeddings = [];
    
    // Process texts in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings
};
