import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  FiShield, FiUser, FiUsers, FiLogIn, FiUserPlus,
  FiSun, FiMoon, FiZap,
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

const PANELS = [
  {
    id: 'admin',
    icon: <FiShield />,
    title: 'Admin',
    subtitle: 'Full system access',
    desc: 'Manage all students, departments, members and permissions across the entire system.',
    color: '#b44fff',
    gradient: 'linear-gradient(135deg, #b44fff 0%, #7b2fff 100%)',
    glow: 'rgba(180,79,255,0.35)',
    actions: [
      { label: 'Login / Register', icon: <FiLogIn />, to: '/admin-login', primary: true },
    ],
  },
  {
    id: 'member',
    icon: <FiUsers />,
    title: 'Member',
    subtitle: 'Department-level access',
    desc: 'Manage your department students with permissions granted by the admin.',
    color: '#ffe600',
    gradient: 'linear-gradient(135deg, #ffe600 0%, #ff6b35 100%)',
    glow: 'rgba(255,230,0,0.3)',
    actions: [
      { label: 'Login',    icon: <FiLogIn />,    to: '/member-login',    primary: true  },
      { label: 'Register', icon: <FiUserPlus />, to: '/member-register', primary: false },
    ],
  },
  {
    id: 'student',
    icon: <FiUser />,
    title: 'Student',
    subtitle: 'Personal academic access',
    desc: 'View your GPA, track records, certifications and competition achievements.',
    color: '#00f5ff',
    gradient: 'linear-gradient(135deg, #00f5ff 0%, #39ff14 100%)',
    glow: 'rgba(0,245,255,0.3)',
    actions: [
      { label: 'Login',    icon: <FiLogIn />,    to: '/student-login',    primary: true  },
      { label: 'Register', icon: <FiUserPlus />, to: '/student-register', primary: false },
    ],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(null);

  return (
    <div className="lp-root">

      {/* Theme toggle */}
      <motion.button
        className="lp-theme-btn"
        onClick={toggleTheme}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait">
          {theme === 'dark'
            ? <motion.span key="sun"  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><FiSun /></motion.span>
            : <motion.span key="moon" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><FiMoon /></motion.span>
          }
        </AnimatePresence>
      </motion.button>

      {/* Brand */}
      <motion.div
        className="lp-brand"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="lp-brand-icon"><FiZap /></div>
        <span className="lp-brand-name">SMS <em>Pro</em></span>
      </motion.div>

      {/* Headline */}
      <motion.div
        className="lp-headline-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <h1 className="lp-headline">Student Management System</h1>
        <p className="lp-tagline">
          Sambhram Institute of Technology · VTU Affiliated
        </p>
      </motion.div>

      {/* Role cards */}
      <div className="lp-cards">
        {PANELS.map((p, i) => (
          <motion.div
            key={p.id}
            className={`lp-card ${hovered === p.id ? 'hovered' : ''}`}
            style={{
              '--card-glow': p.glow,
              '--card-border': p.color + '55',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.1, duration: 0.5, type: 'spring', stiffness: 260, damping: 22 }}
            onHoverStart={() => setHovered(p.id)}
            onHoverEnd={() => setHovered(null)}
            whileHover={{ y: -8, scale: 1.015 }}
          >
            {/* Card glow */}
            <div className="lp-card-glow" style={{ background: p.glow }} />

            {/* Icon */}
            <div className="lp-card-icon" style={{ background: p.gradient }}>
              {p.icon}
            </div>

            {/* Info */}
            <div className="lp-card-info">
              <div className="lp-card-title">{p.title}</div>
              <div className="lp-card-subtitle" style={{ color: p.color }}>{p.subtitle}</div>
              <p className="lp-card-desc">{p.desc}</p>
            </div>

            {/* Actions */}
            <div className="lp-card-actions">
              {p.actions.map(a => (
                <motion.button
                  key={a.label}
                  className={`lp-card-btn ${a.primary ? 'primary' : 'secondary'}`}
                  style={
                    a.primary
                      ? { background: p.gradient }
                      : { border: `1.5px solid ${p.color}`, color: p.color }
                  }
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

      {/* Footer note */}
      <motion.p
        className="lp-footer-note"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        🔒 All data encrypted · Built with React + Spring Boot + MongoDB
      </motion.p>
    </div>
  );
}
