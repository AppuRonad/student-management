import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMessageCircle, FiX } from 'react-icons/fi';
import { fsListenMessages, fsSendMessage } from '../firebase/firestoreService';
import './MessagingBox.css';

export default function MessagingBox({ studentId, currentUserRole, currentUserName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!studentId || !isOpen) return;
    const unsubscribe = fsListenMessages(studentId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [studentId, isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Determine sender ID (e.g. "admin" or studentId)
    const senderId = currentUserRole === 'admin' ? 'admin' : studentId;
    
    await fsSendMessage(studentId, senderId, newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="messaging-wrapper">
      {!isOpen && (
        <button className="msg-toggle-btn gradient-btn" onClick={() => setIsOpen(true)}>
          <FiMessageCircle style={{ marginRight: 8 }} />
          {currentUserRole === 'admin' ? 'Message Student' : 'Message Admin'}
        </button>
      )}

      {isOpen && (
        <motion.div 
          className="msg-box glass-card"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
        >
          <div className="msg-header">
            <h3><FiMessageCircle /> {currentUserRole === 'admin' ? 'Chat with Student' : 'Chat with Admin'}</h3>
            <button className="msg-close-btn" onClick={() => setIsOpen(false)}><FiX /></button>
          </div>
          
          <div className="msg-content">
            {messages.length === 0 ? (
              <div className="msg-empty">No messages yet. Say hello!</div>
            ) : (
              messages.map((msg) => {
                const isMe = currentUserRole === 'admin' ? msg.senderId === 'admin' : msg.senderId !== 'admin';
                return (
                  <div key={msg.id} className={`msg-bubble ${isMe ? 'msg-me' : 'msg-them'}`}>
                    <div className="msg-text">{msg.text}</div>
                    <div className="msg-time">
                      {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form className="msg-form" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" disabled={!newMessage.trim()}>
              <FiSend />
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
