import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageCircle, FiX, FiSend, FiZap, FiTrash2,
  FiDatabase, FiCpu, FiRefreshCw, FiChevronDown,
  FiToggleLeft, FiToggleRight, FiInfo,
} from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  retrieve, buildRAGContext, buildRAGSystemPrompt, getSourceLabels,
} from '../services/ragService';
import { useRAG } from '../hooks/useRAG';
import { useStudents } from '../context/StudentContext';
import './AIChatbot.css';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ── Base system prompt (used by both modes) ───────────────────────────────────
const BASE_SYSTEM = `You are EduBot, an intelligent academic assistant for SMS Pro.
Help students with GPA improvement, study strategies, exam prep, competition tips, and career advice.
Keep responses concise (3-5 sentences), friendly, and encouraging. Use emojis occasionally.`;

// ── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  '📊 How can I improve my GPA?',
  '🏆 Hackathon preparation tips',
  '📚 Best study techniques',
  '💼 Career advice for my course',
  '🧠 How to prepare for exams?',
  '⚡ Time management strategies',
  '🔍 Show my academic summary',
  '📈 Analyse my performance',
];

// ── Modes ─────────────────────────────────────────────────────────────────────
const MODES = {
  RAG: 'rag',    // RAG retrieval → Gemini generation (grounded)
  GEMINI: 'gemini', // Pure Gemini (ungrounded, general)
  LOCAL: 'local',  // RAG only — no Gemini (free, privacy-first)
};

// ── Format markdown-lite text ─────────────────────────────────────────────────
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(180,79,255,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">$1</code>')
    .replace(/\n/g, '<br/>');
}

// ── Local answer engine (no Gemini) ──────────────────────────────────────────
function buildLocalAnswer(query, docs) {
  if (!docs.length) {
    return "I couldn't find specific information about that in the knowledge base. Try asking about a student's GPA, attendance, certifications, projects, or system features!";
  }

  const q = query.toLowerCase();

  // Route to specialised formatters
  if (/gpa|cgpa|sgpa|grade|performance|score/.test(q)) {
    return formatAcademicAnswer(docs, query);
  }
  if (/internship|experience|work/.test(q)) {
    return formatInternshipAnswer(docs);
  }
  if (/project/.test(q)) {
    return formatProjectAnswer(docs);
  }
  if (/certification|certificate/.test(q)) {
    return formatCertAnswer(docs);
  }
  if (/attendance/.test(q)) {
    return formatAttendanceAnswer(docs);
  }
  if (/competition|hackathon/.test(q)) {
    return formatCompAnswer(docs);
  }
  if (/how many|total|count|number of/.test(q)) {
    return formatAnalyticsAnswer(docs);
  }

  // Generic: return first paragraph of top doc
  const top = docs[0];
  const lines = top.text.split('\n').filter(l => l.trim()).slice(0, 4);
  return `**${top.title}**\n\n${lines.join('\n')}\n\n_Based on ${docs.length} source(s) from the knowledge base._`;
}

function formatAcademicAnswer(docs, query) {
  const trackDoc = docs.find(d => d.type === 'track');
  const studentDoc = docs.find(d => d.type === 'student');
  if (!trackDoc && !studentDoc) {
    const policyDoc = docs.find(d => d.type === 'policy');
    return policyDoc
      ? `📊 **Grading info:**\n\n${policyDoc.text.split('\n').slice(0, 5).join('\n')}`
      : 'No specific academic data found.';
  }
  const parts = [];
  if (studentDoc) {
    const gpaLine = studentDoc.text.split('\n').find(l => l.includes('GPA'));
    if (gpaLine) parts.push(`📊 ${gpaLine}`);
  }
  if (trackDoc) {
    const semLines = trackDoc.text.split('\n').filter(l => l.includes('Sem') || l.includes('CGPA') || l.includes('SGPA')).slice(0, 5);
    if (semLines.length) parts.push('\n' + semLines.join('\n'));
  }
  return parts.length ? parts.join('\n') : 'No GPA data recorded yet.';
}

