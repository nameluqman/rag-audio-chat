const axios = require('axios');

class GooseAIService {
  constructor() {
    this.apiKey = process.env.GOOSEAI_API_KEY;
    // GooseAI uses OpenAI-compatible API
    this.baseURL = 'https://api.goose.ai/v1';
    
    if (!this.apiKey) {
      throw new Error('GOOSEAI_API_KEY environment variable is required');
    }
  }

  // Create text embedding using GooseAI
  async createEmbedding(text) {
    try {
      console.log('Creating embedding with GooseAI...');
      
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          input: text,
          model: 'text-embedding-ada-002'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Embedding created successfully');
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error.response?.data || error.message);
      
      // Try alternative endpoint if main one fails
      if (error.response?.status === 404) {
        console.log('Trying alternative OpenAI endpoint...');
        try {
          const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
              input: text,
              model: 'text-embedding-ada-002'
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.data[0].embedding;
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError.response?.data || altError.message);
        }
      }
      
      throw new Error('Failed to create embedding');
    }
  }

  // Generate chat completion using GooseAI
  async chatCompletion(messages, temperature = 0.7, maxTokens = 500) {
    try {
      console.log('Creating chat completion with GooseAI...');
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
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
      
      console.log('Chat completion created successfully');
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error creating chat completion:', error.response?.data || error.message);
      
      // Try alternative endpoint if main one fails
      if (error.response?.status === 404) {
        console.log('Trying alternative OpenAI endpoint...');
        try {
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
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
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError.response?.data || altError.message);
        }
      }
      
      throw new Error('Failed to generate chat completion');
    }
  }
}

module.exports = new GooseAIService();
