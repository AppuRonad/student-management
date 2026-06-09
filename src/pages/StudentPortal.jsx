import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  FiLogOut, FiUser, FiAward, FiBook, FiCalendar,
  FiCheckCircle, FiTrendingUp, FiStar, FiZap, FiTarget,
} from 'react-icons/fi';
import { usePortalAuth } from '../context/PortalAuthContext';
import { ACHIEVEMENTS } from '../context/StudentPortalData'; // achievements stay local for now
import { getTrackRecord, getCompetitions } from '../services/portalApi';
import AvatarBadge from '../components/AvatarBadge';
import AIChatbot from '../components/AIChatbot';
import AnnouncementBoard from '../components/AnnouncementBoard';
import StudentIDCard from '../components/StudentIDCard';
import MessagingBox from '../components/MessagingBox';
import { toast } from 'react-toastify';
import { useScrollReveal, useCounter } from '../hooks/useScrollReveal';
import './StudentPortal.css';

const TABS = [
  { id: 'overview',       label: 'Overview',       icon: FiUser },
  { id: 'track',          label: 'Track Records',  icon: FiTrendingUp },
  { id: 'competitions',   label: 'Competitions',   icon: FiAward },
  { id: 'achievements',   label: 'Achievements',   icon: FiStar },
  { id: 'announcements',  label: 'Notices',        icon: FiTarget },
];

