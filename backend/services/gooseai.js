const axios = require('axios');

class GooseAIService {
  constructor() {
    this.apiKey = process.env.GOOSEAI_API_KEY;
    this.baseURL = 'https://api.goose.ai/v1';
    
    if (!this.apiKey) {
      throw new Error('GOOSEAI_API_KEY environment variable is required');
    }
  }

  // Create text embedding using GooseAI
  async createEmbedding(text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          input: text,
          model: 'text-embedding-ada-002' // Common embedding model
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error.response?.data || error.message);
      throw new Error('Failed to create embedding');
    }
  }

  // Generate chat completion using GooseAI
  async chatCompletion(messages, temperature = 0.7, maxTokens = 500) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo', // Common chat model
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error creating chat completion:', error.response?.data || error.message);
      throw new Error('Failed to generate chat completion');
    }
  }
}

module.exports = new GooseAIService();
