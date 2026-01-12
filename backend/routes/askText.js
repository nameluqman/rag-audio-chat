const express = require('express');
const router = express.Router();
const gooseai = require('../services/gooseai');
const { searchSimilarChunks, buildContext } = require('../rag/search');

// POST /ask-text endpoint
router.post('/', async (req, res) => {
  try {
    const { question } = req.body;
    
    // Validate input
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Question is required and must be a string'
      });
    }
    
    console.log(`Processing text question: "${question}"`);
    
    // Search for relevant context
    const searchResults = await searchSimilarChunks(question, 3);
    const context = buildContext(searchResults);
    
    // Build prompt with context
    const systemPrompt = `You are a helpful AI assistant. Use the provided context to answer the user's question. 
If the context doesn't contain enough information to answer the question, say so politely. 
Always base your answer on the provided context when possible.

Context:
${context}

User Question: ${question}

Please provide a helpful answer based on the context above:`;
    
    // Prepare messages for chat completion
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: question
      }
    ];
    
    // Generate answer using GooseAI
    const answer = await gooseai.chatCompletion(messages, 0.7, 500);
    
    // Return response
    res.json({
      success: true,
      question: question,
      answer: answer,
      contextUsed: searchResults.length > 0,
      sources: searchResults.map(result => ({
        file: result.source,
        chunkIndex: result.chunkIndex,
        similarity: result.similarity
      }))
    });
    
  } catch (error) {
    console.error('Error in askText route:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process your question'
    });
  }
});

module.exports = router;
