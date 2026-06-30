import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUsers, FiArrowLeft, FiSearch, FiLock, FiSliders, FiInfo,
} from 'react-icons/fi';
import { getAllMembers } from '../services/portalApi';
import { useMemberAuth } from '../context/MemberAuthContext';
import { toast } from 'react-toastify';
import './ViewMembers.css';

// Same permission keys as ManageMembers — used only to compute a count, never editable here
const ALL_PERM_KEYS = [
  'viewStudents', 'addStudents', 'editStudents', 'deleteStudents',
  'viewAnalytics', 'addMarks', 'addAttendance',
  'viewCompetitions', 'addCompetitions', 'messaging',
];

const STATUS_COLORS = {
  PENDING:  { bg: 'rgba(255,230,0,0.12)',  color: '#ffe600', label: 'Pending' },
  APPROVED: { bg: 'rgba(57,255,20,0.1)',   color: '#39ff14', label: 'Approved' },
  REJECTED: { bg: 'rgba(255,45,120,0.1)',  color: '#ff2d78', label: 'Rejected' },
};

/**
 * ViewMembers — read-only directory of all members for a logged-in Member.
 *
 * Members can SEE who else is registered (name, department, status,
 * permission count) but have NO ability to approve/reject/delete or
 * change anyone's permissions — those actions exist only in
 * ManageMembers.jsx, which is admin-only (route is under /admin/*
 * and the Navbar link to it never renders for members).
 */
export default function ViewMembers() {
  const { member } = useMemberAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (!member) { navigate('/member-login'); return; }
    load();
  }, [member]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data || []);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const filtered = members.filter(m =>
    m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="vm-page">
      <div className="vm-container">

        {/* Header */}
        <div className="vm-header">
          <button className="vm-back" onClick={() => navigate('/member')}>
            <FiArrowLeft /> Back to Dashboard
          </button>
        </div>

        <div className="vm-title-row">
          <div>
            <h1 className="vm-title"><FiUsers /> All Members</h1>
            <p className="vm-sub">Read-only directory — only admins can approve, reject or edit permissions</p>
          </div>
        </div>

        {/* Read-only notice */}
        <div className="vm-notice">
          <FiLock />
          <span>You're viewing this in read-only mode. Permission changes can only be made by an admin.</span>
        </div>

        {/* Search */}
        <div className="vm-search">
          <FiSearch />
          <input
            placeholder="Search by name or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="vm-loading">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="vm-empty">
            <FiUsers />
            <p>{search ? 'No members match your search' : 'No other members yet'}</p>
          </div>
        ) : (
          <div className="vm-list">
            {filtered.map(m => {
              const isMe = m.id === member?.id;
              const permCount = ALL_PERM_KEYS.filter(k => m.permissions?.[k]).length;

              return (
                <motion.div
                  key={m.id}
                  className={`vm-card ${isMe ? 'is-me' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="vm-avatar">{m.fullName?.[0]?.toUpperCase() || '?'}</div>

                  <div className="vm-info">
                    <div className="vm-name">
                      {m.fullName || '—'}
                      {isMe && <span className="vm-you-badge">You</span>}
                    </div>
                    <div className="vm-dept">{m.department}</div>
                  </div>

                  <div className="vm-mid">
                    <span
                      className="vm-status"
                      style={{ background: STATUS_COLORS[m.status]?.bg, color: STATUS_COLORS[m.status]?.color }}
                    >
                      {STATUS_COLORS[m.status]?.label || m.status}
                    </span>
                  </div>

                  {m.status === 'APPROVED' && (
                    <div className="vm-perms">
                      <FiSliders />
                      <span>{permCount}/{ALL_PERM_KEYS.length} permissions</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="vm-footer-note">
          <FiInfo /> Need a permission changed? Contact your administrator.
        </div>
      </div>
    </div>
  );
}
