import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShield, FiUser, FiUsers, FiLogIn, FiUserPlus,
  FiBarChart2, FiBook, FiAward, FiMessageCircle, FiChevronDown,
} from 'react-icons/fi';
import './LandingPage.css';

const FEATURES = [
  { icon: <FiUsers />,       label: 'Student Records',    desc: 'Complete academic profiles, GPA, year-wise progression' },
  { icon: <FiBarChart2 />,   label: 'Analytics',          desc: 'Department-wise insights, performance charts, trends' },
  { icon: <FiBook />,        label: 'Track Records',      desc: 'Semesters, certifications, projects, internships' },
  { icon: <FiAward />,       label: 'Competitions',       desc: 'Hackathons, paper presentations, achievements' },
  { icon: <FiMessageCircle />, label: 'Messaging',        desc: 'Encrypted real-time chat between admin and students' },
  { icon: <FiShield />,      label: 'Role-based Access',  desc: 'Admin, Members (dept-scoped), Students — granular permissions' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const panels = [
    {
      id: 'admin',
      icon: <FiShield />,
      title: 'Admin',
      color: '#b44fff',
      gradient: 'linear-gradient(135deg, #b44fff, #7b2fff)',
      shadow: 'rgba(180,79,255,0.4)',
      border: 'rgba(180,79,255,0.35)',
      desc: 'Full system access — manage all students, approve members, set permissions and view all departments.',
      badge: 'Full Access',
      actions: [
        { label: 'Login / Register', icon: <FiLogIn />, to: '/admin-login', primary: true },
      ],
    },
    {
      id: 'member',
      icon: <FiUsers />,
      title: 'Member',
      color: '#ffe600',
      gradient: 'linear-gradient(135deg, #ffe600, #ff6b35)',
      shadow: 'rgba(255,230,0,0.35)',
      border: 'rgba(255,230,0,0.35)',
      desc: 'Department-level access — manage your department students based on permissions granted by admin.',
      badge: 'Dept Access',
      actions: [
        { label: 'Login',    icon: <FiLogIn />,    to: '/member-login',    primary: true },
        { label: 'Register', icon: <FiUserPlus />, to: '/member-register', primary: false },
      ],
    },
    {
      id: 'student',
      icon: <FiUser />,
      title: 'Student',
      color: '#00f5ff',
      gradient: 'linear-gradient(135deg, #00f5ff, #39ff14)',
      shadow: 'rgba(0,245,255,0.35)',
      border: 'rgba(0,245,255,0.35)',
      desc: 'View your academic profile, GPA tracker, certifications, competition history and achievements.',
      badge: 'Self Access',
      actions: [
        { label: 'Login',    icon: <FiLogIn />,    to: '/student-login',    primary: true },
        { label: 'Register', icon: <FiUserPlus />, to: '/student-register', primary: false },
      ],
    },
  ];

  return (
    <div className="lp-page">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <motion.section
        className="lp-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="lp-logo"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="lp-logo-icon"><FiUsers /></div>
          <span className="lp-logo-text">SMS <em>Pro</em></span>
        </motion.div>

        <motion.h1
          className="lp-headline"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          Manage Students<br />
          <span className="lp-hl-accent">Like Never Before</span>
        </motion.h1>

        <motion.p
          className="lp-sub"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          A next-gen Student Management System with real-time analytics,
          role-based access control, encrypted messaging and complete
          academic lifecycle tracking — built for Sambhram Institute of Technology.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          className="lp-pills"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          {['GPA Tracking', 'Department Analytics', 'Role-based Access', 'Encrypted Messaging', 'Competition Records', 'VTU Affiliated'].map(pill => (
            <span key={pill} className="lp-pill">{pill}</span>
          ))}
        </motion.div>

        <motion.div
          className="lp-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <FiChevronDown /> Choose your role below
        </motion.div>
      </motion.section>

      {/* ── Feature grid ───────────────────────────────────────────────────── */}
      <motion.section
        className="lp-features"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <h2 className="lp-section-title">Everything in one place</h2>
        <div className="lp-feature-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              className="lp-feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.07, duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-label">{f.label}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Role panels ────────────────────────────────────────────────────── */}
      <motion.section
        className="lp-panels-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h2 className="lp-section-title">Choose your role</h2>
        <p className="lp-section-sub">Select the panel that matches your role to get started</p>

        <div className="lp-panels">
          {panels.map((p, i) => (
            <motion.div
              key={p.id}
              className={`lp-panel ${expandedCard === p.id ? 'expanded' : ''}`}
              style={{
                '--panel-color':    p.color,
                '--panel-shadow':   p.shadow,
                '--panel-border':   p.border,
                '--panel-gradient': p.gradient,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              onClick={() => setExpandedCard(expandedCard === p.id ? null : p.id)}
            >
              {/* Card top */}
              <div className="lp-panel-top">
                <div className="lp-panel-icon" style={{ background: p.gradient }}>
                  {p.icon}
                </div>
                <div className="lp-panel-info">
                  <div className="lp-panel-title">{p.title}</div>
                  <span className="lp-panel-badge" style={{ color: p.color }}>
                    {p.badge}
                  </span>
                </div>
              </div>

              <p className="lp-panel-desc">{p.desc}</p>

              {/* Action buttons */}
              <div className="lp-panel-actions" onClick={e => e.stopPropagation()}>
                {p.actions.map(a => (
                  <motion.button
                    key={a.label}
                    className={`lp-panel-btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`}
                    style={a.primary ? { background: p.gradient } : { borderColor: p.border, color: p.color }}
                    onClick={() => navigate(a.to)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {a.icon} {a.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">SMS Pro</div>
        <p>Sambhram Institute of Technology · VTU Affiliated · Built with ❤️</p>
        <p className="lp-footer-tech">React · Spring Boot · MongoDB · Supabase · Firebase</p>
      </footer>
    </div>
  );
}
