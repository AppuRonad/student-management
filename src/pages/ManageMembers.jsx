import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiCheck, FiX, FiTrash2, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { getAllMembers, approveMember, rejectMember, deleteMemberApi } from '../services/portalApi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import './ManageMembers.css';

const STATUS_COLORS = {
  PENDING:  { bg: 'rgba(255,230,0,0.12)',  color: '#ffe600',  label: 'Pending' },
  APPROVED: { bg: 'rgba(57,255,20,0.1)',   color: '#39ff14',  label: 'Approved' },
  REJECTED: { bg: 'rgba(255,45,120,0.1)',  color: '#ff2d78',  label: 'Rejected' },
};

export default function ManageMembers() {
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('ALL');
  const [acting,   setActing]   = useState(null); // id currently being acted on

  const { admin } = useAdminAuth();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data || []);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await approveMember(id, admin?.id || 'admin');
      toast.success('Member approved!');
      load();
    } catch { toast.error('Failed to approve'); }
    finally { setActing(null); }
  };

  const handleReject = async (id) => {
    setActing(id);
    try {
      await rejectMember(id);
      toast.success('Member rejected');
      load();
    } catch { toast.error('Failed to reject'); }
    finally { setActing(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member permanently?')) return;
    setActing(id);
    try {
      await deleteMemberApi(id);
      toast.success('Member deleted');
      load();
    } catch { toast.error('Failed to delete'); }
    finally { setActing(null); }
  };

  const filtered = members
    .filter(m => filter === 'ALL' || m.status === filter)
    .filter(m =>
      m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.department?.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    ALL:      members.length,
    PENDING:  members.filter(m => m.status === 'PENDING').length,
    APPROVED: members.filter(m => m.status === 'APPROVED').length,
    REJECTED: members.filter(m => m.status === 'REJECTED').length,
  };

  return (
    <div className="mm-page">
      <div className="mm-container">
        {/* Header */}
        <div className="mm-header">
          <div>
            <h1 className="mm-title"><FiUsers /> Manage Members</h1>
            <p className="mm-sub">Review, approve or reject member registrations</p>
          </div>
          <button className="mm-refresh" onClick={load}>
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mm-filter-row">
          <div className="mm-search">
            <FiSearch />
            <input placeholder="Search by name, email, dept…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="mm-tabs">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(tab => (
              <button
                key={tab}
                className={`mm-tab ${filter === tab ? 'active' : ''} mm-tab-${tab.toLowerCase()}`}
                onClick={() => setFilter(tab)}
              >
                {tab} <span className="mm-count">{counts[tab]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="mm-loading">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="mm-empty">
            <FiUsers />
            <p>{search || filter !== 'ALL' ? 'No members match your filter' : 'No member registrations yet'}</p>
          </div>
        ) : (
          <div className="mm-list">
            {filtered.map(m => (
              <motion.div
                key={m.id}
                className="mm-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <div className="mm-avatar">{m.fullName?.[0]?.toUpperCase() || '?'}</div>

                <div className="mm-info">
                  <div className="mm-name">{m.fullName || '—'}</div>
                  <div className="mm-email">{m.email}</div>
                  <div className="mm-dept-row">
                    <span className="mm-dept">{m.department}</span>
                    {m.phone && <span className="mm-phone">{m.phone}</span>}
                  </div>
                </div>

                <div className="mm-mid">
                  <span
                    className="mm-status"
                    style={{ background: STATUS_COLORS[m.status]?.bg, color: STATUS_COLORS[m.status]?.color }}
                  >
                    {STATUS_COLORS[m.status]?.label || m.status}
                  </span>
                  <div className="mm-date">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : '—'}</div>
                </div>

                <div className="mm-actions">
                  {m.status === 'PENDING' && (
                    <>
                      <motion.button
                        className="mm-btn mm-approve"
                        onClick={() => handleApprove(m.id)}
                        disabled={acting === m.id}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      >
                        <FiCheck /> Approve
                      </motion.button>
                      <motion.button
                        className="mm-btn mm-reject"
                        onClick={() => handleReject(m.id)}
                        disabled={acting === m.id}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      >
                        <FiX /> Reject
                      </motion.button>
                    </>
                  )}
                  {m.status === 'REJECTED' && (
                    <motion.button
                      className="mm-btn mm-approve"
                      onClick={() => handleApprove(m.id)}
                      disabled={acting === m.id}
                      whileHover={{ scale: 1.05 }}
                    >
                      <FiCheck /> Re-approve
                    </motion.button>
                  )}
                  {m.status === 'APPROVED' && (
                    <motion.button
                      className="mm-btn mm-reject"
                      onClick={() => handleReject(m.id)}
                      disabled={acting === m.id}
                      whileHover={{ scale: 1.05 }}
                    >
                      <FiX /> Revoke
                    </motion.button>
                  )}
                  <motion.button
                    className="mm-btn mm-delete"
                    onClick={() => handleDelete(m.id)}
                    disabled={acting === m.id}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    <FiTrash2 />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
