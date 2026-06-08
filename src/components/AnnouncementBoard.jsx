import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiPlus, FiTrash2, FiWifi, FiWifiOff } from 'react-icons/fi';
import { subscribeAnnouncements, pushAnnouncement, deleteAnnouncement } from '../firebase/realtimeService';
import { isFirebaseConfigured } from '../firebase/config';
import './AnnouncementBoard.css';

const TYPE_CONFIG = {
  info:    { color: '#00f5ff', icon: 'ℹ️', label: 'Info' },
  success: { color: '#39ff14', icon: '✅', label: 'Success' },
  warning: { color: '#ffe600', icon: '⚠️', label: 'Warning' },
  urgent:  { color: '#ff2d78', icon: '🚨', label: 'Urgent' },
};

// Local fallback announcements when Firebase isn't configured
const LOCAL_DEMO = [
  { id: '1', title: 'Semester Exams Schedule', message: 'Final exams begin from 15th July 2025. Check your department notice board for detailed timetable.', type: 'urgent', author: 'Admin', createdAt: Date.now() - 3600000 },
  { id: '2', title: 'Hackathon Registration Open', message: 'National Hackathon registrations are open. Deadline: 30th June 2025. Register via the student portal.', type: 'info', author: 'Admin', createdAt: Date.now() - 7200000 },
  { id: '3', title: 'Library Hours Extended', message: 'Library will remain open till 10 PM during exam period. WiFi and study rooms available.', type: 'success', author: 'Admin', createdAt: Date.now() - 86400000 },
];

export default function AnnouncementBoard({ isAdmin = false }) {
  const [announcements, setAnnouncements] = useState(LOCAL_DEMO);
  const [showForm, setShowForm] = useState(false);
  const [live, setLive] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    setLive(true);
    const unsub = subscribeAnnouncements(data => {
      setAnnouncements(data.length ? data : LOCAL_DEMO);
    });
    return unsub;
  }, []);

  const handlePost = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setPosting(true);
    if (isFirebaseConfigured) {
      await pushAnnouncement({ ...form, author: 'Admin' });
    } else {
      setAnnouncements(prev => [{
        id: Date.now().toString(),
        ...form, author: 'Admin',
        createdAt: Date.now(),
      }, ...prev]);
    }
    setForm({ title: '', message: '', type: 'info' });
    setShowForm(false);
    setPosting(false);
  };

  const handleDelete = async (id) => {
    if (isFirebaseConfigured) await deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="ann-board">
      <div className="ann-header">
        <div className="ann-title-wrap">
          <FiBell className="ann-bell" />
          <h3>Announcements</h3>
          <div className={`ann-live ${live ? 'on' : 'off'}`}>
            {live ? <><FiWifi /> Live</> : <><FiWifiOff /> Local</>}
          </div>
        </div>
        {isAdmin && (
          <motion.button
            className="ann-add-btn"
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus /> Post
          </motion.button>
        )}
      </div>

      {/* Post form */}
      <AnimatePresence>
        {showForm && isAdmin && (
          <motion.div
            className="ann-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              type="text" placeholder="Title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="ann-input"
            />
            <textarea
              placeholder="Message..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="ann-input ann-textarea"
              rows={2}
            />
            <div className="ann-form-row">
              <div className="ann-type-selector">
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                  <button
                    key={type}
                    className={`ann-type-chip ${form.type === type ? 'active' : ''}`}
                    style={{ '--tc': cfg.color }}
                    onClick={() => setForm(f => ({ ...f, type }))}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
              <button
                className="ann-post-btn"
                onClick={handlePost}
                disabled={posting || !form.title || !form.message}
              >
                {posting ? '⏳' : '📣 Post'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="ann-list">
        <AnimatePresence>
          {announcements.map((ann, i) => {
            const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
            return (
              <motion.div
                key={ann.id}
                className="ann-item"
                style={{ '--ac': cfg.color }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <div className="ann-type-dot">{cfg.icon}</div>
                <div className="ann-content">
                  <div className="ann-item-title">{ann.title}</div>
                  <div className="ann-item-msg">{ann.message}</div>
                  <div className="ann-item-meta">
                    <span>By {ann.author}</span>
                    <span>{timeAgo(ann.createdAt)}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button className="ann-del" onClick={() => handleDelete(ann.id)}>
                    <FiTrash2 />
                  </button>
                )}
                <div className="ann-left-bar" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
