import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiZap, FiTrash2 } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './AIChatbot.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are EduBot, an intelligent academic assistant for a Student Management System called SMS Pro.
You help students with:
- Understanding their GPA and academic performance
- Study tips and strategies tailored to their course
- Competition preparation advice
- Career guidance based on their department
- Explaining academic concepts simply
- Motivation and productivity tips

Keep responses concise (2-4 sentences), friendly, and encouraging. Use emojis occasionally.
If asked about non-academic topics, gently redirect to academic help.`;

const QUICK_PROMPTS = [
  '📊 How can I improve my GPA?',
  '🏆 Tips for hackathons',
  '📚 Best study techniques',
  '💼 Career advice for CS students',
  '🧠 How to prepare for exams?',
  '⚡ How to manage time better?',
];

export default function AIChatbot({ studentContext = '' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! 👋 I'm **EduBot**, your AI academic assistant.\nAsk me anything about studying, GPA improvement, competitions, or career advice!",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    if (!API_KEY) {
      await new Promise(r => setTimeout(r, 800));
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "🔑 Gemini API key not set yet!\n\nTo enable AI responses:\n1. Go to **aistudio.google.com**\n2. Create an API key (free!)\n3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`\n4. Restart the dev server",
        time: new Date(),
      }]);
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel(
        {
          model: 'gemini-3.5-flash',
          systemInstruction: SYSTEM_PROMPT,
        },
        { apiVersion: 'v1beta' }
      );

      const chat = model.startChat({
        history: messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .slice(1) // skip the intro message
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.text }],
          })),
      });

      const result = await chat.sendMessage(
        `Student context: ${studentContext || 'General student'}\n\n${text}`
      );
      const response = result.response.text();

      setMessages(prev => [...prev, { role: 'assistant', text: response, time: new Date() }]);
    } catch (err) {
      console.error('Gemini error:', err);
      const msg = err?.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
        setError('Invalid API key — check VITE_GEMINI_API_KEY in your .env');
      } else if (msg.includes('quota') || msg.includes('429')) {
        setError('Rate limit hit — wait a moment and try again.');
      } else {
        setError(`Error: ${msg || 'Unknown error. Check console.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const clearChat = () => setMessages([{
    role: 'assistant',
    text: "Chat cleared! 🧹 How can I help you today?",
    time: new Date(),
  }]);

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ boxShadow: open ? '0 0 0 rgba(180,79,255,0)' : ['0 0 20px rgba(180,79,255,0.5)', '0 0 35px rgba(180,79,255,0.8)', '0 0 20px rgba(180,79,255,0.5)'] }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><FiX /></motion.span>
            : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><FiMessageCircle /></motion.span>
          }
        </AnimatePresence>
        {!open && <span className="fab-label">EduBot</span>}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, scale: 0.8, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-avatar">
                <FiZap />
                <div className="chatbot-online" />
              </div>
              <div className="chatbot-title-wrap">
                <span className="chatbot-name">EduBot</span>
                <span className="chatbot-status">Powered by Gemini AI ✨</span>
              </div>
              <button className="chatbot-clear" onClick={clearChat} title="Clear chat"><FiTrash2 /></button>
              <button className="chatbot-close" onClick={() => setOpen(false)}><FiX /></button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages" ref={chatRef}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`chat-msg ${msg.role}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar"><FiZap /></div>
                  )}
                  <div className="msg-bubble">
                    <div
                      className="msg-text"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                    />
                    <div className="msg-time">
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div className="chat-msg assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="msg-avatar"><FiZap /></div>
                  <div className="msg-bubble">
                    <div className="typing-indicator">
                      <span /><span /><span />
                    </div>
                  </div>
                </motion.div>
              )}

              {error && <div className="chat-error">⚠️ {error}</div>}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="quick-prompts">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} className="quick-chip" onClick={() => sendMessage(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chatbot-input-wrap">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask EduBot anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="chatbot-input"
                disabled={loading}
              />
              <motion.button
                className="chatbot-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiSend />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
