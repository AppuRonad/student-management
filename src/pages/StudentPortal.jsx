import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, Legend,
} from 'recharts';
import {
  FiLogOut, FiUser, FiAward, FiBook, FiCalendar, FiBriefcase,
  FiCheckCircle, FiTrendingUp, FiStar, FiZap, FiTarget, FiPlus,
  FiX, FiUpload, FiFileText, FiLayers, FiPercent, FiSun, FiMoon,
} from 'react-icons/fi';
import { usePortalAuth } from '../context/PortalAuthContext';
import { ACHIEVEMENTS } from '../context/StudentPortalData';
import { getTrackRecord, getCompetitions, saveTrackRecord } from '../services/portalApi';
import { useTheme } from '../context/ThemeContext';
import AvatarBadge from '../components/AvatarBadge';
import AIChatbot from '../components/AIChatbot';
import AnnouncementBoard from '../components/AnnouncementBoard';
import StudentIDCard from '../components/StudentIDCard';
import MessagingBox from '../components/MessagingBox';
import { toast } from 'react-toastify';
import { useScrollReveal, useCounter } from '../hooks/useScrollReveal';
import './StudentPortal.css';

const TABS = [
  { id: 'overview',     label: 'Overview',     icon: FiUser },
  { id: 'track',        label: 'Academics',    icon: FiTrendingUp },
  { id: 'exams',        label: 'Examinations', icon: FiFileText },
  { id: 'internships',  label: 'Experience',   icon: FiBriefcase },
  { id: 'competency',   label: 'Competency',   icon: FiLayers },
  { id: 'competitions', label: 'Competitions', icon: FiAward },
  { id: 'achievements', label: 'Achievements', icon: FiStar },
  { id: 'announcements',label: 'Notices',      icon: FiTarget },
];

const CATEGORY_COLORS = {
  Hackathon: '#b44fff', 'Competitive Coding': '#00f5ff', Robotics: '#ff6b35',
  Business: '#ffe600', Marketing: '#ff2d78', Finance: '#39ff14',
  Academic: '#a78bfa', Research: '#f0abfc', Science: '#00f5ff',
  Innovation: '#ffe600', 'Data Science': '#39ff14', Technical: '#ff6b35',
};

const GRADE_COLORS = { 'A+': '#39ff14', A: '#ffe600', 'B+': '#00f5ff', B: '#b44fff', C: '#ff6b35', F: '#ff2d78' };

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

// ── Generic Modal ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div className="portal-modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div className="portal-modal"
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="pm-header">
            <h3>{title}</h3>
            <button className="pm-close" onClick={onClose}><FiX /></button>
          </div>
          <div className="pm-body">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Form field helper ─────────────────────────────────────────────────────────
