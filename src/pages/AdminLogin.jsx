import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiArrowLeft, FiSun, FiMoon, FiUserPlus } from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { loginAdmin } from '../services/portalApi';
import { useTheme } from '../context/ThemeContext';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const { loginAdmin: setAdminSession } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try {
      const res = await loginAdmin(email, password);
      if (res?.success) {
        setAdminSession(res.admin);
        navigate('/');
      } else {
        setError(res?.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Server error. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Header */}
        <div className="alc-header">
          <button className="alc-back" onClick={() => navigate('/')}>
            <FiArrowLeft /> Back
          </button>
          <motion.button className="alc-theme" onClick={toggleTheme} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <AnimatePresence mode="wait">
              {theme === 'dark'
                ? <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><FiSun /></motion.span>
                : <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><FiMoon /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Icon */}
        <div className="alc-icon">
          <FiShield />
        </div>
        <h1 className="alc-title">Admin Login</h1>
        <p className="alc-sub">Sign in to access the admin panel</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="alc-form">
          <div className="alc-field">
            <FiMail className="alc-field-icon" />
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="alc-input"
              autoComplete="email"
            />
          </div>

          <div className="alc-field">
            <FiLock className="alc-field-icon" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="alc-input"
            />
            <button type="button" className="alc-eye" onClick={() => setShowPw(!showPw)}>
              {showPw ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {error && <div className="alc-error">⚠️ {error}</div>}

          <motion.button
            type="submit"
            className="alc-submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        <p className="alc-register-link">
          No admin account?{' '}
          <Link to="/admin-register"><FiUserPlus /> Register here</Link>
        </p>
      </div>
    </div>
  );
}
