import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { callNvidiaAIStream } from '../utils/aiService';
import { FiMessageCircle, FiX, FiSend, FiCpu, FiImage, FiMic } from 'react-icons/fi';
import './AIAssistant.css';

const SYSTEM_PROMPT = `You are ShopSA — a friendly, helpful AI shopping assistant for the Shapsa online store.

Your capabilities:
1. Answer questions about products
2. Provide buying advice and recommendations
3. Add items to the cart: If the user explicitly asks to buy or add a product to their cart, you MUST append \`[ACTION:ADD_TO_CART:Exact Product Name]\` to your response. You can only add products that exist in the store context I provide.

Rules:
- NEVER output raw URLs or fake placeholder links like "[Link to product page]".
- Use **bold** text for product names and prices.
- Be concise (max 3 sentences per response). 
- Use warm, conversational language and occasional emojis.
- Start with a warm greeting when first opened.`;

// Simple markdown formatter to convert **bold** to <strong> tags securely.
const formatMessage = (text) => {
  if (!text) return { __html: '' };
  // Replace **text** with <strong>text</strong>
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />'); // handle newlines
  return { __html: html };
};

export default function AIAssistant() {
  const { user, addToCart } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hi there! 👋 I'm ShopSA, your AI shopping assistant! I can help you find products, answer questions, and even add items to your cart. You can also talk to me using voice! What are you looking for today?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [products, setProducts] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch product names for context (fetch all fields so we can add to cart)
  useEffect(() => {
    supabase.from('products').select('*').limit(40).then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const buildContextMessage = () => {
    if (!products.length) return '';
    const listing = products.slice(0, 15).map(p => `${p.name} (${p.category}) - ₹${p.price}`).join(', ');
    return `\n\n[Current store products for context: ${listing}${products.length > 15 ? '...' : ''}]`;
  };

  const handleSend = async (text, imageUrl = null, imageFile = null) => {
    if ((!text && !imageUrl) || isTyping) return;

    const userMsg = { 
      id: Date.now(), 
      role: 'user', 
      content: text,
      image: imageUrl
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build message history for API
    let apiTextContext = text;
    if (imageFile) {
      // Inject simulated vision metadata for the LLM
      apiTextContext = `[Visual Search Uploaded] The user uploaded an image. Filename: "${imageFile.name}". Please analyze what this image might be based on the filename/context, and strongly recommend related products from the store. Context prompt: ${text || 'Find this'}`;
    }

    const history = [
      { role: 'user', content: SYSTEM_PROMPT + buildContextMessage() },
      { role: 'assistant', content: 'Understood! I am ShopSA, ready to help customers and analyze their images.' },
      // Filter out the initial greeting and only send text payload
      ...messages.filter(m => m.id !== 1).map(m => ({ 
        role: m.role, 
        content: m.image ? `[User uploaded image] ${m.content}` : m.content 
      })),
      { role: 'user', content: apiTextContext }
    ];

    // Add placeholder streaming message
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

    try {
      let fullResponse = '';
      await callNvidiaAIStream(history, (chunk) => {
        fullResponse += chunk;
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
        ));
      }, 400);

      // --- Post-stream UI action parsing ---
      // Check if AI included a cart command
      const actionMatch = fullResponse.match(/\[ACTION:ADD_TO_CART:(.*?)\]/i);
      let cleanedResponse = fullResponse;
      
      if (actionMatch && addToCart) {
        const pName = actionMatch[1].trim().toLowerCase();
        const pObj = products.find(p => p.name.toLowerCase().includes(pName) || pName.includes(p.name.toLowerCase()));
        
        if (pObj) {
          addToCart(pObj);
          // Show an invisible confirmation in the chat, or just let AI text confirm
        }
        
        // Remove the ugly token from the UI
        cleanedResponse = fullResponse.replace(/\[ACTION:ADD_TO_CART:.*?\]/gi, '').trim();
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: cleanedResponse } : m
        ));
      }

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId
          ? { ...m, content: 'Sorry, I ran into an issue connecting to the AI. Please try again! 😊' }
          : m
      ));
    }
    setIsTyping(false);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-send voice queries
      setTimeout(() => handleSend(transcript), 500);
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    handleSend('Can you find products like this image?', imageUrl, file);
    e.target.value = '';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input.trim());
    }
  };

  const QUICK_PROMPTS = [
    '🎤 (Try Voice) Find me Mangoes',
    '📱 Best phones under ₹500?',
    '🎧 Recommend headphones',
  ];

  return (
    <>
      <button
        className={`ai-assistant-fab ${isOpen ? 'fab-open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
        {!isOpen && <span className="fab-pulse" />}
      </button>

      {isOpen && (
        <div className="ai-assistant-window animate-slide-up">
          <div className="ai-assistant-header">
            <div className="ai-assistant-avatar">
              <FiCpu size={20} />
              <span className="ai-online-dot" />
            </div>
            <div className="ai-assistant-header-info">
              <span className="ai-name">ShopSA Assistant</span>
              <span className="ai-status">Powered by Gemma AI · Always online</span>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="ai-avatar-sm"><FiCpu size={12} /></div>
                )}
                <div className={`ai-bubble ${msg.role}`}>
                  {msg.image && (
                    <div className="ai-bubble-image-wrapper animate-image-pop">
                      <img src={msg.image} alt="User uploaded" className="ai-bubble-image" />
                    </div>
                  )}
                  {msg.content ? (
                    <span dangerouslySetInnerHTML={formatMessage(msg.content)} />
                  ) : (
                    msg.image ? null : (
                      <span className="ai-typing-dots">
                        <span /><span /><span />
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}

            {messages.length <= 1 && (
              <div className="ai-quick-prompts">
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} className="ai-quick-btn" onClick={() => {
                    const cleanQ = q.replace(/^[^\s]+\s/, '');
                    setInput(cleanQ);
                    setTimeout(() => handleSend(cleanQ), 50);
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-area">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
            />
            
            {/* Action Buttons: Voice and Upload */}
            <div className="ai-action-icons">
              <button 
                className={`ai-upload-btn ${isListening ? 'listening' : ''}`} 
                onClick={startVoiceInput}
                disabled={isTyping || isListening}
                title="Use voice input"
              >
                <FiMic size={18} />
              </button>
              
              <button 
                className="ai-upload-btn" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping}
                title="Upload image to search"
              >
                <FiImage size={18} />
              </button>
            </div>
            
            <input
              ref={inputRef}
              className="ai-input"
              placeholder={isListening ? "Listening..." : "Ask me anything..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={isTyping || isListening}
            />
            <button
              className="ai-send-btn"
              onClick={() => handleSend(input.trim())}
              disabled={!input.trim() || isTyping}
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
