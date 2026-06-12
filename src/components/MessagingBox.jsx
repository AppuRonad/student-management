import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiMessageCircle, FiX, FiChevronDown,
  FiCheck, FiUser, FiShield, FiEdit2, FiTrash2,
  FiSlash, FiMoreVertical,
} from 'react-icons/fi';
import {
  fsListenMessages, fsSendMessage,
  fsEditMessage, fsDeleteMessage, fsUnsendMessage,
} from '../firebase/firestoreService';
import './MessagingBox.css';

/* ── helpers ──────────────────────────────────────────────────────────── */
function fmt(ts) {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function dateLabel(ts) {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  const today = new Date(), yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString())  return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildItems(msgs) {
  const out = [];
  let lastDate = null;
  msgs.forEach((msg, i) => {
    const dl = dateLabel(msg.timestamp);
    if (dl && dl !== lastDate) {
      out.push({ type: 'divider', label: dl, id: `d-${i}` });
      lastDate = dl;
    }
    const prev = msgs[i - 1], next = msgs[i + 1];
    out.push({
      type: 'message', ...msg,
      isFirst: !prev || prev.senderId !== msg.senderId,
      isLast:  !next || next.senderId !== msg.senderId,
    });
  });
  return out;
}

/* ── context menu ─────────────────────────────────────────────────────── */
function BubbleMenu({ onEdit, onUnsend, onDelete, onClose }) {
  return (
    <motion.div className="bubble-menu"
      initial={{ opacity: 0, scale: 0.85, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -6 }}
      transition={{ duration: 0.15 }}
    >
      {onEdit && (
        <button className="bm-item" onClick={onEdit}>
          <FiEdit2 /> Edit
        </button>
      )}
      <button className="bm-item bm-unsend" onClick={onUnsend}>
        <FiSlash /> Unsend
      </button>
      <button className="bm-item bm-delete" onClick={onDelete}>
        <FiTrash2 /> Delete
      </button>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
export default function MessagingBox({ studentId, currentUserRole, currentUserName }) {
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [isOpen,     setIsOpen]     = useState(false);
  const [unread,     setUnread]     = useState(0);
  const [showScroll, setShowScroll] = useState(false);
  const [failedIds,  setFailedIds]  = useState(new Set());
  const [menuFor,    setMenuFor]    = useState(null);   // msg id with open menu
  const [editingId,  setEditingId]  = useState(null);   // msg id being edited
  const [editText,   setEditText]   = useState('');

  const bottomRef  = useRef(null);
  const contentRef = useRef(null);
  const inputRef   = useRef(null);
  const editRef    = useRef(null);
  const prevCount  = useRef(0);

  /* live listener */
  useEffect(() => {
    if (!studentId) return;
    const unsub = fsListenMessages(studentId, (msgs) => {
      setMessages(msgs);
      if (!isOpen) {
        const diff = msgs.length - prevCount.current;
        if (diff > 0) setUnread(u => u + diff);
      }
      prevCount.current = msgs.length;
    });
    return () => unsub();
  }, [studentId]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const el = contentRef.current;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  /* close menu on outside click */
  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuFor]);

  /* focus edit input */
  useEffect(() => {
    if (editingId) setTimeout(() => editRef.current?.focus(), 50);
  }, [editingId]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (el) setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  /* ── SEND (optimistic, non-blocking) ─────────────────────────────────── */
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    setInput('');
    inputRef.current?.focus();

    const senderId = currentUserRole === 'admin' ? 'admin' : studentId;
    const tempId   = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setMessages(prev => [...prev, {
      id: tempId, senderId, text,
      timestamp: { toDate: () => new Date() },
      isOptimistic: true,
    }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);

    try {
      await fsSendMessage(studentId, senderId, text);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch {
      setFailedIds(prev => new Set([...prev, tempId]));
    }
  };

  /* ── EDIT ─────────────────────────────────────────────────────────────── */
  const startEdit = (msg) => {
    setMenuFor(null);
    setEditingId(msg.id);
    setEditText(msg.text);
  };
  const saveEdit = async () => {
    if (!editText.trim() || !editingId) { setEditingId(null); return; }
    const id = editingId;
    setEditingId(null);
    try {
      await fsEditMessage(studentId, id, editText.trim());
    } catch (err) { console.error('Edit failed', err); }
  };
  const cancelEdit = () => setEditingId(null);

  /* ── DELETE ───────────────────────────────────────────────────────────── */
  const handleDelete = async (msgId) => {
    setMenuFor(null);
    try {
      await fsDeleteMessage(studentId, msgId);
    } catch (err) { console.error('Delete failed', err); }
  };

  /* ── UNSEND ───────────────────────────────────────────────────────────── */
  const handleUnsend = async (msgId) => {
    setMenuFor(null);
    try {
      await fsUnsendMessage(studentId, msgId);
    } catch (err) { console.error('Unsend failed', err); }
  };

  const items = buildItems(messages);
  const mySenderId = currentUserRole === 'admin' ? 'admin' : studentId;

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="messaging-wrapper">

      {/* ── FAB ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button className="msg-fab"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
          >
            <FiMessageCircle />
            <span className="msg-fab-label">
              {currentUserRole === 'admin' ? 'Message Student' : 'Message Admin'}
            </span>
            {unread > 0 && (
              <motion.span className="msg-unread-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} key={unread}>
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div className="msg-box"
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            {/* Header */}
            <div className="msg-header">
              <div className="msg-hdr-avatar">
                {currentUserRole === 'admin' ? <FiUser /> : <FiShield />}
                <div className="msg-hdr-online" />
              </div>
              <div className="msg-hdr-info">
                <span className="msg-hdr-name">
                  {currentUserRole === 'admin' ? 'Student Chat' : 'Admin Support'}
                </span>
                <span className="msg-hdr-status"><span className="status-dot" /> Online</span>
              </div>
              <motion.button className="msg-close-btn" onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                <FiX />
              </motion.button>
            </div>

            {/* Unread bar */}
            <AnimatePresence>
              {unread > 0 && (
                <motion.div className="msg-new-bar"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  🔔 {unread} new message{unread > 1 ? 's' : ''}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="msg-content" ref={contentRef} onScroll={handleScroll}>
              {items.length === 0 && (
                <div className="msg-empty">
                  <div className="msg-empty-icon">💬</div>
                  <p>No messages yet</p>
                  <span>Say hello to start the conversation!</span>
                </div>
              )}

              {items.map(item => {
                if (item.type === 'divider') {
                  return (
                    <div key={item.id} className="msg-date-divider">
                      <span>{item.label}</span>
                    </div>
                  );
                }

                const isMe = item.senderId === mySenderId;
                const isFailed  = failedIds.has(item.id);
                const isPending = !!item.isOptimistic;
                const isUnsent  = item.unsent;
                const menuOpen  = menuFor === item.id;
                const canAct    = isMe && !isPending && !isFailed;

                return (
                  <motion.div key={item.id}
                    className={`msg-row ${isMe ? 'msg-row-me' : 'msg-row-them'} ${item.isLast ? 'row-last' : 'row-mid'}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Avatar slot */}
                    <div className={`msg-avatar-slot ${isMe ? 'slot-me' : 'slot-them'}`}>
                      {item.isLast && (
                        <div className={`msg-avatar ${isMe ? 'av-me' : 'av-them'}`}>
                          {isMe
                            ? (currentUserRole === 'admin' ? <FiShield /> : <FiUser />)
                            : (currentUserRole === 'admin' ? <FiUser />   : <FiShield />)
                          }
                        </div>
                      )}
                    </div>

                    {/* Bubble column */}
                    <div className={`msg-bubble-col ${isMe ? 'col-me' : 'col-them'}`}>
                      {/* Sender name — first in group */}
                      {item.isFirst && (
                        <span className={`msg-sender ${isMe ? 'sender-me' : 'sender-them'}`}>
                          {isMe ? 'You' : (currentUserRole === 'admin' ? 'Student' : 'Admin')}
                        </span>
                      )}

                      <div className="msg-bubble-wrap">
                        {/* ── Edit mode ── */}
                        {editingId === item.id ? (
                          <div className="msg-edit-wrap">
                            <input
                              ref={editRef}
                              className="msg-edit-input"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              maxLength={500}
                            />
                            <div className="msg-edit-actions">
                              <button className="mea-save" onClick={saveEdit}>Save</button>
                              <button className="mea-cancel" onClick={cancelEdit}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          /* ── Normal bubble ── */
                          <div className={[
                            'msg-bubble',
                            isMe ? 'bubble-me' : 'bubble-them',
                            isPending ? 'bubble-pending' : '',
                            isFailed  ? 'bubble-failed'  : '',
                            isUnsent  ? 'bubble-unsent'  : '',
                          ].join(' ')}>

                            {isUnsent ? (
                              <span className="msg-unsent-text">🚫 Message unsent</span>
                            ) : (
                              <span className="msg-text">{item.text}</span>
                            )}

                            <div className="msg-meta">
                              <span className="msg-time">
                                {isFailed  ? '⚠️ Failed'   :
                                 isPending ? 'Sending…'   :
                                 item.edited && !isUnsent ? `${fmt(item.timestamp)} · edited` :
                                 fmt(item.timestamp)}
                              </span>
                              {isMe && !isPending && !isFailed && !isUnsent && (
                                <span className="msg-ticks"><FiCheck /><FiCheck /></span>
                              )}
                              {isPending && <span className="msg-clock">🕐</span>}
                            </div>
                          </div>
                        )}

                        {/* ── Context menu trigger ── */}
                        {canAct && !isUnsent && editingId !== item.id && (
                          <div className="msg-actions-wrap">
                            <motion.button
                              className="msg-more-btn"
                              onClick={e => { e.stopPropagation(); setMenuFor(menuOpen ? null : item.id); }}
                              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                            >
                              <FiMoreVertical />
                            </motion.button>

                            <AnimatePresence>
                              {menuOpen && (
                                <BubbleMenu
                                  onEdit={!isUnsent ? () => startEdit(item) : null}
                                  onUnsend={() => handleUnsend(item.id)}
                                  onDelete={() => handleDelete(item.id)}
                                  onClose={() => setMenuFor(null)}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Scroll-to-bottom */}
            <AnimatePresence>
              {showScroll && (
                <motion.button className="msg-scroll-btn"
                  onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.12 }}>
                  <FiChevronDown />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input */}
            <form className="msg-form" onSubmit={handleSend}>
              <div className="msg-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  className="msg-input"
                  placeholder="Type a message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  maxLength={500}
                  autoComplete="off"
                />
                {input.length > 420 && (
                  <span className="msg-char-count">{500 - input.length}</span>
                )}
              </div>
              <motion.button type="submit" className="msg-send-btn"
                disabled={!input.trim()}
                whileHover={input.trim() ? { scale: 1.08 } : {}}
                whileTap={input.trim() ? { scale: 0.9 } : {}}>
                <FiSend />
              </motion.button>
            </form>

            <div className="msg-footer">🔒 End-to-end encrypted · SMS Pro</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