function formatInternshipAnswer(docs) {
  const trackDoc = docs.find(d => d.type === 'track');
  if (!trackDoc) return '💼 No internship records found.';
  const lines = trackDoc.text.split('\n');
  const start = lines.findIndex(l => l.toLowerCase().includes('internship'));
  if (start === -1) return '💼 No internships recorded yet. Consider applying on LinkedIn or Internshala!';
  const intern = lines.slice(start, start + 6).join('\n');
  return `💼 **Internship records:**\n\n${intern}`;
}

function formatProjectAnswer(docs) {
  const trackDoc = docs.find(d => d.type === 'track');
  if (!trackDoc) return '🚀 No project records found.';
  const lines = trackDoc.text.split('\n');
  const start = lines.findIndex(l => l.toLowerCase().includes('project'));
  if (start === -1) return '🚀 No projects recorded yet.';
  const proj = lines.slice(start, start + 8).join('\n');
  return `🚀 **Projects:**\n\n${proj}`;
}

function formatCertAnswer(docs) {
  const trackDoc = docs.find(d => d.type === 'track');
  if (!trackDoc) return '📜 No certification records found.';
  const lines = trackDoc.text.split('\n');
  const start = lines.findIndex(l => l.toLowerCase().includes('certification'));
  if (start === -1) return '📜 No certifications recorded yet.';
  const certs = lines.slice(start, start + 6).join('\n');
  return `📜 **Certifications:**\n\n${certs}`;
}

function formatAttendanceAnswer(docs) {
  const trackDoc = docs.find(d => d.type === 'track');
  if (!trackDoc) {
    const policy = docs.find(d => d.id === 'sys-attendance');
    return policy ? `📅 **Attendance policy:**\n\n${policy.text.split('\n').slice(0, 4).join('\n')}` : '📅 No attendance data found.';
  }
  const line = trackDoc.text.split('\n').find(l => l.toLowerCase().includes('attendance'));
  return line ? `📅 **Attendance:** ${line}` : '📅 Attendance not recorded yet.';
}

function formatCompAnswer(docs) {
  const compDocs = docs.filter(d => d.type === 'competition');
  if (!compDocs.length) {
    const policy = docs.find(d => d.id === 'sys-competitions');
    return policy ? `🏆 **Competition tips:**\n\n${policy.text.split('\n').slice(0, 5).join('\n')}` : '🏆 No competition records found.';
  }
  const summary = compDocs.map(d => {
    const pos = d.text.split('\n').find(l => l.includes('Position'));
    const title = d.text.split('\n')[0];
    return `${title}${pos ? '\n  ' + pos : ''}`;
  }).join('\n');
  return `🏆 **Competition history (${compDocs.length} entries):**\n\n${summary}`;
}

