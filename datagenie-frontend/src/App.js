import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Simple icons (replace with lucide-react later)
const Send = () => <span>→</span>;
const Upload = () => <span>↑</span>;
const User = () => <span>👤</span>;
const Brain = () => <span>🧠</span>;

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://datagenie-backend.vercel.app/api',
  ENDPOINTS: {
    HEALTH: '/health',
    CHAT: '/chat',
    UPLOAD: '/upload'
  }
};

// Mock Authentication Hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email, password) => {
    setLoading(true);
    setTimeout(() => {
      setUser({ 
        id: 'demo-user', 
        email: email,
        name: email.split('@')[0] 
      });
      setLoading(false);
    }, 1000);
    return { data: { user: { email } }, error: null };
  };

  const signOut = async () => {
    setUser(null);
    return { error: null };
  };

  return { user, loading, signIn, signOut };
};

// API Helper Class
class DataGenieAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.HEALTH}`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async sendChatMessage(message, sessionId = 'default') {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chat message failed:', error);
      throw error;
    }
  }
}

const dataGenieAPI = new DataGenieAPI();

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: "👋 Welcome to DataGenie! I'm your AI business intelligence analyst. Test the connection to our live backend!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const messagesEndRef = useRef(null);
  const { user, loading: authLoading, signIn, signOut } = useAuth();

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await dataGenieAPI.healthCheck();
        setConnectionStatus('connected');
        console.log('✅ Backend health check:', response);
      } catch (error) {
        setConnectionStatus('error');
        console.error('❌ Backend connection failed:', error);
      }
    };

    checkConnection();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processQuery = async (query) => {
    setIsLoading(true);
    
    try {
      const response = await dataGenieAPI.sendChatMessage(query, 'session-' + Date.now());
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: response.content,
        insights: response.insights || [],
        confidence: response.confidence,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error('Query processing failed:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: `Connection error: ${error.message}. Check if the backend is running.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    await processQuery(inputMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSignIn = async () => {
    const { data, error } = await signIn('demo@datagenie.com', 'demo123');
    if (!error) {
      setShowAuthModal(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `🎉 Signed in successfully! Connected to live backend with AI capabilities.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 50%, #4338ca 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              <Brain /> DataGenie - Live Backend Test
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                AI Business Intelligence Platform
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: connectionStatus === 'connected' ? '#10b981' : 
                                  connectionStatus === 'checking' ? '#f59e0b' : '#ef4444'
                }} />
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                  {connectionStatus === 'connected' ? 'Backend Connected' : 
                   connectionStatus === 'checking' ? 'Connecting...' : 'Backend Error'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  <User /> {user.name}
                </span>
                <button 
                  onClick={signOut}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <User /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Sign In to DataGenie</h2>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
              Demo credentials (pre-filled)
            </p>
            <button
              onClick={handleSignIn}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {authLoading ? 'Signing in...' : 'Sign In (Demo)'}
            </button>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div style={{ 
        height: 'calc(100vh - 200px)',
        overflowY: 'auto',
        padding: '2rem'
      }}>
        {/* Connection Status */}
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: connectionStatus === 'connected' ? 
            'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${connectionStatus === 'connected' ? 
            'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
            🌐 Live Backend Status
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {connectionStatus === 'connected' 
              ? '✅ Connected to datagenie-backend.vercel.app'
              : connectionStatus === 'checking'
              ? '🔄 Checking connection...'
              : '❌ Backend connection failed'
            }
          </p>
        </div>

        {/* Messages */}
        {messages.map(message => (
          <div key={message.id} style={{
            display: 'flex',
            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '1rem'
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '1rem',
              borderRadius: '16px',
              backgroundColor: message.type === 'user' ? '#3b82f6' :
                             message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                             'rgba(255, 255, 255, 0.1)',
              border: message.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </div>
              {message.insights && message.insights.length > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                    🔍 AI Insights
                  </h4>
                  {message.insights.map((insight, i) => (
                    <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>
                      {insight}
                    </p>
                  ))}
                </div>
              )}
              <div style={{ 
                fontSize: '0.7rem', 
                opacity: 0.6, 
                marginTop: '0.5rem' 
              }}>
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite'
                }} />
                <span>DataGenie is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1rem 2rem',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Test your live backend: 'Analyze sample insurance data' or 'Show me portfolio performance'"
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                resize: 'none',
                fontFamily: 'inherit'
              }}
              disabled={isLoading}
            />
            <div style={{ 
              fontSize: '0.8rem', 
              opacity: 0.6, 
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>✨ Connected to live Claude-powered backend</span>
              <span>Press Enter to send</span>
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              padding: '1rem',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1
            }}
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;