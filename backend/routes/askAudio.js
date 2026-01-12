const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const gooseai = require('../services/gooseai');
const sttService = require('../services/stt');
const ttsService = require('../services/tts');
const { searchSimilarChunks, buildContext } = require('../rag/search');

// POST /ask-audio endpoint
router.post('/', async (req, res) => {
  try {
    // Check if audio file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Audio file is required'
      });
    }
    
    console.log(`Processing audio file: ${req.file.originalname}`);
    
    // Read audio file
    const audioBuffer = await fs.readFile(req.file.path);
    
    // Transcribe audio to text
    console.log('Transcribing audio...');
    const transcribedText = await sttService.transcribeAudio(audioBuffer);
    console.log(`Transcribed text: "${transcribedText}"`);
    
    // Search for relevant context
    const searchResults = await searchSimilarChunks(transcribedText, 3);
    const context = buildContext(searchResults);
    
    // Build prompt with context
    const systemPrompt = `You are a helpful AI assistant. Use the provided context to answer the user's question. 
If the context doesn't contain enough information to answer the question, say so politely. 
Always base your answer on the provided context when possible.

Context:
${context}

User Question (from audio): ${transcribedText}

Please provide a helpful answer based on the context above:`;
    
    // Prepare messages for chat completion
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: transcribedText
      }
    ];
    
    // Generate text answer using GooseAI
    console.log('Generating text answer...');
    const textAnswer = await gooseai.chatCompletion(messages, 0.7, 500);
    console.log(`Generated answer: "${textAnswer}"`);
    
    // Convert text answer to audio
    console.log('Converting answer to audio...');
    const audioAnswer = await ttsService.synthesizeSpeech(textAnswer);
    
    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError.message);
    }
    
    // Return response with audio as base64
    const audioBase64 = audioAnswer.toString('base64');
    
    res.json({
      success: true,
      transcribedText: transcribedText,
      textAnswer: textAnswer,
      audioAnswer: audioBase64,
      contextUsed: searchResults.length > 0,
      sources: searchResults.map(result => ({
        file: result.source,
        chunkIndex: result.chunkIndex,
        similarity: result.similarity
      }))
    });
    
  } catch (error) {
    console.error('Error in askAudio route:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError.message);
      }
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process your audio question'
    });
  }
});

module.exports = router;
