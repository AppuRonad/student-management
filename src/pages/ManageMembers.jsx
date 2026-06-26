import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiCheck, FiX, FiTrash2, FiRefreshCw,
  FiSearch, FiSliders, FiChevronDown, FiChevronUp, FiSave,
} from 'react-icons/fi';
import {
  getAllMembers, approveMember, rejectMember,
  deleteMemberApi, updateMemberPermissions,
} from '../services/portalApi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import './ManageMembers.css';

// ── Permission definitions ────────────────────────────────────────────────────
const PERMISSION_GROUPS = [
  {
    group: 'Students',
    icon: '👥',
    perms: [
      { key: 'viewStudents',   label: 'View Students',   desc: 'Can view department student list' },
      { key: 'addStudents',    label: 'Add Students',    desc: 'Can add new students to their dept' },
      { key: 'editStudents',   label: 'Edit Students',   desc: 'Can edit student profiles' },
      { key: 'deleteStudents', label: 'Delete Students', desc: 'Can delete students in their dept' },
    ],
  },
  {
    group: 'Academics',
    icon: '📊',
    perms: [
      { key: 'viewAnalytics',  label: 'View Analytics',  desc: 'Can view dept analytics & charts' },
      { key: 'addMarks',       label: 'Add/Edit Marks',  desc: 'Can add semester marks & track records' },
      { key: 'addAttendance',  label: 'Add Attendance',  desc: 'Can manage attendance records' },
    ],
  },
  {
    group: 'Competitions',
    icon: '🏆',
    perms: [
      { key: 'viewCompetitions', label: 'View Competitions', desc: 'Can view competition entries' },
      { key: 'addCompetitions',  label: 'Add Competitions',  desc: 'Can add competition records' },
    ],
  },
  {
    group: 'Communication',
    icon: '💬',
    perms: [
      { key: 'messaging', label: 'Messaging', desc: 'Can send/receive messages with students' },
    ],
  },
];

const ALL_PERM_KEYS = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key));

const STATUS_COLORS = {
  PENDING:  { bg: 'rgba(255,230,0,0.12)',  color: '#ffe600', label: 'Pending' },
  APPROVED: { bg: 'rgba(57,255,20,0.1)',   color: '#39ff14', label: 'Approved' },
  REJECTED: { bg: 'rgba(255,45,120,0.1)',  color: '#ff2d78', label: 'Rejected' },
};

