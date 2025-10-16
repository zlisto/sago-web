
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ChatBubble from './components/ChatBubble';
import ImageInput from './components/ImageInput';
// import { v4 as uuidv4 } from 'uuid'; // Not used in frontend, handled by server
import './App.css';

const USERNAME = 'zlisto';
const MEMBER = 'Sago';
const VECTOR_STORE_ID = 'your_vector_store_id'; // Replace with your actual vector store id

function App() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Create a new session on load
    const apiUrl = process.env.REACT_APP_API_URL || '';
    axios.post(`${apiUrl}/session`, { username: USERNAME, member: MEMBER })
      .then(res => setSessionId(res.data.sessionId));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Global drag and drop event listeners
  useEffect(() => {
    const handleDragEnter = (e) => handleGlobalDragEnter(e);
    const handleDragLeave = (e) => handleGlobalDragLeave(e);
    const handleDragOver = (e) => handleGlobalDragOver(e);
    const handleDrop = (e) => handleGlobalDrop(e);

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [dragCounter]);

  const sendMessage = async () => {
    if (!input.trim() && !imagePreview) return;
    
    // Create user message with text and/or image
    let userContent = input;
    if (imagePreview) {
      userContent = input ? `${input}\n\n![image](data:${imagePreview.mimeType};base64,${imagePreview.base64})` 
                          : `![image](data:${imagePreview.mimeType};base64,${imagePreview.base64})`;
    }
    
    const userMsg = { role: 'user', content: userContent, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');
    setImagePreview(null);
    
    try {
      // Use production API URL if available
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const res = await axios.post(`${apiUrl}/chat`, {
        sessionId,
        username: USERNAME,
        member: MEMBER,
        message: input,
        imageData: imagePreview ? imagePreview.base64 : null,
        imageMimeType: imagePreview ? imagePreview.mimeType : null,
      });
      const assistantMsg = {
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    }
    setLoading(false);
  };



  const handleImage = async (file) => {
    console.log('Handling image:', file.name, file.type, file.size);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      console.log('Uploading to /upload...');
      const res = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', res.data);
      
      // Set image preview instead of immediately sending
      setImagePreview({
        base64: res.data.base64,
        mimeType: res.data.mimeType,
        filename: res.data.filename
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error uploading image: ${error.response?.data?.error || error.message}. Please try again.`,
        timestamp: new Date()
      }]);
    }
  };

  const handleGlobalDragEnter = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    if (dragCounter === 0) {
      setIsDragOver(true);
    }
  };

  const handleGlobalDragLeave = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    setDragCounter(0);
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => handleImage(file));
    }
  };

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
  };

  const handleChatPaste = (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length > 0) {
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) {
          handleImage(file);
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-azure relative">
      {/* Global Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-azure/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center text-azure bg-white/80 rounded-2xl p-8 border-2 border-azure">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-2xl font-medium mb-2">Drop image anywhere</p>
            <p className="text-lg text-azure/80">Release to upload and chat with Sago</p>
          </div>
        </div>
      )}

      {/* Floating Background Elements */}
      <div className="floating-bg">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>
      {/* Header with Sago logo */}
      <header className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-48 h-48 rounded-2xl shadow-2xl border-4 border-azure mb-4 hover:scale-105 transition-transform duration-300 bg-white flex items-center justify-center overflow-hidden">
            <img
              src="/SagoLogo.png"
              alt="Sago"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.log('Image failed to load:', e.target.src);
                console.log('Trying fallback...');
                e.target.src = '/logo192.png'; // Fallback to existing logo
              }}
              onLoad={() => console.log('Image loaded successfully')}
            />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-azure to-blue-500 opacity-20 blur-lg"></div>
        </div>
        <h1 className="text-7xl font-title mb-3"></h1>
        <h2 className="text-2xl text-azure mb-2 font-light">Your Scam Prevention Agent</h2>
      </header>

      {/* Chat Container */}
      <div className="w-full max-w-5xl mx-auto mb-6">
        <div 
          className={`bg-gray-100/80 backdrop-blur-sm rounded-2xl p-6 ${messages.length === 0 ? 'h-64 md:h-80' : 'h-[720px]'} overflow-y-auto border-2 border-azure/50 shadow-2xl custom-scrollbar relative`}
          onPaste={handleChatPaste}
          tabIndex={0}
        >

          {messages.length === 0 ? (
            <div className="text-center text-azure mt-24">
              <p className="text-3xl font-light mb-3">Welcome to Sago!</p>
              <p className="text-xl text-azure/80">Received a suspicious message, email or social media post? Share it with me and I'll tell you if it's likely a scam.</p>
              <p className="text-sm text-azure/60 mt-4">💡 Tip: You can drag & drop images or paste them directly into the chat!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatBubble key={idx} message={msg} />
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className="w-full max-w-5xl mx-auto">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <div className="bg-gray-200/80 backdrop-blur-sm border-2 border-azure/50 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <img
                  src={`data:${imagePreview.mimeType};base64,${imagePreview.base64}`}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-azure/30"
                />
                <div className="flex-1">
                  <p className="text-azure text-sm font-medium">{imagePreview.filename}</p>
                  <p className="text-azure/80 text-xs">Image ready to send</p>
                </div>
                <button
                  onClick={() => setImagePreview(null)}
                  className="text-azure/80 hover:text-azure transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' ? sendMessage() : null}
            onPaste={handleChatPaste}
            placeholder={imagePreview ? "Add a message about the image..." : "Share a suspicious message or image..."}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gray-200/80 backdrop-blur-sm border-2 border-azure/50 rounded-2xl text-gray-800 placeholder-azure/60 focus:outline-none focus:border-azure focus:bg-gray-200 text-lg font-light transition-all duration-300"
          />
          <button 
            onClick={sendMessage} 
            disabled={loading || (!input.trim() && !imagePreview)}
            className="px-8 py-4 bg-gradient-to-r from-azure to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
