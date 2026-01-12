const fs = require('fs').promises;
const path = require('path');
const { generateBatchEmbeddings } = require('./embed');

// In-memory storage for embeddings and chunks
// In production, use a proper vector database like Pinecone, Weaviate, or Chroma
let vectorStore = {
  chunks: [],
  embeddings: []
};

// Chunk size for text splitting
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

// Split text into overlapping chunks
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    
    if (i + chunkSize >= words.length) break;
  }
  
  return chunks;
}

// Load and process all text files from data directory
async function ingestDocuments() {
  try {
    console.log('Starting document ingestion...');
    
    // Clear existing data
    vectorStore.chunks = [];
    vectorStore.embeddings = [];
    
    // Read all .txt files from data directory
    const dataDir = path.join(__dirname, '../data');
    const files = await fs.readdir(dataDir);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    
    if (textFiles.length === 0) {
      console.log('No .txt files found in data directory');
      return;
    }
    
    console.log(`Found ${textFiles.length} text files`);
    
    // Process each file
    const allChunks = [];
    
    for (const file of textFiles) {
      const filePath = path.join(dataDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      console.log(`Processing file: ${file}`);
      
      // Split into chunks
      const chunks = chunkText(content);
      
      // Add metadata to each chunk
      chunks.forEach((chunk, index) => {
        allChunks.push({
          text: chunk,
          source: file,
          chunkIndex: index
        });
      });
    }
    
    console.log(`Generated ${allChunks.length} chunks`);
    
    // Generate embeddings for all chunks
    const chunkTexts = allChunks.map(chunk => chunk.text);
    const embeddings = await generateBatchEmbeddings(chunkTexts);
    
    // Store in vector store
    vectorStore.chunks = allChunks;
    vectorStore.embeddings = embeddings;
    
    console.log('Document ingestion completed successfully');
    console.log(`Stored ${vectorStore.chunks.length} chunks with embeddings`);
    
  } catch (error) {
    console.error('Error during document ingestion:', error);
    throw error;
  }
}

// Get the vector store (for use in search)
function getVectorStore() {
  return vectorStore;
}

// Initialize ingestion on module load
ingestDocuments().catch(console.error);

module.exports = {
  ingestDocuments,
  getVectorStore
};