// ── Permission Panel ──────────────────────────────────────────────────────────
function PermissionPanel({ member, onSaved }) {
  const ALL_KEYS = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key));

  // Build defaults — any key not in member.permissions defaults to false
  const buildPerms = (source) => {
    const base = {};
    ALL_KEYS.forEach(k => { base[k] = false; });
    return { ...base, ...(source || {}) };
  };

  const [perms,   setPerms]   = useState(() => buildPerms(member.permissions));
  const [saving,  setSaving]  = useState(false);
  const [changed, setChanged] = useState(false);

  // Sync when parent reloads member data (e.g. after save)
  useEffect(() => {
    setPerms(buildPerms(member.permissions));
    setChanged(false);
  }, [member.id, JSON.stringify(member.permissions)]);

  const toggle = (key) => {
    setPerms(p => { const n = { ...p, [key]: !p[key] }; setChanged(true); return n; });
  };

  const grantAll = () => {
    const all = {};
    ALL_PERM_KEYS.forEach(k => all[k] = true);
    setPerms(all); setChanged(true);
  };

  const revokeAll = () => {
    const none = {};
    ALL_PERM_KEYS.forEach(k => none[k] = false);
    setPerms(none); setChanged(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateMemberPermissions(member.id, perms);
      toast.success(`Permissions updated for ${member.fullName}`);
      setChanged(false);
      onSaved();
    } catch { toast.error('Failed to save permissions'); }
    finally { setSaving(false); }
  };

  const enabledCount = ALL_PERM_KEYS.filter(k => perms[k]).length;

  return (
    <motion.div
      className="perm-panel"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header row */}
      <div className="perm-header">
        <div className="perm-summary">
          <FiSliders /> Permissions
          <span className="perm-count">{enabledCount}/{ALL_PERM_KEYS.length} enabled</span>
        </div>
        <div className="perm-bulk-btns">
          <button className="perm-bulk grant" onClick={grantAll}>Grant All</button>
          <button className="perm-bulk revoke" onClick={revokeAll}>Revoke All</button>
        </div>
      </div>

      {/* Groups */}
      <div className="perm-groups">
        {PERMISSION_GROUPS.map(g => (
          <div key={g.group} className="perm-group">
            <div className="perm-group-label">{g.icon} {g.group}</div>
            <div className="perm-toggles">
              {g.perms.map(p => (
                <div
                  key={p.key}
                  className={`perm-toggle ${perms[p.key] ? 'on' : 'off'}`}
                  onClick={() => toggle(p.key)}
                  title={p.desc}
                >
                  <div className="perm-toggle-track">
                    <div className="perm-toggle-thumb" />
                  </div>
                  <div className="perm-toggle-info">
                    <span className="perm-toggle-label">{p.label}</span>
                    <span className="perm-toggle-desc">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      {changed && (
        <motion.div className="perm-save-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.button
            className="perm-save-btn"
            onClick={save}
            disabled={saving}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <FiSave /> {saving ? 'Saving…' : 'Save Permissions'}
          </motion.button>
          <span className="perm-unsaved">Unsaved changes</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ManageMembers() {
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('ALL');
  const [acting,   setActing]   = useState(null);
  const [openPerms, setOpenPerms] = useState(null); // member id with open perm panel

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
      toast.success('Member access revoked');
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
      setOpenPerms(null);
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
            <p className="mm-sub">Approve members and configure granular per-member permissions</p>
          </div>
          <button className="mm-refresh" onClick={load}>
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mm-filter-row">
          <div className="mm-search">
            <FiSearch />
            <input
              placeholder="Search by name, email, dept…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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

        {/* List */}
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
              <div key={m.id} className="mm-card-wrap">
                <motion.div
                  className="mm-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                >
                  {/* Avatar */}
                  <div className="mm-avatar">{m.fullName?.[0]?.toUpperCase() || '?'}</div>

                  {/* Info */}
                  <div className="mm-info">
                    <div className="mm-name">{m.fullName || '—'}</div>
                    <div className="mm-email">{m.email}</div>
                    <div className="mm-dept-row">
                      <span className="mm-dept">{m.department}</span>
                      {m.phone && <span className="mm-phone">{m.phone}</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mm-mid">
                    <span
                      className="mm-status"
                      style={{ background: STATUS_COLORS[m.status]?.bg, color: STATUS_COLORS[m.status]?.color }}
                    >
                      {STATUS_COLORS[m.status]?.label || m.status}
                    </span>
                    <div className="mm-date">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : '—'}
                    </div>
                    {/* Permission count for approved members */}
                    {m.status === 'APPROVED' && (
                      <div className="mm-perm-count">
                        {ALL_PERM_KEYS.filter(k => m.permissions?.[k]).length}/{ALL_PERM_KEYS.length} perms
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mm-actions">
                    {m.status === 'PENDING' && (
                      <>
                        <motion.button className="mm-btn mm-approve" onClick={() => handleApprove(m.id)} disabled={acting === m.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <FiCheck /> Approve
                        </motion.button>
                        <motion.button className="mm-btn mm-reject" onClick={() => handleReject(m.id)} disabled={acting === m.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <FiX /> Reject
                        </motion.button>
                      </>
                    )}
                    {m.status === 'REJECTED' && (
                      <motion.button className="mm-btn mm-approve" onClick={() => handleApprove(m.id)} disabled={acting === m.id} whileHover={{ scale: 1.05 }}>
                        <FiCheck /> Re-approve
                      </motion.button>
                    )}
                    {m.status === 'APPROVED' && (
                      <>
                        <motion.button
                          className="mm-btn mm-perms"
                          onClick={() => setOpenPerms(openPerms === m.id ? null : m.id)}
                          whileHover={{ scale: 1.05 }}
                        >
                          <FiSliders />
                          {openPerms === m.id ? <FiChevronUp /> : <FiChevronDown />}
                          Permissions
                        </motion.button>
                        <motion.button className="mm-btn mm-reject" onClick={() => handleReject(m.id)} disabled={acting === m.id} whileHover={{ scale: 1.05 }}>
                          <FiX /> Revoke
                        </motion.button>
                      </>
                    )}
                    <motion.button className="mm-btn mm-delete" onClick={() => handleDelete(m.id)} disabled={acting === m.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <FiTrash2 />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Permissions panel — only for approved members */}
                <AnimatePresence>
                  {openPerms === m.id && m.status === 'APPROVED' && (
                    <PermissionPanel
                      member={m}
                      onSaved={load}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