function FormField({ label, children, required }) {
  return (
    <div className="pm-field">
      <label className="pm-label">{label}{required && <span style={{ color: '#ff2d78' }}> *</span>}</label>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function PortalStatCard({ icon: Icon, label, value, color, suffix = '', delay = 0 }) {
  const [ref, vis] = useScrollReveal();
  const count = useCounter(Number(String(value).replace(/[^0-9.]/g, '')) || 0, 1000, vis);
  return (
    <motion.div ref={ref} className="portal-stat" style={{ '--clr': color }}
      initial={{ opacity: 0, y: 30 }} animate={vis ? { opacity: 1, y: 0 } : {}}
      transition={{ delay }} whileHover={{ y: -4, scale: 1.03 }}
    >
      <div className="ps-icon"><Icon /></div>
      <div className="ps-value">{count}{suffix}</div>
      <div className="ps-label">{label}</div>
    </motion.div>
  );
}

// ── First-time Setup Banner ───────────────────────────────────────────────────
function SetupBanner({ onSetup }) {
  return (
    <motion.div className="setup-banner glass-card"
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="sb-icon">🎓</div>
      <div className="sb-text">
        <strong>Complete your academic profile!</strong>
        <p>Add your certifications, exam results, semester SGPAs, year CGPAs, projects and internships to unlock your full competency view.</p>
      </div>
      <button className="gradient-btn" onClick={onSetup}><FiPlus style={{ marginRight: 6 }} /> Setup Profile</button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ student, records, comps = [], onAddCertification, onAddProject, onAddSemester }) {
  const semData = records?.semesters || [];
  const adminMarks = records?.adminMarks;

  return (
    <div className="tab-content">
      {/* Profile hero */}
      <motion.div className="portal-profile-hero glass-card"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="pph-bg-rings"><div className="pph-ring" /><div className="pph-ring r2" /></div>
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
              {student.yearOfStudy && <span className="ptag green">Year {student.yearOfStudy}</span>}
            </div>
            <div className="pph-meta">
              <span>📧 {student.email}</span>
              <span>📞 {student.phone}</span>
              {student.academicYear && <span>🗓️ {student.academicYear}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
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
            <span className="pph-stat-v" style={{ color: '#ffe600' }}>{comps.length}</span>
            <span className="pph-stat-l">Competitions</span>
          </div>
          <div className="pph-stat">
            <span className="pph-stat-v" style={{ color: '#b44fff' }}>{(records?.certifications || []).length}</span>
            <span className="pph-stat-l">Certifications</span>
          </div>
        </div>
      </motion.div>

      {/* Admin marks badge */}
      {adminMarks?.overallStatus && (
        <motion.div className={`admin-status-banner ${adminMarks.overallStatus === 'PASS' ? 'pass' : 'fail'}`}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        >
          <span className="asb-status">{adminMarks.overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}</span>
          <span className="asb-grade">Grade: <strong>{adminMarks.overallGrade || '—'}</strong></span>
          {adminMarks.remarks && <span className="asb-remarks">"{adminMarks.remarks}"</span>}
        </motion.div>
      )}

      {/* Quick stats */}
      <div className="portal-stats-row">
        <PortalStatCard icon={FiTrendingUp} label="Attendance %" value={records?.attendance?.percent || 0} color="#b44fff" suffix="%" delay={0.1} />
        <PortalStatCard icon={FiCheckCircle} label="Assignments Done" value={records?.assignments?.submitted || 0} color="#00f5ff" delay={0.2} />
        <PortalStatCard icon={FiBriefcase} label="Internships" value={(records?.internships || []).length} color="#ff2d78" delay={0.3} />
        <PortalStatCard icon={FiStar} label="Projects" value={(records?.projects || []).length} color="#ffe600" delay={0.4} />
      </div>

      {/* GPA chart */}
      {semData.length > 0 && (
        <motion.div className="glass-card overview-chart-card"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <div className="occ-header"><FiTrendingUp style={{ color: '#b44fff' }} /><h3>GPA Trend Across Semesters</h3></div>
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
              <Area type="monotone" dataKey="gpa" stroke="#b44fff" strokeWidth={2.5} fill="url(#gpaGrad)" name="SGPA"
                dot={{ fill: '#b44fff', r: 5, strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Year CGPA chart */}
      {(records?.yearCgpas || []).length > 0 && (
        <motion.div className="glass-card overview-chart-card"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <div className="occ-header"><FiLayers style={{ color: '#00f5ff' }} /><h3>Year-wise CGPA</h3></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={records.yearCgpas} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="academicYear" stroke="#9090b0" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} stroke="#9090b0" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cgpa" radius={[8, 8, 0, 0]} name="CGPA">
                {records.yearCgpas.map((_, i) => (
                  <Cell key={i} fill={['#b44fff', '#00f5ff', '#ff2d78', '#ffe600'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Certifications + Projects */}
      <div className="overview-bottom-grid">
        <motion.div className="glass-card obc"
          initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        >
          <div className="occ-header" style={{ justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <FiCheckCircle style={{ color: '#39ff14' }} /><h3>Certifications</h3>
            </div>
            <button className="add-mini-btn" onClick={onAddCertification}><FiPlus /> Add</button>
          </div>
          <div className="cert-list">
            {(records?.certifications || []).length === 0
              ? <p className="empty-hint">No certifications yet. Click + Add!</p>
              : (records.certifications).map((c, i) => (
                <motion.div key={i} className="cert-item"
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }} viewport={{ once: true }} whileHover={{ x: 4 }}
                >
                  <span className="cert-badge">{c.badge || '🏅'}</span>
                  <div className="cert-info">
                    <span className="cert-name">{c.name}</span>
                    <span className="cert-meta">{c.issuer} · {c.date}</span>
                  </div>
                  <span className="cert-verified">✓</span>
                </motion.div>
              ))}
          </div>
        </motion.div>

        <motion.div className="glass-card obc"
          initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        >
          <div className="occ-header" style={{ justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <FiZap style={{ color: '#ffe600' }} /><h3>Projects</h3>
            </div>
            <button className="add-mini-btn" onClick={onAddProject}><FiPlus /> Add</button>
          </div>
          <div className="project-list">
            {(records?.projects || []).length === 0
              ? <p className="empty-hint">No projects yet. Click + Add!</p>
              : (records.projects).map((p, i) => (
                <motion.div key={i} className="project-item"
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }} whileHover={{ y: -3 }}
                >
                  <div className="project-top">
                    <span className="project-title">{p.title}</span>
                    {p.grade && <span className="project-grade" style={{ color: GRADE_COLORS[p.grade] || '#b44fff' }}>{p.grade}</span>}
                  </div>
                  {p.description && <div className="project-desc">{p.description}</div>}
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

// ═══════════════════════════════════════════════════════════════════════════════
// TRACK RECORDS TAB (Academics)
// ═══════════════════════════════════════════════════════════════════════════════
function TrackRecordsTab({ records, onAddSemester, onAddYearCgpa }) {
  const sems = records?.semesters || [];
  const att = records?.attendance || {};
  const asgn = records?.assignments || {};
  const adminMarks = records?.adminMarks;

  return (
    <div className="tab-content">
      {/* Admin marks summary */}
      {adminMarks?.semesterMarks?.length > 0 && (
        <motion.div className="glass-card admin-sem-marks"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="occ-header"><FiFileText style={{ color: '#ffe600' }} /><h3>Admin-Assigned Marks</h3></div>
          <div className="admin-marks-grid">
            {adminMarks.semesterMarks.map((sm, i) => (
              <div key={i} className="admin-mark-chip">
                <span className="amc-sem">{sm.sem}</span>
                <span className="amc-marks">{sm.marks ?? '—'}/100</span>
                <span className={`amc-grade grade-${sm.grade}`}>{sm.grade || '—'}</span>
                <span className={`amc-status ${sm.status === 'PASS' ? 'pass' : 'fail'}`}>{sm.status || '—'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="track-top-grid">
        {/* Attendance ring */}
        <motion.div className="glass-card track-card"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="occ-header"><FiCalendar style={{ color: '#00f5ff' }} /><h3>Attendance Overview</h3></div>
          <div className="attendance-ring-wrap">
            <div className="att-ring" style={{ '--pct': att.percent || 0 }}>
              <svg viewBox="0 0 100 100" className="ring-svg">
                <circle className="ring-bg" cx="50" cy="50" r="42" />
                <motion.circle className="ring-fill" cx="50" cy="50" r="42"
                  stroke={att.percent >= 90 ? '#39ff14' : att.percent >= 75 ? '#ffe600' : '#ff2d78'}
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 - (264 * (att.percent || 0)) / 100 }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
                />
              </svg>
              <div className="ring-center">
                <span className="ring-val" style={{ color: att.percent >= 90 ? '#39ff14' : att.percent >= 75 ? '#ffe600' : '#ff2d78' }}>
                  {att.percent || 0}%
                </span>
                <span className="ring-sub">Attendance</span>
              </div>
            </div>
            <div className="att-meta">
              <div className="att-row"><span>Total Classes</span><strong>{att.total || 0}</strong></div>
              <div className="att-row"><span>Attended</span><strong style={{ color: '#39ff14' }}>{att.present || 0}</strong></div>
              <div className="att-row"><span>Missed</span><strong style={{ color: '#ff2d78' }}>{(att.total || 0) - (att.present || 0)}</strong></div>
              <div className="att-status">
                {(att.percent || 0) >= 75
                  ? <span style={{ color: '#39ff14' }}>✅ Eligible for exams</span>
                  : <span style={{ color: '#ff2d78' }}>⚠️ Below 75% — at risk</span>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Assignment tracker */}
        <motion.div className="glass-card track-card"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div className="occ-header"><FiCheckCircle style={{ color: '#ffe600' }} /><h3>Assignment Tracker</h3></div>
          <div className="asgn-stats">
            <div className="asgn-big">
              <span className="asgn-num" style={{ color: '#b44fff' }}>{asgn.submitted || 0}</span>
              <span className="asgn-denom">/ {asgn.total || 0}</span>
              <span className="asgn-label">Submitted</span>
            </div>
            <div className="asgn-bars">
              {[
                { label: 'Submitted', val: asgn.submitted || 0, total: asgn.total || 1, color: '#b44fff' },
                { label: 'On Time', val: asgn.onTime || 0, total: asgn.total || 1, color: '#39ff14' },
                { label: 'Pending', val: (asgn.total || 0) - (asgn.submitted || 0), total: asgn.total || 1, color: '#ff2d78' },
              ].map(({ label, val, total, color }) => (
                <div key={label} className="asgn-bar-row">
                  <span>{label}</span>
                  <div className="asgn-bar-track">
                    <motion.div className="asgn-bar-fill" style={{ background: color }}
                      initial={{ width: 0 }} animate={{ width: `${(val / total) * 100}%` }}
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

      {/* Semester-wise SGPA */}
      <motion.div className="glass-card" style={{ padding: 28, marginBottom: 24 }}
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        <div className="occ-header" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <FiTrendingUp style={{ color: '#b44fff' }} /><h3>Semester-wise SGPA</h3>
          </div>
          <button className="add-mini-btn" onClick={onAddSemester}><FiPlus /> Add Semester</button>
        </div>
        {sems.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sems} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="sem" stroke="#9090b0" tick={{ fontSize: 13 }} />
              <YAxis domain={[0, 10]} stroke="#9090b0" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gpa" radius={[8, 8, 0, 0]} name="SGPA">
                {sems.map((_, i) => (
                  <Cell key={i} fill={['#b44fff', '#00f5ff', '#ff2d78', '#ffe600'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="empty-hint">No semesters added yet.</p>}
      </motion.div>

      {/* Year CGPA */}
      <motion.div className="glass-card" style={{ padding: 28, marginBottom: 24 }}
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        <div className="occ-header" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <FiLayers style={{ color: '#00f5ff' }} /><h3>Year-wise CGPA (1–10)</h3>
          </div>
          <button className="add-mini-btn" onClick={onAddYearCgpa}><FiPlus /> Add Year CGPA</button>
        </div>
        {(records?.yearCgpas || []).length > 0 ? (
          <div className="year-cgpa-list">
            {records.yearCgpas.map((y, i) => (
              <motion.div key={i} className="ycgpa-row"
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              >
                <span className="ycgpa-label">Year {y.year} <small>{y.academicYear}</small></span>
                <div className="ycgpa-bar-track">
                  <motion.div className="ycgpa-bar-fill"
                    style={{ background: ['#b44fff', '#00f5ff', '#ff2d78', '#ffe600'][i % 4] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(y.cgpa / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <span className="ycgpa-val">{y.cgpa}</span>
              </motion.div>
            ))}
          </div>
        ) : <p className="empty-hint">No year CGPAs added yet.</p>}
      </motion.div>

      {/* Semester cards */}
      {sems.length > 0 && (
        <>
          <h3 className="section-heading">📚 Semester Details</h3>
          <div className="sem-grid">
            {sems.map((sem, i) => (
              <motion.div key={sem.sem} className="glass-card sem-card"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }} whileHover={{ y: -4 }}
              >
                <div className="sem-card-top">
                  <span className="sem-label">{sem.sem}</span>
                  <span className="sem-gpa" style={{
                    color: sem.gpa >= 9 ? '#39ff14' : sem.gpa >= 8 ? '#ffe600' : sem.gpa >= 7 ? '#00f5ff' : '#ff6b35',
                  }}>
                    {sem.gpa} SGPA
                  </span>
                </div>
                <div className="sem-meta">
                  <span>📦 {sem.credits} Credits</span>
                  {sem.attendance > 0 && <span>📅 {sem.attendance}% Attendance</span>}
                </div>
                {sem.subjects?.length > 0 && (
                  <div className="sem-subjects">
                    {sem.subjects.map(s => <span key={s} className="sem-sub">{s}</span>)}
                  </div>
                )}
                {sem.grade && (
                  <div className="sem-admin-row">
                    <span className={`amc-grade grade-${sem.grade}`}>{sem.grade}</span>
                    {sem.status && <span className={`amc-status ${sem.status === 'PASS' ? 'pass' : 'fail'}`}>{sem.status}</span>}
                    {sem.marks != null && <span className="sem-marks">{sem.marks}/100</span>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMINATIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ExaminationsTab({ records, onAddExam }) {
  const exams = records?.examResults || [];
  const [filterSem, setFilterSem] = useState('All');
  const semesters = ['All', ...new Set(exams.map(e => e.semester))];

  const filtered = filterSem === 'All' ? exams : exams.filter(e => e.semester === filterSem);

  const passCount = exams.filter(e => e.status === 'PASS').length;
  const failCount = exams.filter(e => e.status === 'FAIL').length;
  const avgPercent = exams.length
    ? Math.round(exams.reduce((a, e) => a + (e.marksObtained / (e.maxMarks || 100)) * 100, 0) / exams.length)
    : 0;

  return (
    <div className="tab-content">
      <div className="exam-summary">
        {[
          { label: 'Total Exams', val: exams.length, color: '#b44fff' },
          { label: 'Passed', val: passCount, color: '#39ff14' },
          { label: 'Failed', val: failCount, color: '#ff2d78' },
          { label: 'Avg Score %', val: `${avgPercent}%`, color: '#00f5ff' },
        ].map(({ label, val, color }, i) => (
          <motion.div key={label} className="comp-sum-card" style={{ '--clr': color }}
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }} whileHover={{ scale: 1.05, y: -3 }}
          >
            <span className="comp-sum-val">{val}</span>
            <span className="comp-sum-label">{label}</span>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="comp-filters">
          {semesters.map(s => (
            <button key={s} className={`comp-filter-chip ${filterSem === s ? 'active' : ''}`}
              onClick={() => setFilterSem(s)}
            >{s}</button>
          ))}
        </div>
        <button className="add-mini-btn" onClick={onAddExam}><FiPlus /> Add Result</button>
      </div>

      {filtered.length === 0
        ? <div className="empty-comps"><span style={{ fontSize: 60 }}>📝</span><p>No exam results yet. Add your first one!</p></div>
        : (
          <div className="exam-table-wrap">
            <table className="exam-table">
              <thead>
                <tr>
                  <th>Subject</th><th>Semester</th><th>Type</th>
                  <th>Marks</th><th>Grade</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <motion.tr key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td>{e.subject}</td>
                    <td>{e.semester}</td>
                    <td><span className="exam-type-badge">{e.examType}</span></td>
                    <td><span className="exam-marks">{e.marksObtained}/{e.maxMarks || 100}</span></td>
                    <td><span className={`amc-grade grade-${e.grade}`}>{e.grade || '—'}</span></td>
                    <td><span className={`amc-status ${e.status === 'PASS' ? 'pass' : 'fail'}`}>{e.status || '—'}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE TAB (Internships + Projects)
// ═══════════════════════════════════════════════════════════════════════════════
function ExperienceTab({ records, onAddInternship, onAddProject }) {
  const internships = records?.internships || [];
  const projects = records?.projects || [];
  const totalMonths = internships.reduce((a, i) => a + (i.durationMonths || 0), 0);

  return (
    <div className="tab-content">
      {/* Internships */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-heading" style={{ margin: 0 }}>💼 Internships</h3>
        <button className="add-mini-btn" onClick={onAddInternship}><FiPlus /> Add Internship</button>
      </div>
      {totalMonths > 0 && (
        <div className="total-exp-badge">
          <FiBriefcase /> <strong>{totalMonths} months</strong> total internship experience
        </div>
      )}
      {internships.length === 0
        ? <div className="empty-comps" style={{ marginBottom: 32 }}><span style={{ fontSize: 50 }}>💼</span><p>No internships added yet.</p></div>
        : (
          <div className="internship-list">
            {internships.map((intern, i) => (
              <motion.div key={i} className="internship-card glass-card"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }} whileHover={{ y: -4 }}
              >
                <div className="ic-left">
                  <div className="ic-company-icon">{intern.company?.[0]?.toUpperCase() || '?'}</div>
                </div>
                <div className="ic-body">
                  <div className="ic-role">{intern.role}</div>
                  <div className="ic-company">{intern.company}</div>
                  {intern.description && <div className="ic-desc">{intern.description}</div>}
                  <div className="ic-meta">
                    <span>📅 {intern.startDate}{intern.endDate ? ` → ${intern.endDate}` : ''}</span>
                    {intern.stipend && <span>💰 {intern.stipend}</span>}
                  </div>
                </div>
                <div className="ic-duration">
                  <span className="ic-months">{intern.durationMonths}</span>
                  <span className="ic-months-label">months</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      {/* Projects */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px' }}>
        <h3 className="section-heading" style={{ margin: 0 }}>🚀 Projects</h3>
        <button className="add-mini-btn" onClick={onAddProject}><FiPlus /> Add Project</button>
      </div>
      {projects.length === 0
        ? <div className="empty-comps"><span style={{ fontSize: 50 }}>🚀</span><p>No projects added yet.</p></div>
        : (
          <div className="projects-grid">
            {projects.map((p, i) => (
              <motion.div key={i} className="project-full-card glass-card"
                initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }} whileHover={{ y: -5 }}
              >
                <div className="pfc-top">
                  <span className="pfc-title">{p.title}</span>
                  {p.grade && <span className="project-grade" style={{ color: GRADE_COLORS[p.grade] || '#b44fff' }}>{p.grade}</span>}
                </div>
                {p.description && <p className="pfc-desc">{p.description}</p>}
                <div className="pfc-footer">
                  <span className="pfc-tech">{p.tech}</span>
                  <span className="pfc-year">{p.year}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETENCY TAB
// ═══════════════════════════════════════════════════════════════════════════════
function CompetencyTab({ student, records, comps = [] }) {
  const sems = records?.semesters || [];
  const internships = records?.internships || [];
  const projects = records?.projects || [];
  const certs = records?.certifications || [];
  const exams = records?.examResults || [];

  const avgSgpa = sems.length ? (sems.reduce((a, s) => a + s.gpa, 0) / sems.length).toFixed(2) : 0;
  const latestCgpa = (records?.yearCgpas || []).slice(-1)[0]?.cgpa || 0;
  const adminMarks = records?.adminMarks;

  // Radar data
  const radarData = [
    { subject: 'Academic', A: Math.min(100, (parseFloat(avgSgpa) / 10) * 100) },
    { subject: 'Projects', A: Math.min(100, projects.length * 20) },
    { subject: 'Internships', A: Math.min(100, internships.reduce((a, i) => a + (i.durationMonths || 0), 0) * 8) },
    { subject: 'Certifications', A: Math.min(100, certs.length * 15) },
    { subject: 'Competitions', A: Math.min(100, comps.length * 12) },
    { subject: 'Attendance', A: records?.attendance?.percent || 0 },
  ];

  const overallScore = Math.round(radarData.reduce((a, r) => a + r.A, 0) / radarData.length);

  const badges = [
    { earned: parseFloat(avgSgpa) >= 9, icon: '🏅', label: 'Academic Excellence', desc: 'Avg SGPA ≥ 9.0' },
    { earned: internships.length >= 1, icon: '💼', label: 'Industry Ready', desc: '1+ Internship' },
    { earned: projects.length >= 2, icon: '🚀', label: 'Builder', desc: '2+ Projects' },
    { earned: certs.length >= 3, icon: '📜', label: 'Certified Pro', desc: '3+ Certifications' },
    { earned: comps.length >= 2, icon: '🏆', label: 'Competitor', desc: '2+ Competitions' },
    { earned: (records?.attendance?.percent || 0) >= 90, icon: '✅', label: 'Perfect Attendance', desc: '90%+ Attendance' },
    { earned: internships.reduce((a, i) => a + (i.durationMonths || 0), 0) >= 6, icon: '⭐', label: 'Experienced', desc: '6+ months exp.' },
  ];

  return (
    <div className="tab-content">
      {/* Overall competency score */}
      <motion.div className="glass-card competency-hero"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      >
        <div className="comp-score-wrap">
          <div className="comp-score-ring">
            <svg viewBox="0 0 120 120" style={{ width: 160, height: 160 }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(180,79,255,0.15)" strokeWidth="10" />
              <motion.circle cx="60" cy="60" r="50" fill="none"
                stroke={overallScore >= 70 ? '#39ff14' : overallScore >= 50 ? '#ffe600' : '#ff6b35'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - overallScore / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="comp-score-center">
              <span className="comp-score-num">{overallScore}</span>
              <span className="comp-score-label">/ 100</span>
            </div>
          </div>
          <div className="comp-score-info">
            <h2>Competency Score</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Based on academics, projects, internships, certifications & competitions
            </p>
            {adminMarks?.overallStatus && (
              <div className={`admin-status-banner ${adminMarks.overallStatus === 'PASS' ? 'pass' : 'fail'}`} style={{ margin: '12px 0 0' }}>
                <span className="asb-status">{adminMarks.overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}</span>
                <span className="asb-grade">Grade: <strong>{adminMarks.overallGrade || '—'}</strong></span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Radar chart */}
      <motion.div className="glass-card" style={{ padding: 28, marginBottom: 24 }}
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        <div className="occ-header"><FiLayers style={{ color: '#b44fff' }} /><h3>Skill Breakdown</h3></div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" stroke="#9090b0" tick={{ fontSize: 13 }} />
            <Radar name="Score" dataKey="A" stroke="#b44fff" fill="#b44fff" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Stats row */}
      <div className="competency-stats">
        {[
          { label: 'Avg SGPA', val: avgSgpa, color: '#b44fff' },
          { label: 'Latest CGPA', val: latestCgpa || '—', color: '#00f5ff' },
          { label: 'Internship Months', val: internships.reduce((a, i) => a + (i.durationMonths || 0), 0), color: '#ff2d78' },
          { label: 'Projects Built', val: projects.length, color: '#ffe600' },
          { label: 'Certifications', val: certs.length, color: '#39ff14' },
          { label: 'Competitions', val: comps.length, color: '#ff6b35' },
        ].map(({ label, val, color }, i) => (
          <motion.div key={label} className="comp-stat-mini" style={{ '--clr': color }}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} viewport={{ once: true }}
          >
            <span className="csm-val">{val}</span>
            <span className="csm-label">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      <h3 className="section-heading">🎖️ Earned Badges</h3>
      <div className="badges-grid">
        {badges.map((b, i) => (
          <motion.div key={i} className={`badge-card glass-card ${b.earned ? 'earned' : 'locked'}`}
            initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }} viewport={{ once: true }}
            whileHover={b.earned ? { scale: 1.08, y: -4 } : {}}
          >
            <div className="badge-icon">{b.earned ? b.icon : '🔒'}</div>
            <div className="badge-label">{b.label}</div>
            <div className="badge-desc">{b.desc}</div>
            {b.earned && <div className="badge-shine" />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETITIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function CompetitionsTab({ comps = [] }) {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(comps.map(c => c.category))];
  const filtered = filter === 'All' ? comps : comps.filter(c => c.category === filter);
  const wins = comps.filter(c => c.position?.includes('1st') || c.position?.includes('Winner')).length;
  const podiums = comps.filter(c => c.position?.match(/1st|2nd|3rd|Winner|Runner/)).length;

  return (
    <div className="tab-content">
      <div className="comp-summary">
        {[
          { label: 'Total', val: comps.length, color: '#b44fff' },
          { label: 'Podiums', val: podiums, color: '#ffe600' },
          { label: '1st Place', val: wins, color: '#39ff14' },
          { label: 'Categories', val: new Set(comps.map(c => c.category)).size, color: '#00f5ff' },
        ].map(({ label, val, color }, i) => (
          <motion.div key={label} className="comp-sum-card" style={{ '--clr': color }}
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }} whileHover={{ scale: 1.05, y: -3 }}
          >
            <span className="comp-sum-val">{val}</span>
            <span className="comp-sum-label">{label}</span>
          </motion.div>
        ))}
      </div>
      <div className="comp-filters">
        {categories.map(cat => (
          <button key={cat} className={`comp-filter-chip ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>{cat}</button>
        ))}
      </div>
      {filtered.length === 0
        ? <div className="empty-comps"><span style={{ fontSize: 60 }}>🏆</span><p>No competitions yet.</p></div>
        : (
          <div className="comp-list">
            {filtered.map((c, i) => (
              <motion.div key={c.title} className="comp-card glass-card"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="comp-card-left">
                  <div className="comp-cat-badge"
                    style={{ background: `${CATEGORY_COLORS[c.category] || '#b44fff'}20`, color: CATEGORY_COLORS[c.category] || '#b44fff', borderColor: `${CATEGORY_COLORS[c.category] || '#b44fff'}40` }}
                  >{c.category}</div>
                  <h3 className="comp-title">{c.title}</h3>
                  <p className="comp-desc">{c.description}</p>
                  <div className="comp-meta-row"><span>🏛️ {c.organizer}</span><span>📅 {c.date}</span><span>👥 {c.team}</span></div>
                </div>
                <div className="comp-card-right">
                  <div className="comp-position">{c.position}</div>
                  <div className="comp-prize">{c.prize}</div>
                </div>
                <div className="comp-card-glow" style={{ '--cc': CATEGORY_COLORS[c.category] || '#b44fff' }} />
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function AchievementsTab({ studentId, comps = [] }) {
  const achievements = ACHIEVEMENTS[studentId] || [];
  return (
    <div className="tab-content">
      <div className="achievements-grid">
        {achievements.map((ach, i) => (
          <motion.div key={i} className="ach-card glass-card"
            initial={{ opacity: 0, scale: 0.7, rotate: -5 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, type: 'spring', stiffness: 200 }} viewport={{ once: true }}
            whileHover={{ scale: 1.05, rotate: 1, y: -4 }}
          >
            <div className="ach-icon">{ach.split(' ')[0]}</div>
            <div className="ach-label">{ach.slice(ach.indexOf(' ') + 1)}</div>
            <div className="ach-shine" />
          </motion.div>
        ))}
      </div>
      <h3 className="section-heading">🏁 Competition Timeline</h3>
      <div className="timeline">
        {[...comps].sort((a, b) => new Date(b.date) - new Date(a.date)).map((c, i) => (
          <motion.div key={i} className="timeline-item"
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
          >
            <div className="timeline-dot" style={{ background: CATEGORY_COLORS[c.category] || '#b44fff' }} />
            <div className="timeline-card glass-card" style={{ '--tc': CATEGORY_COLORS[c.category] || '#b44fff' }}>
              <div className="tc-top"><span className="tc-title">{c.title}</span><span className="tc-pos">{c.position}</span></div>
              <div className="tc-meta">{c.organizer} · {c.date}</div>
              <div className="tc-prize">{c.prize}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PORTAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentPortal() {
  const { portalStudent, logoutStudent } = usePortalAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [records, setRecords] = useState(null);
  const [comps, setComps] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modal states
  const [modal, setModal] = useState(null); // 'cert' | 'project' | 'internship' | 'exam' | 'semester' | 'yearcgpa'

  // Form states
  const [certForm, setCertForm] = useState({ name: '', issuer: '', date: '', badge: '🏅' });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', tech: '', grade: '', year: new Date().getFullYear() });
  const [internForm, setInternForm] = useState({ company: '', role: '', durationMonths: '', startDate: '', endDate: '', description: '', stipend: '' });
  const [examForm, setExamForm] = useState({ subject: '', semester: '', examType: 'Internal', marksObtained: '', maxMarks: 100, grade: '', status: 'PASS' });
  const [semForm, setSemForm] = useState({ sem: '', gpa: '', credits: '', subjects: '', attendance: '' });
  const [cgpaForm, setCgpaForm] = useState({ year: '', cgpa: '', academicYear: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!portalStudent) { navigate('/student-login'); return; }
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
        setRecords({});
        setComps([]);
      }
      setDataLoading(false);
    };
    fetchData();
  }, [portalStudent, navigate]);

  if (!portalStudent) return null;
  if (dataLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div className="login-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-secondary)', fontFamily: "'Rajdhani',sans-serif" }}>Loading your portal...</p>
    </div>
  );

  const saveAndClose = async (updatedRecords) => {
    setSaving(true);
    try {
      const saved = await saveTrackRecord(portalStudent.id, updatedRecords);
      setRecords(saved || updatedRecords);
      toast.success('Saved successfully!');
      setModal(null);
    } catch {
      toast.error('Failed to save. Try again.');
    }
    setSaving(false);
  };

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleSaveCert = () => {
    if (!certForm.name || !certForm.issuer) { toast.error('Name and issuer required'); return; }
    const updated = { ...records, certifications: [...(records.certifications || []), { ...certForm, date: certForm.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }] };
    saveAndClose(updated);
    setCertForm({ name: '', issuer: '', date: '', badge: '🏅' });
  };

  const handleSaveProject = () => {
    if (!projectForm.title) { toast.error('Project title required'); return; }
    const updated = { ...records, projects: [...(records.projects || []), projectForm] };
    saveAndClose(updated);
    setProjectForm({ title: '', description: '', tech: '', grade: '', year: new Date().getFullYear() });
  };

  const handleSaveInternship = () => {
    if (!internForm.company || !internForm.role || !internForm.durationMonths) { toast.error('Company, role and duration required'); return; }
    const updated = { ...records, internships: [...(records.internships || []), { ...internForm, durationMonths: parseInt(internForm.durationMonths) }] };
    saveAndClose(updated);
    setInternForm({ company: '', role: '', durationMonths: '', startDate: '', endDate: '', description: '', stipend: '' });
  };

  const handleSaveExam = () => {
    if (!examForm.subject || !examForm.semester) { toast.error('Subject and semester required'); return; }
    const updated = { ...records, examResults: [...(records.examResults || []), { ...examForm, marksObtained: parseInt(examForm.marksObtained) || 0, maxMarks: parseInt(examForm.maxMarks) || 100 }] };
    saveAndClose(updated);
    setExamForm({ subject: '', semester: '', examType: 'Internal', marksObtained: '', maxMarks: 100, grade: '', status: 'PASS' });
  };

  const handleSaveSemester = () => {
    if (!semForm.sem || !semForm.gpa) { toast.error('Semester name and SGPA required'); return; }
    const gpa = parseFloat(semForm.gpa);
    if (gpa < 0 || gpa > 10) { toast.error('SGPA must be between 0 and 10'); return; }
    const newSem = {
      sem: semForm.sem, gpa, credits: parseInt(semForm.credits) || 0,
      subjects: semForm.subjects ? semForm.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
      attendance: parseInt(semForm.attendance) || 0,
    };
    const updated = { ...records, semesters: [...(records.semesters || []), newSem] };
    saveAndClose(updated);
    setSemForm({ sem: '', gpa: '', credits: '', subjects: '', attendance: '' });
  };

  const handleSaveYearCgpa = () => {
    if (!cgpaForm.year || !cgpaForm.cgpa) { toast.error('Year and CGPA required'); return; }
    const cgpa = parseFloat(cgpaForm.cgpa);
    if (cgpa < 0 || cgpa > 10) { toast.error('CGPA must be between 0 and 10'); return; }
    const updated = { ...records, yearCgpas: [...(records.yearCgpas || []), { ...cgpaForm, year: parseInt(cgpaForm.year), cgpa }] };
    saveAndClose(updated);
    setCgpaForm({ year: '', cgpa: '', academicYear: '' });
  };

  const isProfileEmpty = !records?.semesters?.length && !records?.certifications?.length;

  return (
    <div className="portal-page">
      <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      {/* Portal navbar */}
      <motion.header className="portal-header"
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      >
        <div className="portal-header-brand"><FiZap style={{ color: '#b44fff' }} /><span>Student <span style={{ color: 'var(--neon-cyan)' }}>Portal</span></span></div>
        <div className="portal-header-center">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`portal-tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
              <Icon /><span>{label}</span>
              {activeTab === id && <motion.div className="tab-indicator" layoutId="tab-ind" />}
            </button>
          ))}
        </div>
        <div className="portal-header-right">
          <motion.button
            className="theme-toggle"
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark'
                ? <motion.span key="sun" className="theme-icon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><FiSun /></motion.span>
                : <motion.span key="moon" className="theme-icon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><FiMoon /></motion.span>}
            </AnimatePresence>
          </motion.button>
          <div className="portal-student-chip">
            <AvatarBadge name={portalStudent.fullName} avatarIndex={portalStudent.avatar} size={32} />
            <span>{portalStudent.fullName.split(' ')[0]}</span>
          </div>
          <button className="portal-logout" onClick={() => { logoutStudent(); navigate('/student-login'); }}>
            <FiLogOut /> Logout
          </button>
        </div>
      </motion.header>

      <div className="portal-body">
        {isProfileEmpty && <SetupBanner onSetup={() => setModal('semester')} />}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewTab student={portalStudent} records={records} comps={comps}
              onAddCertification={() => setModal('cert')} onAddProject={() => setModal('project')} onAddSemester={() => setModal('semester')} />}
            {activeTab === 'track' && <TrackRecordsTab records={records}
              onAddSemester={() => setModal('semester')} onAddYearCgpa={() => setModal('yearcgpa')} />}
            {activeTab === 'exams' && <ExaminationsTab records={records} onAddExam={() => setModal('exam')} />}
            {activeTab === 'internships' && <ExperienceTab records={records}
              onAddInternship={() => setModal('internship')} onAddProject={() => setModal('project')} />}
            {activeTab === 'competency' && <CompetencyTab student={portalStudent} records={records} comps={comps} />}
            {activeTab === 'competitions' && <CompetitionsTab comps={comps} />}
            {activeTab === 'achievements' && <AchievementsTab studentId={portalStudent.id} comps={comps} />}
            {activeTab === 'announcements' && <div className="tab-content"><AnnouncementBoard isAdmin={false} /></div>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── MODALS ── */}

      {modal === 'cert' && (
        <Modal title="🏅 Add Certification" onClose={() => setModal(null)}>
          <FormField label="Certification Name" required>
            <input className="pm-input" placeholder="e.g. AWS Cloud Practitioner" value={certForm.name} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Issuer" required>
            <input className="pm-input" placeholder="e.g. Coursera, Udemy, Google" value={certForm.issuer} onChange={e => setCertForm(f => ({ ...f, issuer: e.target.value }))} />
          </FormField>
          <FormField label="Date">
            <input className="pm-input" type="date" value={certForm.date} onChange={e => setCertForm(f => ({ ...f, date: e.target.value }))} />
          </FormField>
          <FormField label="Badge Emoji">
            <input className="pm-input" placeholder="🏅" value={certForm.badge} onChange={e => setCertForm(f => ({ ...f, badge: e.target.value }))} />
          </FormField>
          <button className="gradient-btn pm-save" onClick={handleSaveCert} disabled={saving}>
            {saving ? 'Saving...' : <><FiUpload style={{ marginRight: 6 }} /> Save Certification</>}
          </button>
        </Modal>
      )}

      {modal === 'project' && (
        <Modal title="🚀 Add Project" onClose={() => setModal(null)}>
          <FormField label="Project Title" required>
            <input className="pm-input" placeholder="e.g. Museum Infotainment System" value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))} />
          </FormField>
          <FormField label="Description">
            <textarea className="pm-input pm-textarea" placeholder="What did you build? What problem does it solve?" value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Tech Stack">
            <input className="pm-input" placeholder="e.g. React, FastAPI, Firebase" value={projectForm.tech} onChange={e => setProjectForm(f => ({ ...f, tech: e.target.value }))} />
          </FormField>
          <div className="pm-row">
            <FormField label="Grade (optional)">
              <select className="pm-input" value={projectForm.grade} onChange={e => setProjectForm(f => ({ ...f, grade: e.target.value }))}>
                <option value="">— Select —</option>
                {['A+', 'A', 'B+', 'B', 'C', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>
            <FormField label="Year">
              <input className="pm-input" type="number" min="2018" max="2030" value={projectForm.year} onChange={e => setProjectForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
            </FormField>
          </div>
          <button className="gradient-btn pm-save" onClick={handleSaveProject} disabled={saving}>
            {saving ? 'Saving...' : <><FiUpload style={{ marginRight: 6 }} /> Save Project</>}
          </button>
        </Modal>
      )}

      {modal === 'internship' && (
        <Modal title="💼 Add Internship" onClose={() => setModal(null)}>
          <FormField label="Company Name" required>
            <input className="pm-input" placeholder="e.g. Nife Technologies" value={internForm.company} onChange={e => setInternForm(f => ({ ...f, company: e.target.value }))} />
          </FormField>
          <FormField label="Role / Position" required>
            <input className="pm-input" placeholder="e.g. Android Developer Intern" value={internForm.role} onChange={e => setInternForm(f => ({ ...f, role: e.target.value }))} />
          </FormField>
          <FormField label="Duration (months)" required>
            <input className="pm-input" type="number" min="1" max="36" placeholder="e.g. 3" value={internForm.durationMonths} onChange={e => setInternForm(f => ({ ...f, durationMonths: e.target.value }))} />
          </FormField>
          <div className="pm-row">
            <FormField label="Start Date">
              <input className="pm-input" type="date" value={internForm.startDate} onChange={e => setInternForm(f => ({ ...f, startDate: e.target.value }))} />
            </FormField>
            <FormField label="End Date">
              <input className="pm-input" type="date" value={internForm.endDate} onChange={e => setInternForm(f => ({ ...f, endDate: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea className="pm-input pm-textarea" placeholder="What did you work on?" value={internForm.description} onChange={e => setInternForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Stipend (optional)">
            <input className="pm-input" placeholder="e.g. ₹15,000/month" value={internForm.stipend} onChange={e => setInternForm(f => ({ ...f, stipend: e.target.value }))} />
          </FormField>
          <button className="gradient-btn pm-save" onClick={handleSaveInternship} disabled={saving}>
            {saving ? 'Saving...' : <><FiUpload style={{ marginRight: 6 }} /> Save Internship</>}
          </button>
        </Modal>
      )}

      {modal === 'exam' && (
        <Modal title="📝 Add Exam Result" onClose={() => setModal(null)}>
          <FormField label="Subject" required>
            <input className="pm-input" placeholder="e.g. Data Structures" value={examForm.subject} onChange={e => setExamForm(f => ({ ...f, subject: e.target.value }))} />
          </FormField>
          <div className="pm-row">
            <FormField label="Semester" required>
              <input className="pm-input" placeholder="e.g. Sem 3" value={examForm.semester} onChange={e => setExamForm(f => ({ ...f, semester: e.target.value }))} />
            </FormField>
            <FormField label="Exam Type">
              <select className="pm-input" value={examForm.examType} onChange={e => setExamForm(f => ({ ...f, examType: e.target.value }))}>
                {['Internal', 'External', 'Practical', 'Viva', 'Project'].map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
          </div>
          <div className="pm-row">
            <FormField label="Marks Obtained">
              <input className="pm-input" type="number" min="0" value={examForm.marksObtained} onChange={e => setExamForm(f => ({ ...f, marksObtained: e.target.value }))} />
            </FormField>
            <FormField label="Max Marks">
              <input className="pm-input" type="number" min="1" value={examForm.maxMarks} onChange={e => setExamForm(f => ({ ...f, maxMarks: e.target.value }))} />
            </FormField>
          </div>
          <div className="pm-row">
            <FormField label="Grade">
              <select className="pm-input" value={examForm.grade} onChange={e => setExamForm(f => ({ ...f, grade: e.target.value }))}>
                <option value="">— Select —</option>
                {['A+', 'A', 'B+', 'B', 'C', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select className="pm-input" value={examForm.status} onChange={e => setExamForm(f => ({ ...f, status: e.target.value }))}>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </FormField>
          </div>
          <button className="gradient-btn pm-save" onClick={handleSaveExam} disabled={saving}>
            {saving ? 'Saving...' : <><FiUpload style={{ marginRight: 6 }} /> Save Result</>}
          </button>
        </Modal>
      )}

      {modal === 'semester' && (
        <Modal title="📚 Add Semester" onClose={() => setModal(null)}>
          <FormField label="Semester Name" required>
            <input className="pm-input" placeholder="e.g. Sem 1, Sem 3" value={semForm.sem} onChange={e => setSemForm(f => ({ ...f, sem: e.target.value }))} />
          </FormField>
          <FormField label="SGPA (1–10)" required>
            <input className="pm-input" type="number" min="0" max="10" step="0.01" placeholder="e.g. 8.5" value={semForm.gpa} onChange={e => setSemForm(f => ({ ...f, gpa: e.target.value }))} />
          </FormField>
          <div className="pm-row">
            <FormField label="Credits">
              <input className="pm-input" type="number" min="0" placeholder="e.g. 24" value={semForm.credits} onChange={e => setSemForm(f => ({ ...f, credits: e.target.value }))} />
            </FormField>
            <FormField label="Attendance %">
              <input className="pm-input" type="number" min="0" max="100" placeholder="e.g. 85" value={semForm.attendance} onChange={e => setSemForm(f => ({ ...f, attendance: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Subjects (comma-separated)">
            <input className="pm-input" placeholder="e.g. OS, DBMS, CN, COA" value={semForm.subjects} onChange={e => setSemForm(f => ({ ...f, subjects: e.target.value }))} />
          </FormField>
          <button className="gradient-btn pm-save" onClick={handleSaveSemester} disabled={saving}>
            {saving ? 'Saving...' : <><FiUpload style={{ marginRight: 6 }} /> Save Semester</>}
          </button>
        </Modal>
      )}

      {modal === 'yearcgpa' && (
        <Modal title="📊 Add Year CGPA" onClose={() => setModal(null)}>
          <FormField label="Year (1/2/3/4)" required>
            <select className="pm-input" value={cgpaForm.year} onChange={e => setCgpaForm(f => ({ ...f, year: e.target.value }))}>
              <option value="">— Select Year —</option>
              {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </FormField>
          <FormField label="CGPA (1–10)" required>
            <input className="pm-input" type="number" min="0" max="10" step="0.01" placeholder="e.g. 8.2" value={cgpaForm.cgpa} onChange={e => setCgpaForm(f => ({ ...f, cgpa: e.target.value }))} />
          </FormField>
          <FormField label="Academic Year">
            <input className="pm-input" placeholder="e.g. 2023-24" value={cgpaForm.academicYear} onChange={e => setCgpaForm(f => ({ ...f, academicYear: e.target.value }))} />
          </FormField>
          <button className="gradient-btn pm-save" onClick={handleSaveYearCgpa} disabled={saving}>
            {saving ? 'Saving...' : <><FiUpload style={{ marginRight: 6 }} /> Save CGPA</>}
          </button>
        </Modal>
      )}

      <AIChatbot studentContext={`Student: ${portalStudent.fullName}, Course: ${portalStudent.course}, Department: ${portalStudent.department}, GPA: ${portalStudent.gpa}`} />
      <MessagingBox studentId={portalStudent.id} currentUserRole="student" currentUserName={portalStudent.fullName} />
    </div>
  );
}