function formatAnalyticsAnswer(docs) {
  const analytics = docs.find(d => d.type === 'analytics');
  if (!analytics) return '📈 No analytics data available yet.';
  return `📈 **System analytics:**\n\n${analytics.text.split('\n').slice(1, 8).join('\n')}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function AIChatbot({ studentContext = '', studentId = null }) {
  const { students } = useStudents();
  const { kb, rebuildKB, kbStats, building } = useRAG(students);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(GEMINI_KEY ? MODES.RAG : MODES.LOCAL);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! 👋 I'm **EduBot**, your AI academic assistant.\nI use your actual student data to give personalised answers.\nAsk me anything about your GPA, attendance, projects, exams, or career!",
      time: new Date(),
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showSrc, setShowSrc] = useState(null); // message index

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', text, time: new Date(), sources: [] };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      if (mode === MODES.LOCAL) {
        await handleLocalMode(text);
      } else if (mode === MODES.GEMINI) {
        await handleGeminiMode(text);
      } else {
        await handleRAGMode(text);
      }
    } catch (err) {
      console.error('EduBot error:', err);
      const msg = err?.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
        setError('Invalid Gemini API key — switching to Local RAG mode.');
        setMode(MODES.LOCAL);
      } else if (msg.includes('quota') || msg.includes('429')) {
        setError('Rate limit hit. Try again in a moment or switch to Local mode.');
      } else {
        setError(`Error: ${msg || 'Unknown error. Check console.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Mode: Local RAG (no Gemini, fully free) ──────────────────────────────
  async function handleLocalMode(text) {
    const docs = kb ? retrieve(kb, text, 5, studentId || undefined) : [];
    const answer = buildLocalAnswer(text, docs);
    const sources = getSourceLabels(docs);
    setMessages(prev => [...prev, {
      role: 'assistant',
      text: answer,
      time: new Date(),
      sources,
      mode: MODES.LOCAL,
    }]);
  }

  // ── Mode: Pure Gemini (no RAG) ───────────────────────────────────────────
  async function handleGeminiMode(text) {
    if (!GEMINI_KEY) {
      setError(' API key not set. Use Local RAG mode or set VITE_GEMINI_API_KEY.');
      return;
    }
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-3.5-flash', systemInstruction: BASE_SYSTEM },
      { apiVersion: 'v1beta' }
    );
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(1)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(
      `${studentContext ? 'Student context: ' + studentContext + '\n\n' : ''}${text}`
    );
    setMessages(prev => [...prev, {
      role: 'assistant',
      text: result.response.text(),
      time: new Date(),
      sources: [],
      mode: MODES.GEMINI,
    }]);
  }

  // ── Mode: RAG + Gemini (best quality, grounded in real data) ────────────
  async function handleRAGMode(text) {
    if (!GEMINI_KEY) {
      setError('Gemini API key not set. Falling back to Local RAG mode.');
      setMode(MODES.LOCAL);
      await handleLocalMode(text);
      return;
    }

    // 1. Retrieve relevant chunks
    const docs = kb ? retrieve(kb, text, 6, studentId || undefined) : [];
    const ragContext = buildRAGContext(docs);
    const systemPrompt = ragContext
      ? buildRAGSystemPrompt(ragContext, studentContext)
      : BASE_SYSTEM + (studentContext ? `\nStudent: ${studentContext}` : '');

    // 2. Send to Gemini with context
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-3.5-flash', systemInstruction: systemPrompt },
      { apiVersion: 'v1beta' }
    );
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(1)
      .slice(-6) // last 6 messages for context window efficiency
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(text);
    const sources = getSourceLabels(docs);

    setMessages(prev => [...prev, {
      role: 'assistant',
      text: result.response.text(),
      time: new Date(),
      sources,
      mode: MODES.RAG,
    }]);
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      text: "Chat cleared! 🧹 Knowledge base is ready — ask me anything about your academics!",
      time: new Date(),
      sources: [],
    }]);
    setShowSrc(null);
  };

  const modeLabel = {
    [MODES.RAG]: { label: 'RAG + Gemini', icon: <FiDatabase />, color: '#00f5ff', desc: 'Grounded in your real student data, powered by Gemini' },
    [MODES.GEMINI]: { label: 'Gemini AI', icon: <FiCpu />, color: '#b44fff', desc: 'General AI knowledge, not personalised to your data' },
    [MODES.LOCAL]: { label: 'Local RAG', icon: <FiDatabase />, color: '#39ff14', desc: '100% free, uses only your local knowledge base, no API' },
  };

  const currentMode = modeLabel[mode];

  return (
    <>
      {/* FAB */}
      <motion.button
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: open
            ? '0 0 0 rgba(180,79,255,0)'
            : ['0 0 20px rgba(180,79,255,0.5)', '0 0 35px rgba(180,79,255,0.8)', '0 0 20px rgba(180,79,255,0.5)'],
        }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><FiX /></motion.span>
            : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><FiMessageCircle /></motion.span>
          }
        </AnimatePresence>
        {!open && <span className="fab-label">EduBot</span>}
        {/* KB ready indicator */}
        {!open && kb && <span className="fab-kb-dot" title={`${kbStats.docCount} docs indexed`} />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
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
                <span className="chatbot-status" style={{ color: currentMode.color }}>
                  {currentMode.icon} {currentMode.label}
                </span>
              </div>
              <button
                className="chatbot-clear"
                onClick={() => setShowInfo(!showInfo)}
                title="AI mode info"
              >
                <FiInfo />
              </button>
              <button className="chatbot-clear" onClick={clearChat} title="Clear chat">
                <FiTrash2 />
              </button>
              <button className="chatbot-close" onClick={() => setOpen(false)}>
                <FiX />
              </button>
            </div>

            {/* Mode info panel */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  className="chatbot-info-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="info-panel-desc">{currentMode.desc}</div>
                  <div className="info-panel-kb">
                    {building
                      ? '⏳ Building knowledge base…'
                      : kb
                        ? `✅ ${kbStats.docCount} documents indexed · ${students.length} students`
                        : '⚠️ Knowledge base not ready'}
                    <button className="kb-rebuild-btn" onClick={rebuildKB} disabled={building}>
                      <FiRefreshCw style={{ fontSize: 11 }} /> Rebuild
                    </button>
                  </div>

                  {/* Mode selector */}
                  <div className="mode-selector">
                    {[
                      { key: MODES.RAG, label: 'RAG + Gemini', disabled: !GEMINI_KEY },
                      { key: MODES.GEMINI, label: 'Gemini only', disabled: !GEMINI_KEY },
                      { key: MODES.LOCAL, label: 'Local RAG', disabled: false },
                    ].map(({ key, label, disabled }) => (
                      <button
                        key={key}
                        className={`mode-btn ${mode === key ? 'active' : ''}`}
                        onClick={() => { setMode(key); setShowInfo(false); }}
                        disabled={disabled}
                        title={disabled ? 'Requires VITE_GEMINI_API_KEY' : ''}
                      >
                        {label}
                        {disabled && <span style={{ fontSize: 9, opacity: 0.6 }}> (no key)</span>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`chat-msg ${msg.role}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22 }}
                >
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar"><FiZap /></div>
                  )}
                  <div className="msg-bubble">
                    <div
                      className="msg-text"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                    />

                    {/* Source citations */}
                    {msg.sources?.length > 0 && (
                      <div className="msg-sources">
                        <button
                          className="sources-toggle"
                          onClick={() => setShowSrc(showSrc === i ? null : i)}
                        >
                          📎 {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
                          <FiChevronDown style={{ marginLeft: 4, transform: showSrc === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        <AnimatePresence>
                          {showSrc === i && (
                            <motion.div
                              className="sources-list"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              {msg.sources.map(src => (
                                <div key={src.id} className="source-item">{src.label}</div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Mode badge */}
                    <div className="msg-footer-row">
                      <div className="msg-time">
                        {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {msg.mode && (
                        <span className={`msg-mode-badge mode-${msg.mode}`}>
                          {msg.mode === MODES.RAG ? 'RAG+AI' : msg.mode === MODES.LOCAL ? 'Local' : 'Gemini'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading */}
              {loading && (
                <motion.div className="chat-msg assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="msg-avatar"><FiZap /></div>
                  <div className="msg-bubble">
                    <div className="typing-indicator"><span /><span /><span /></div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {mode === MODES.RAG ? 'Retrieving context + generating…' :
                        mode === MODES.LOCAL ? 'Searching knowledge base…' : 'Generating…'}
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
                placeholder={
                  mode === MODES.LOCAL ? 'Search knowledge base…' :
                    mode === MODES.RAG ? 'Ask about your data (RAG-powered)…' :
                      'Ask EduBot anything…'
                }
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
