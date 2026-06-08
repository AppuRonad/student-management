import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiLock, FiEye, FiEyeOff,
  FiArrowRight, FiZap, FiUserPlus,
} from 'react-icons/fi';
import { usePortalAuth } from '../context/PortalAuthContext';
import { loginStudent as apiLogin } from '../services/portalApi';
import './StudentLogin.css';

export default function StudentLogin() {
  const [studentId, setStudentId] = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [shake,     setShake]     = useState(false);

  const { loginStudent } = usePortalAuth();
  const navigate         = useNavigate();
  const cardRef          = useRef(null);

  // Mouse spotlight effect on the card
  const handleCardMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim() || !password.trim()) {
      setError('Please enter your Student ID and password.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiLogin(studentId.trim(), password);
      if (result?.success) {
        loginStudent(result.student);
        navigate('/portal');
      } else {
        setError(result?.message || 'Login failed. Please try again.');
        triggerShake();
      }
    } catch (err) {
      // Backend offline — show helpful message
      setError('Cannot connect to server. Make sure Spring Boot is running on port 8080.');
      triggerShake();
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-orb lo-1" />
        <div className="login-orb lo-2" />
        <div className="login-orb lo-3" />
        <div className="login-grid" />
      </div>

      {/* Floating particles */}
      <div className="login-particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="lp"
            style={{
              left: `${Math.random() * 100}%`,
              top:  `${Math.random() * 100}%`,
              width:  Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
            }}
            animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <div className="login-layout">
        {/* ── Left panel ── */}
        <motion.div
          className="login-left"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link to="/" className="login-brand">
            <motion.div
              className="login-brand-icon"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <FiZap />
            </motion.div>
            <span>SMS <span style={{ color: 'var(--neon-cyan)' }}>Pro</span></span>
          </Link>

          <div className="login-hero-text">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your Academic
              <br />
              <span className="login-gradient-text">Journey Awaits</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Sign in to access your track records, GPA history,
              competition achievements, and certifications.
            </motion.p>
          </div>

          {/* Feature pills */}
          <motion.div
            className="login-features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { icon: '📊', label: 'Semester GPA Tracker' },
              { icon: '🏆', label: 'Competition Records' },
              { icon: '📜', label: 'Certifications' },
              { icon: '📅', label: 'Attendance Overview' },
              { icon: '🎖️', label: 'Achievements' },
              { icon: '🪪', label: 'Student ID Card' },
            ].map(({ icon, label }, i) => (
              <motion.div
                key={label}
                className="feature-pill"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.07 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <span>{icon}</span> {label}
              </motion.div>
            ))}
          </motion.div>

          {/* Register CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Link to="/student-register" className="login-register-cta">
              <FiUserPlus />
              <div>
                <strong>New student?</strong>
                <span>Create your account here →</span>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Right panel — Login card ── */}
        <motion.div
          className="login-right"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            ref={cardRef}
            className={`login-card ${shake ? 'shake' : ''}`}
            onMouseMove={handleCardMove}
            whileHover={{ scale: 1.005 }}
          >
            <div className="login-card-glow" />

            <div className="login-card-header">
              <div className="login-avatar-icon">🎓</div>
              <h2>Student Portal</h2>
              <p>Sign in with your Student ID and password</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Student ID */}
              <div className="login-field">
                <div className="lf-icon"><FiUser /></div>
                <input
                  type="text"
                  placeholder="Student ID (e.g. STU001)"
                  value={studentId}
                  onChange={e => { setStudentId(e.target.value.toUpperCase()); setError(''); }}
                  className="lf-input"
                  autoComplete="username"
                />
                <div className="lf-border" />
              </div>

              {/* Password */}
              <div className="login-field">
                <div className="lf-icon"><FiLock /></div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="lf-input"
                  autoComplete="current-password"
                />
                <button type="button" className="lf-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
                <div className="lf-border" />
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="login-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="login-btn"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading
                  ? <div className="login-spinner" />
                  : <>Sign In <FiArrowRight /></>
                }
              </motion.button>
            </form>

            {/* Register link */}
            <div className="login-register-link">
              <div className="lrl-divider"><span>Don't have an account?</span></div>
              <Link to="/student-register" className="lrl-btn">
                <FiUserPlus /> Register as a Student
              </Link>
            </div>

            <div className="login-footer-link">
              Admin? <Link to="/">Go to Admin Panel →</Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