const CATEGORY_COLORS = {
  Hackathon: '#b44fff', 'Competitive Coding': '#00f5ff', Robotics: '#ff6b35',
  Business: '#ffe600', Marketing: '#ff2d78', Finance: '#39ff14',
  Academic: '#a78bfa', Research: '#f0abfc', Science: '#00f5ff',
  Innovation: '#ffe600', 'Data Science': '#39ff14', Technical: '#ff6b35',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="portal-tooltip">
      <div className="portal-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, fontSize: 13 }}>
          {p.name}: <strong style={{ fontFamily: "'Orbitron',sans-serif" }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────────────────
function PortalStatCard({ icon: Icon, label, value, color, suffix = '', delay = 0 }) {
  const [ref, vis] = useScrollReveal();
  const count = useCounter(Number(String(value).replace(/\D/g, '')) || 0, 1000, vis);

  return (
    <motion.div
      ref={ref}
      className="portal-stat"
      style={{ '--clr': color }}
      initial={{ opacity: 0, y: 30 }}
      animate={vis ? { opacity: 1, y: 0 } : {}}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.03 }}
    >
      <div className="ps-icon"><Icon /></div>
      <div className="ps-value">{count}{suffix}</div>
      <div className="ps-label">{label}</div>
    </motion.div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ student, records, comps = [], onAddCertification }) {
  const semData = records?.semesters || [];
  const latest = semData[semData.length - 1];

  return (
    <div className="tab-content">
      {/* Profile hero */}
      <motion.div
        className="portal-profile-hero glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="pph-bg-rings">
          <div className="pph-ring" /><div className="pph-ring r2" />
        </div>
        <div className="pph-left">
          <div className="pph-avatar-wrap">
            <AvatarBadge name={student.fullName} avatarIndex={student.avatar} size={90} />
            <div className="pph-dot" />
          </div>
          <div>
            <h2 className="pph-name">{student.fullName}</h2>
            <div className="pph-tags">
              <span className="ptag cyan">{student.id}</span>
              <span className="ptag purple">{student.course}</span>
              <span className="ptag pink">{student.department}</span>
            </div>
            <div className="pph-meta">
              <span>📧 {student.email}</span>
              <span>📞 {student.phone}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'flex-start' }}>
          <StudentIDCard student={student} />
        </div>
        <div className="pph-stats">
          <div className="pph-stat">
            <span className="pph-stat-v" style={{ color: '#39ff14' }}>{student.gpa || '—'}</span>
            <span className="pph-stat-l">Current GPA</span>
          </div>
          <div className="pph-stat">
            <span className="pph-stat-v" style={{ color: '#00f5ff' }}>{semData.length}</span>
            <span className="pph-stat-l">Semesters</span>
          </div>
          <div className="pph-stat">
            <span className="pph-stat-v" style={{ color: '#ffe600' }}>
              {comps.length}
            </span>
            <span className="pph-stat-l">Competitions</span>
          </div>
          <div className="pph-stat">
            <span className="pph-stat-v" style={{ color: '#b44fff' }}>
              {(records?.certifications || []).length}
            </span>
            <span className="pph-stat-l">Certifications</span>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="portal-stats-row">
        <PortalStatCard icon={FiTrendingUp} label="Attendance %" value={records?.attendance?.percent || 0} color="#b44fff" suffix="%" delay={0.1} />
        <PortalStatCard icon={FiCheckCircle} label="Assignments Done" value={records?.assignments?.submitted || 0} color="#00f5ff" delay={0.2} />
        <PortalStatCard icon={FiBook} label="Total Credits" value={semData.reduce((a, s) => a + s.credits, 0)} color="#ff2d78" delay={0.3} />
        <PortalStatCard icon={FiStar} label="Projects" value={(records?.projects || []).length} color="#ffe600" delay={0.4} />
      </div>

      {/* GPA chart */}
      <motion.div
        className="glass-card overview-chart-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="occ-header">
          <FiTrendingUp style={{ color: '#b44fff' }} />
          <h3>GPA Trend Across Semesters</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={semData}>
            <defs>
              <linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b44fff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#b44fff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="sem" stroke="#9090b0" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} stroke="#9090b0" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="gpa" stroke="#b44fff" strokeWidth={2.5} fill="url(#gpaGrad)" name="GPA" dot={{ fill: '#b44fff', r: 5, strokeWidth: 2, stroke: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Certifications + Projects */}
      <div className="overview-bottom-grid">
        <motion.div
          className="glass-card obc"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="occ-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <FiCheckCircle style={{ color: '#39ff14' }} />
              <h3>Certifications</h3>
            </div>
            <button 
              onClick={onAddCertification}
              style={{ background: 'transparent', border: '1px solid #39ff14', color: '#39ff14', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              + Add
            </button>
          </div>
          <div className="cert-list">
            {(records?.certifications || []).map((c, i) => (
              <motion.div
                key={i}
                className="cert-item"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ x: 4 }}
              >
                <span className="cert-badge">{c.badge}</span>
                <div className="cert-info">
                  <span className="cert-name">{c.name}</span>
                  <span className="cert-meta">{c.issuer} · {c.date}</span>
                </div>
                <span className="cert-verified">✓</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="glass-card obc"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="occ-header">
            <FiZap style={{ color: '#ffe600' }} />
            <h3>Projects</h3>
          </div>
          <div className="project-list">
            {(records?.projects || []).map((p, i) => (
              <motion.div
                key={i}
                className="project-item"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -3 }}
              >
                <div className="project-top">
                  <span className="project-title">{p.title}</span>
                  <span
                    className="project-grade"
                    style={{ color: p.grade === 'A+' ? '#39ff14' : p.grade === 'A' ? '#ffe600' : '#00f5ff' }}
                  >
                    {p.grade}
                  </span>
                </div>
                <div className="project-tech">{p.tech}</div>
                <div className="project-year">{p.year}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Track Records Tab ──────────────────────────────────────────────────────────
function TrackRecordsTab({ records }) {
  const sems = records?.semesters || [];
  const att = records?.attendance || {};
  const asgn = records?.assignments || {};

  return (
    <div className="tab-content">
      {/* Attendance + Assignment cards */}
      <div className="track-top-grid">
        <motion.div
          className="glass-card track-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="occ-header">
            <FiCalendar style={{ color: '#00f5ff' }} />
            <h3>Attendance Overview</h3>
          </div>
          <div className="attendance-ring-wrap">
            <div className="att-ring" style={{ '--pct': att.percent || 0 }}>
              <svg viewBox="0 0 100 100" className="ring-svg">
                <circle className="ring-bg" cx="50" cy="50" r="42" />
                <motion.circle
                  className="ring-fill"
                  cx="50" cy="50" r="42"
                  stroke={att.percent >= 90 ? '#39ff14' : att.percent >= 75 ? '#ffe600' : '#ff2d78'}
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 - (264 * (att.percent || 0)) / 100 }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
                />
              </svg>
              <div className="ring-center">
                <span className="ring-val" style={{ color: att.percent >= 90 ? '#39ff14' : att.percent >= 75 ? '#ffe600' : '#ff2d78' }}>
                  {att.percent}%
                </span>
                <span className="ring-sub">Attendance</span>
              </div>
            </div>
            <div className="att-meta">
              <div className="att-row"><span>Total Classes</span><strong>{att.total}</strong></div>
              <div className="att-row"><span>Classes Attended</span><strong style={{ color: '#39ff14' }}>{att.present}</strong></div>
              <div className="att-row"><span>Classes Missed</span><strong style={{ color: '#ff2d78' }}>{att.total - att.present}</strong></div>
              <div className="att-status">
                {att.percent >= 75
                  ? <span style={{ color: '#39ff14' }}>✅ Eligible for exams</span>
                  : <span style={{ color: '#ff2d78' }}>⚠️ Below 75% — at risk</span>}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass-card track-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="occ-header">
            <FiCheckCircle style={{ color: '#ffe600' }} />
            <h3>Assignment Tracker</h3>
          </div>
          <div className="asgn-stats">
            <div className="asgn-big">
              <span className="asgn-num" style={{ color: '#b44fff' }}>{asgn.submitted}</span>
              <span className="asgn-denom">/ {asgn.total}</span>
              <span className="asgn-label">Submitted</span>
            </div>
            <div className="asgn-bars">
              {[
                { label: 'Submitted', val: asgn.submitted, total: asgn.total, color: '#b44fff' },
                { label: 'On Time', val: asgn.onTime, total: asgn.total, color: '#39ff14' },
                { label: 'Pending', val: asgn.total - asgn.submitted, total: asgn.total, color: '#ff2d78' },
              ].map(({ label, val, total, color }) => (
                <div key={label} className="asgn-bar-row">
                  <span>{label}</span>
                  <div className="asgn-bar-track">
                    <motion.div
                      className="asgn-bar-fill"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / total) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <span style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Semester-wise GPA bar chart */}
      <motion.div
        className="glass-card"
        style={{ padding: 28, marginBottom: 24 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="occ-header">
          <FiTrendingUp style={{ color: '#b44fff' }} />
          <h3>Semester-wise GPA</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sems} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="sem" stroke="#9090b0" tick={{ fontSize: 13 }} />
            <YAxis domain={[0, 10]} stroke="#9090b0" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="gpa" radius={[8, 8, 0, 0]} name="GPA">
              {sems.map((_, i) => (
                <Cell key={i} fill={['#b44fff', '#00f5ff', '#ff2d78', '#ffe600'][i % 4]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Semester subject cards */}
      <h3 className="section-heading">📚 Semester Details</h3>
      <div className="sem-grid">
        {sems.map((sem, i) => (
          <motion.div
            key={sem.sem}
            className="glass-card sem-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
          >
            <div className="sem-card-top">
              <span className="sem-label">{sem.sem}</span>
              <span className="sem-gpa" style={{
                color: sem.gpa >= 9 ? '#39ff14' : sem.gpa >= 8 ? '#ffe600' : sem.gpa >= 7 ? '#00f5ff' : '#ff6b35',
              }}>
                {sem.gpa} GPA
              </span>
            </div>
            <div className="sem-meta">
              <span>📦 {sem.credits} Credits</span>
              <span>📅 {sem.attendance}% Attendance</span>
            </div>
            <div className="sem-subjects">
              {sem.subjects.map(s => (
                <span key={s} className="sem-sub">{s}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Competitions Tab ───────────────────────────────────────────────────────────
function CompetitionsTab({ studentId, comps = [] }) {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(comps.map(c => c.category))];

  const filtered = filter === 'All' ? comps : comps.filter(c => c.category === filter);

  const wins = comps.filter(c => c.position.includes('1st') || c.position.includes('Winner')).length;
  const podiums = comps.filter(c => c.position.match(/1st|2nd|3rd|Winner|Runner/)).length;

  return (
    <div className="tab-content">
      {/* Summary bar */}
      <div className="comp-summary">
        {[
          { label: 'Total Participated', val: comps.length, color: '#b44fff' },
          { label: 'Podium Finishes', val: podiums, color: '#ffe600' },
          { label: '1st Place Wins', val: wins, color: '#39ff14' },
          { label: 'Categories', val: new Set(comps.map(c => c.category)).size, color: '#00f5ff' },
        ].map(({ label, val, color }, i) => (
          <motion.div
            key={label}
            className="comp-sum-card"
            style={{ '--clr': color }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.05, y: -3 }}
          >
            <span className="comp-sum-val">{val}</span>
            <span className="comp-sum-label">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="comp-filters">
        {categories.map(cat => (
          <motion.button
            key={cat}
            className={`comp-filter-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Competition cards */}
      {filtered.length === 0 ? (
        <div className="empty-comps">
          <span style={{ fontSize: 60 }}>🏆</span>
          <p>No competitions in this category yet.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="comp-list">
            {filtered.map((c, i) => (
              <motion.div
                key={c.title}
                className="comp-card glass-card"
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="comp-card-left">
                  <div
                    className="comp-cat-badge"
                    style={{ background: `${CATEGORY_COLORS[c.category] || '#b44fff'}20`, color: CATEGORY_COLORS[c.category] || '#b44fff', borderColor: `${CATEGORY_COLORS[c.category] || '#b44fff'}40` }}
                  >
                    {c.category}
                  </div>
                  <h3 className="comp-title">{c.title}</h3>
                  <p className="comp-desc">{c.description}</p>
                  <div className="comp-meta-row">
                    <span>🏛️ {c.organizer}</span>
                    <span>📅 {c.date}</span>
                    <span>👥 {c.team}</span>
                  </div>
                </div>
                <div className="comp-card-right">
                  <div className="comp-position">{c.position}</div>
                  <div className="comp-prize">{c.prize}</div>
                </div>
                <div className="comp-card-glow" style={{ '--cc': CATEGORY_COLORS[c.category] || '#b44fff' }} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Achievements Tab ───────────────────────────────────────────────────────────
function AchievementsTab({ studentId, records, comps = [] }) {
  const achievements = ACHIEVEMENTS[studentId] || [];

  return (
    <div className="tab-content">
      <div className="achievements-grid">
        {achievements.map((ach, i) => (
          <motion.div
            key={i}
            className="ach-card glass-card"
            initial={{ opacity: 0, scale: 0.7, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, type: 'spring', stiffness: 200 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, rotate: 1, y: -4 }}
          >
            <div className="ach-icon">{ach.split(' ')[0]}</div>
            <div className="ach-label">{ach.slice(ach.indexOf(' ') + 1)}</div>
            <div className="ach-shine" />
          </motion.div>
        ))}
      </div>

      {/* Timeline of competitions */}
      <h3 className="section-heading">🏁 Competition Timeline</h3>
      <div className="timeline">
        {[...comps].sort((a, b) => new Date(b.date) - new Date(a.date)).map((c, i) => (
          <motion.div
            key={i}
            className="timeline-item"
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            viewport={{ once: true }}
          >
            <div className="timeline-dot" style={{ background: CATEGORY_COLORS[c.category] || '#b44fff' }} />
            <div
              className="timeline-card glass-card"
              style={{ '--tc': CATEGORY_COLORS[c.category] || '#b44fff' }}
            >
              <div className="tc-top">
                <span className="tc-title">{c.title}</span>
                <span className="tc-pos">{c.position}</span>
              </div>
              <div className="tc-meta">{c.organizer} · {c.date}</div>
              <div className="tc-prize">{c.prize}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main Portal ────────────────────────────────────────────────────────────────
export default function StudentPortal() {
  const { portalStudent, logoutStudent } = usePortalAuth();
  const navigate    = useNavigate();
  const [activeTab, setActiveTab]       = useState('overview');
  const [records,   setRecords]         = useState(null);
  const [comps,     setComps]           = useState([]);
  const [dataLoading, setDataLoading]   = useState(true);

  useEffect(() => {
    if (!portalStudent) { navigate('/student-login'); return; }

    // Fetch track records + competitions from MongoDB
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [trackData, compData] = await Promise.all([
          getTrackRecord(portalStudent.id),
          getCompetitions(portalStudent.id),
        ]);
        setRecords(trackData || {});
        setComps(compData || []);
      } catch (err) {
        console.warn('Could not fetch portal data:', err);
        setRecords({});
        setComps([]);
      }
      setDataLoading(false);
    };

    fetchData();
  }, [portalStudent, navigate]);

  if (!portalStudent) return null;

  if (dataLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <div className="login-spinner" style={{ width:40, height:40, borderWidth:3 }} />
      <p style={{ color:'var(--text-secondary)', fontFamily:"'Rajdhani',sans-serif" }}>Loading your portal...</p>
    </div>
  );

  const handleAddCertification = async () => {
    const certName = prompt("Enter Certification Name:");
    if (!certName) return;
    const issuer = prompt("Enter Issuer (e.g., Coursera, Udemy):") || "Unknown";
    const newCert = {
      name: certName,
      issuer: issuer,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      badge: "🏅"
    };

    const updatedRecords = { ...records };
    if (!updatedRecords.certifications) updatedRecords.certifications = [];
    updatedRecords.certifications.push(newCert);

    try {
      // Need to import saveTrackRecord
      const { saveTrackRecord } = await import('../services/portalApi.js');
      await saveTrackRecord(portalStudent.id, updatedRecords);
      setRecords(updatedRecords);
      toast.success("Certification added successfully!");
    } catch (err) {
      toast.error("Failed to save certification.");
    }
  };

  return (
    <div className="portal-page">
      <div className="orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      {/* Portal navbar */}
      <motion.header
        className="portal-header"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="portal-header-brand">
          <FiZap style={{ color: '#b44fff' }} />
          <span>Student <span style={{ color: 'var(--neon-cyan)' }}>Portal</span></span>
        </div>

        <div className="portal-header-center">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`portal-tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon />
              <span>{label}</span>
              {activeTab === id && <motion.div className="tab-indicator" layoutId="tab-ind" />}
            </button>
          ))}
        </div>

        <div className="portal-header-right">
          <div className="portal-student-chip">
            <AvatarBadge name={portalStudent.fullName} avatarIndex={portalStudent.avatar} size={32} />
            <span>{portalStudent.fullName.split(' ')[0]}</span>
          </div>
          <button className="portal-logout" onClick={() => { logoutStudent(); navigate('/student-login'); }}>
            <FiLogOut /> Logout
          </button>
        </div>
      </motion.header>

      {/* Content */}
      <div className="portal-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview'     && <OverviewTab     student={portalStudent} records={records} comps={comps} onAddCertification={handleAddCertification} />}
            {activeTab === 'track'        && <TrackRecordsTab records={records} />}
            {activeTab === 'competitions' && <CompetitionsTab studentId={portalStudent.id} comps={comps} />}
            {activeTab === 'achievements'  && <AchievementsTab studentId={portalStudent.id} records={records} comps={comps} />}
            {activeTab === 'announcements' && (
              <div className="tab-content">
                <AnnouncementBoard isAdmin={false} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AIChatbot
        studentContext={`Student: ${portalStudent.fullName}, Course: ${portalStudent.course}, Department: ${portalStudent.department}, GPA: ${portalStudent.gpa}`}
      />

      <MessagingBox studentId={portalStudent.id} currentUserRole="student" currentUserName={portalStudent.fullName} />
    </div>
  );
}
