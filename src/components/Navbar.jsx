import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiUsers, FiUserPlus, FiBarChart2, FiMenu, FiX, FiZap, FiLogIn, FiDatabase, FiEdit, FiSun, FiMoon } from 'react-icons/fi';
import { useStudents } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const links = [
  { to: '/',          label: 'Dashboard',   icon: FiHome },
  { to: '/students',  label: 'Students',    icon: FiUsers },
  { to: '/add',       label: 'Add Student', icon: FiUserPlus },
  { to: '/analytics', label: 'Analytics',   icon: FiBarChart2 },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const location   = useLocation();
  const { backendUp, loading } = useStudents();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <NavLink to="/" className="navbar-logo">
        <motion.div
          className="logo-icon"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <FiZap />
        </motion.div>
        <span className="logo-text">
          <span className="logo-sms">SMS</span>
          <span className="logo-sub">Pro</span>
        </span>
      </NavLink>

      <div className="navbar-links">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* DB status indicator */}
      <div className={`db-status ${loading ? 'checking' : backendUp ? 'online' : 'offline'}`}>
        <FiDatabase />
        <span>
          {loading ? 'Connecting...' : backendUp ? 'MongoDB Live' : 'Local Mode'}
        </span>
        <div className="db-dot" />
      </div>

      {/* Theme toggle */}
      <motion.button
        className="theme-toggle"
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="theme-icon"
            >
              <FiSun />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="theme-icon"
            >
              <FiMoon />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </motion.button>

      <NavLink to="/student-register" className="student-register-btn">
        <FiEdit /> Register
      </NavLink>

      <NavLink to="/student-login" className="student-portal-btn">
        <FiLogIn /> Student Login
      </NavLink>

      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
            <button className="mobile-theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
