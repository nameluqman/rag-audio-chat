import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// ChatBox component for displaying messages
function ChatBox({ messages }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-box">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.type}`}>
          <div className="message-content">
            {message.content}
          </div>
          {message.audioUrl && (
            <audio controls className="audio-player">
              <source src={message.audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          )}
          {message.transcribedText && (
            <div className="transcribed-text">
              <small>Transcribed: "{message.transcribedText}"</small>
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

// AudioRecorder component for recording audio
function AudioRecorder({ onRecordingComplete, isRecording }) {
  const [isRecordingLocal, setIsRecordingLocal] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingLocal(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingLocal) {
      mediaRecorderRef.current.stop();
      setIsRecordingLocal(false);
    }
  };

  return (
    <button
      className={`record-button ${isRecordingLocal ? 'recording' : ''}`}
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={isRecording}
    >
      {isRecordingLocal ? '🔴 Recording... (Release to stop)' : '🎤 Hold to record'}
    </button>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Backend API URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Send text question to backend
  const sendTextQuestion = async () => {
    if (!inputText.trim()) return;

    const userMessage = { type: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ask-text`, {
        question: inputText
      });

      const botMessage = {
        type: 'bot',
        content: response.data.answer,
        sources: response.data.sources
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending text question:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your question. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send audio question to backend
  const sendAudioQuestion = async (audioBlob) => {
    const userMessage = { type: 'user', content: '🎤 Audio message' };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await axios.post(`${API_URL}/ask-audio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Convert base64 audio to blob URL
      const audioBlob = new Blob([Uint8Array.from(atob(response.data.audioAnswer), c => c.charCodeAt(0))], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const botMessage = {
        type: 'bot',
        content: response.data.textAnswer,
        audioUrl: audioUrl,
        transcribedText: response.data.transcribedText,
        sources: response.data.sources
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending audio question:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your audio. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendTextQuestion();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>RAG Audio Chat</h1>
        <p>Ask questions via text or voice</p>
      </header>
      
      <main className="chat-container">
        <ChatBox messages={messages} />
        
        {isLoading && (
          <div className="loading-indicator">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Processing your question...</p>
          </div>
        )}
        
        <div className="input-container">
          <form onSubmit={handleSubmit} className="text-input-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your question here..."
              disabled={isLoading}
              className="text-input"
            />
            <button 
              type="submit" 
              disabled={isLoading || !inputText.trim()}
              className="send-button"
            >
              Send
            </button>
          </form>
          
          <div className="audio-input-container">
            <AudioRecorder 
              onRecordingComplete={sendAudioQuestion}
              isRecording={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
