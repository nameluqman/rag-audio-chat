# RAG Audio Chat

A complete Text + Audio RAG (Retrieval Augmented Generation) system built with React frontend and Node.js backend, powered by GooseAI.

## Features

- **Text Q&A**: Ask questions via text input and get contextual answers
- **Audio Q&A**: Record audio questions, get transcribed, answered, and receive audio responses
- **RAG Pipeline**: Advanced retrieval-augmented generation with vector similarity search
- **Modern UI**: Clean, responsive chat interface with real-time interactions
- **Modular Architecture**: Well-organized backend with separate services for different functionalities

## Architecture

```
rag-audio-chat/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── App.js        # Main chat interface
│   │   ├── App.css       # Modern chat styling
│   │   └── ...
│   └── package.json
├── backend/               # Node.js Express backend
│   ├── server.js         # Express server setup
│   ├── package.json
│   ├── routes/           # API route handlers
│   │   ├── askText.js    # Text question endpoint
│   │   └── askAudio.js   # Audio question endpoint
│   ├── services/         # External service integrations
│   │   ├── gooseai.js    # GooseAI API client
│   │   ├── stt.js        # Speech-to-Text service
│   │   └── tts.js        # Text-to-Speech service
│   ├── rag/              # RAG pipeline components
│   │   ├── embed.js      # Embedding generation
│   │   ├── ingest.js     # Document ingestion
│   │   └── search.js     # Vector similarity search
│   ├── data/             # Document storage
│   │   ├── sample1.txt   # Sample AI/ML content
│   │   └── sample2.txt   # Sample web dev content
│   └── .env.example      # Environment variables template
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GooseAI API key

## Installation & Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your GooseAI API key to .env
GOOSEAI_API_KEY=your_gooseai_api_key_here
PORT=5000
```

**Important**: Never commit your `.env` file to version control. API keys should be kept secure and private.

### 2. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install frontend dependencies
npm install
```

## Running the Application

### Start the Backend

```bash
cd backend

# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The backend will start on `http://localhost:5000`

### Start the Frontend

In a new terminal:

```bash
# From project root
npm start
```

The frontend will start on `http://localhost:3000`

## Usage

### Text Questions

1. Type your question in the text input field
2. Click "Send" or press Enter
3. The system will:
   - Generate embeddings for your question
   - Search for relevant context in the documents
   - Generate an answer using the context
   - Display the answer with source information

### Audio Questions

1. Click and hold the "🎤 Hold to record" button
2. Speak your question
3. Release the button to stop recording
4. The system will:
   - Transcribe your audio to text
   - Run the same RAG pipeline as text questions
   - Convert the answer to audio
   - Display the transcribed question and play the audio answer

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Text Question
- `POST /ask-text` - Ask a text question
  ```json
  {
    "question": "What is machine learning?"
  }
  ```

### Audio Question
- `POST /ask-audio` - Ask an audio question
  - Content-Type: `multipart/form-data`
  - Field: `audio` (audio file)

## Sample Documents

The backend comes with two sample documents in `backend/data/`:

1. **sample1.txt**: Content about Artificial Intelligence and Machine Learning
2. **sample2.txt**: Content about Web Development Technologies

You can add more `.txt` files to this directory, and they will be automatically ingested when the server starts.

## Services

### GooseAI Integration
- **Embeddings**: Uses text-embedding-ada-002 model
- **Chat**: Uses gpt-3.5-turbo for generating responses
- **Rate Limiting**: Implements batch processing and delays

### Speech-to-Text (Mock)
- Currently returns placeholder text
- Easy to replace with Whisper or other STT services
- Modular design for simple integration

### Text-to-Speech (Mock)
- Currently returns placeholder audio
- Easy to replace with real TTS services
- Returns base64-encoded audio for frontend playback

## RAG Pipeline

1. **Document Ingestion**:
   - Text files are chunked into 500-word segments with 50-word overlap
   - Each chunk is embedded using GooseAI
   - Embeddings stored in memory (upgrade to vector DB for production)

2. **Query Processing**:
   - User query is embedded
   - Cosine similarity search finds top 3 most relevant chunks
   - Context is built from relevant chunks

3. **Response Generation**:
   - Context + question sent to LLM
   - Response includes answer text and source information

## Configuration

### Environment Variables

Backend `.env` file:
```
GOOSEAI_API_KEY=your_gooseai_api_key_here
PORT=5000
```

Frontend (optional):
```
REACT_APP_API_URL=http://localhost:5000
```

## Development Notes

### Current Limitations
- Vector storage is in-memory (restart server to reindex)
- STT and TTS are mocked implementations
- No authentication or rate limiting
- Single-user design

### Production Improvements
- Replace in-memory storage with vector database (Pinecone, Weaviate)
- Implement real STT/TTS services
- Add authentication and user management
- Add rate limiting and caching
- Implement proper error handling and logging
- Add monitoring and analytics

## Testing the System

### Test Text Queries
Try these sample questions:
- "What is artificial intelligence?"
- "How does machine learning work?"
- "What are the main types of machine learning?"
- "What is React used for in web development?"
- "What is responsive web design?"

### Test Audio Queries
- Record any of the above questions as audio
- The system will transcribe and answer them

## Troubleshooting

### Common Issues

1. **Backend won't start**: Check if GooseAI API key is set correctly
2. **Frontend can't connect**: Ensure backend is running on port 5000
3. **Audio recording not working**: Check browser microphone permissions
4. **No documents found**: Ensure .txt files are in `backend/data/` directory

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=* npm run dev
```

## License

MIT License - feel free to use this project for learning and development.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Check the browser console and server logs
4. Ensure all environment variables are set correctly
