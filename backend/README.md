# RAG Audio Chat Backend

Backend server for the RAG Audio Chat system with text and audio question-answering capabilities.

## Features

- **Text Q&A**: Process text questions and get contextual answers
- **Audio Q&A**: Process audio questions, transcribe, answer, and convert response to audio
- **RAG Pipeline**: Retrieve-augmented generation with vector similarity search
- **GooseAI Integration**: OpenAI-compatible LLM for embeddings and chat completions
- **Modular Services**: Separate services for STT, TTS, and LLM interactions

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Add your GooseAI API key to `.env`:
```
GOOSEAI_API_KEY=your_gooseai_api_key_here
PORT=5000
```

4. Add your documents to the `data/` directory as `.txt` files:
```
backend/data/
├── document1.txt
├── document2.txt
└── document3.txt
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Text Question
- `POST /ask-text` - Ask a text question
  ```json
  {
    "question": "What is the main topic of the documents?"
  }
  ```

### Audio Question
- `POST /ask-audio` - Ask an audio question (multipart/form-data)
  - Field: `audio` (audio file)
  
  Response includes:
  - `transcribedText`: The speech-to-text result
  - `textAnswer`: The generated text answer
  - `audioAnswer`: Base64-encoded audio response

## Architecture

```
backend/
├── server.js              # Express server setup
├── package.json           # Dependencies
├── .env.example          # Environment variables template
├── routes/               # API route handlers
│   ├── askText.js        # Text question endpoint
│   └── askAudio.js       # Audio question endpoint
├── services/             # External service integrations
│   ├── gooseai.js        # GooseAI API client
│   ├── stt.js           # Speech-to-Text service
│   └── tts.js           # Text-to-Speech service
├── rag/                  # RAG pipeline components
│   ├── embed.js         # Embedding generation
│   ├── ingest.js        # Document ingestion
│   └── search.js        # Vector similarity search
├── data/                 # Document storage
└── uploads/             # Temporary audio uploads
```

## Services

### GooseAI Service
- `createEmbedding(text)`: Generate text embeddings
- `chatCompletion(messages)`: Generate chat responses

### STT Service (Mock)
- `transcribeAudio(audioBuffer)`: Convert audio to text
- Currently returns mock text - replace with Whisper or other STT service

### TTS Service (Mock)
- `synthesizeSpeech(text)`: Convert text to audio
- Currently returns mock audio - replace with real TTS service

## RAG Pipeline

1. **Ingestion**: Documents are chunked and embedded on server start
2. **Search**: Query is embedded and compared against stored chunks
3. **Context**: Top similar chunks are used as context
4. **Generation**: Context + question is sent to LLM for answer

## Error Handling

- All endpoints include comprehensive error handling
- Audio files are cleaned up after processing
- Rate limiting and batch processing for embeddings

## Development Notes

- Vector storage is in-memory for simplicity
- In production, use a proper vector database (Pinecone, Weaviate, etc.)
- STT and TTS services are mocked - replace with real implementations
- Add authentication and rate limiting for production use
