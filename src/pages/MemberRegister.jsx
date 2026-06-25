import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUsers, FiUser, FiPhone, FiBook, FiArrowLeft, FiSun, FiMoon } from 'react-icons/fi';
import { registerMember } from '../services/portalApi';
import { useTheme } from '../context/ThemeContext';
import './AdminLogin.css';

const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil',
  'Electrical', 'Information Science', 'Biotechnology', 'MBA',
];

export default function MemberRegister() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', department: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.department || !form.password)
      { setError('Please fill all required fields'); return; }
    if (form.password !== form.confirm)
      { setError('Passwords do not match'); return; }
    if (form.password.length < 6)
      { setError('Password must be at least 6 characters'); return; }

    setLoading(true); setError('');
    try {
      const res = await registerMember(form);
      if (res?.success) {
        setSuccess(true);
      } else {
        setError(res?.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ textAlign: 'center' }}>
        <div className="alc-icon" style={{ background: 'linear-gradient(135deg, #39ff14, #00f5ff)', color: '#000' }}>✓</div>
        <h1 className="alc-title">Registration Submitted!</h1>
        <p className="alc-sub" style={{ marginBottom: 24 }}>
          Your request has been sent to the admin.<br />
          You can login once your account is approved.
        </p>
        <motion.button className="alc-submit" onClick={() => navigate('/member-login')} whileHover={{ scale: 1.02 }}>
          Go to Member Login
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="alc-header">
          <button className="alc-back" onClick={() => navigate('/')}><FiArrowLeft /> Back</button>
          <motion.button className="alc-theme" onClick={toggleTheme} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <AnimatePresence mode="wait">
              {theme === 'dark'
                ? <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><FiSun /></motion.span>
                : <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><FiMoon /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="alc-icon" style={{ background: 'linear-gradient(135deg, #ffe600, #ff6b35)', color: '#000' }}><FiUsers /></div>
        <h1 className="alc-title">Register as Member</h1>
        <p className="alc-sub">Admin will review and approve your request</p>

        <form onSubmit={handleSubmit} className="alc-form">
          <div className="alc-field">
            <FiUser className="alc-field-icon" />
            <input className="alc-input" placeholder="Full name *" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div className="alc-field">
            <FiMail className="alc-field-icon" />
            <input className="alc-input" type="email" placeholder="Email *" value={form.email} onChange={set('email')} />
          </div>
          <div className="alc-field">
            <FiPhone className="alc-field-icon" />
            <input className="alc-input" placeholder="Phone" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="alc-field">
            <FiBook className="alc-field-icon" />
            <select className="alc-input" value={form.department} onChange={set('department')} style={{ cursor: 'pointer' }}>
              <option value="">Select Department *</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="alc-field">
            <FiLock className="alc-field-icon" />
            <input className="alc-input" type={showPw ? 'text' : 'password'} placeholder="Password *" value={form.password} onChange={set('password')} />
            <button type="button" className="alc-eye" onClick={() => setShowPw(s => !s)}>
              {showPw ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="alc-field">
            <FiLock className="alc-field-icon" />
            <input className="alc-input" type={showPw ? 'text' : 'password'} placeholder="Confirm password *" value={form.confirm} onChange={set('confirm')} />
          </div>

          {error && <div className="alc-error">⚠️ {error}</div>}

          <motion.button type="submit" className="alc-submit" disabled={loading}
            style={{ background: 'linear-gradient(135deg, #ffe600, #ff6b35)', color: '#000' }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? 'Submitting…' : 'Submit Registration'}
          </motion.button>
        </form>

        <p className="alc-register-link">
          Already approved? <Link to="/member-login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
