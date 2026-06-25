import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiUser, FiArrowLeft, FiSun, FiMoon } from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { registerAdmin } from '../services/portalApi';
import { useTheme } from '../context/ThemeContext';
import './AdminLogin.css';

export default function AdminRegister() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const { loginAdmin: setAdminSession } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password)
      { setError('Please fill all fields'); return; }
    if (form.password !== form.confirm)
      { setError('Passwords do not match'); return; }
    if (form.password.length < 6)
      { setError('Password must be at least 6 characters'); return; }

    setLoading(true); setError('');
    try {
      const res = await registerAdmin(form.fullName, form.email, form.password);
      if (res?.success) {
        setAdminSession(res.admin);
        navigate('/');
      } else {
        setError(res?.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
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

        <div className="alc-icon" style={{ background: 'linear-gradient(135deg, #b44fff, #ff2d78)' }}>
          <FiShield />
        </div>
        <h1 className="alc-title">Create Admin Account</h1>
        <p className="alc-sub">Register to access the admin panel</p>

        <form onSubmit={handleSubmit} className="alc-form">
          <div className="alc-field">
            <FiUser className="alc-field-icon" />
            <input className="alc-input" placeholder="Full name" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div className="alc-field">
            <FiMail className="alc-field-icon" />
            <input className="alc-input" type="email" placeholder="Admin email" value={form.email} onChange={set('email')} />
          </div>
          <div className="alc-field">
            <FiLock className="alc-field-icon" />
            <input className="alc-input" type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={form.password} onChange={set('password')} />
            <button type="button" className="alc-eye" onClick={() => setShowPw(s => !s)}>
              {showPw ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="alc-field">
            <FiLock className="alc-field-icon" />
            <input className="alc-input" type={showPw ? 'text' : 'password'} placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} />
          </div>

          {error && <div className="alc-error">⚠️ {error}</div>}

          <motion.button type="submit" className="alc-submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? 'Creating account…' : 'Create Admin Account'}
          </motion.button>
        </form>

        <p className="alc-register-link">
          Already have an account? <Link to="/admin-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
