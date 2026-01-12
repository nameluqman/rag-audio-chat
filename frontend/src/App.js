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
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' 
        });
        onRecordingComplete(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Reset timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecordingLocal(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      let errorMessage = 'Could not access microphone. Please check permissions.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Audio recording is not supported in this browser.';
      }
      
      alert(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingLocal) {
      mediaRecorderRef.current.stop();
      setIsRecordingLocal(false);
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder-container">
      <button
        className={`record-button ${isRecordingLocal ? 'recording' : ''}`}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={isRecording}
      >
        <span className="record-button-content">
          {isRecordingLocal ? (
            <>
              <span className="recording-indicator">🔴</span>
              <span>Recording {formatTime(recordingTime)}</span>
              <span className="release-hint">(Release to stop)</span>
            </>
          ) : (
            <>
              <span>🎤</span>
              <span>Hold to record</span>
            </>
          )}
        </span>
      </button>
      
      {isRecordingLocal && (
        <div className="recording-waveform">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef(null);

  // Backend API URL - supports both development and production
  const API_URL = process.env.REACT_APP_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 
     `https://${window.location.hostname}`);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-resize textarea for better mobile experience
  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

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
      
      let errorMessage = 'Sorry, I encountered an error processing your question. Please try again.';
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Unable to connect to the backend server. Please ensure the backend is running and accessible.';
      }
      
      const errorBotMessage = {
        type: 'bot',
        content: errorMessage
      };
      setMessages(prev => [...prev, errorBotMessage]);
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
      
      let errorMessage = 'Sorry, I encountered an error processing your audio. Please try again.';
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Unable to connect to the backend server. Please ensure the backend is running and accessible.';
      }
      
      const errorBotMessage = {
        type: 'bot',
        content: errorMessage
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isOnline) {
      alert('You are currently offline. Please check your internet connection.');
      return;
    }
    sendTextQuestion();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>RAG Audio Chat</h1>
        <p>Ask questions via text or voice</p>
        {!isOnline && (
          <div className="offline-indicator">
            <span>🔴 Offline</span>
          </div>
        )}
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
            <textarea
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              disabled={isLoading || !isOnline}
              className="text-input"
              rows={1}
              style={{ resize: 'none', overflow: 'hidden' }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !isOnline || !inputText.trim()}
              className="send-button"
            >
              Send
            </button>
          </form>
          
          <div className="audio-input-container">
            <AudioRecorder 
              onRecordingComplete={sendAudioQuestion}
              isRecording={isLoading || !isOnline}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
