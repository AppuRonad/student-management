import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiMail, FiPhone, FiBook, FiCalendar,
  FiLock, FiEye, FiEyeOff, FiCheck, FiArrowRight,
  FiZap, FiArrowLeft, FiCheckCircle,
} from 'react-icons/fi';
import { useStudents, COURSES, DEPARTMENTS } from '../context/StudentContext';
import { registerStudent } from '../services/portalApi';
import AvatarBadge from '../components/AvatarBadge';
import './StudentRegister.css';

// ── Password strength checker ────────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: '',         color: '' },
    { score: 1, label: 'Weak',     color: '#ff2d78' },
    { score: 2, label: 'Fair',     color: '#ff6b35' },
    { score: 3, label: 'Good',     color: '#ffe600' },
    { score: 4, label: 'Strong',   color: '#39ff14' },
  ];
  return levels[score];
}

// ── Floating label input ─────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, rightEl, ...props }) {
  const [focused, setFocused] = useState(false);
  const hasVal = String(props.value || '').length > 0;
  return (
    <div className={`reg-field ${focused ? 'focused' : ''} ${error ? 'error' : ''} ${hasVal ? 'has-val' : ''}`}>
      <div className="rf-icon"><Icon /></div>
      {props.as === 'select' ? (
        <select
          className="rf-input"
          value={props.value}
          onChange={props.onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {props.children}
        </select>
      ) : (
        <input
          {...props}
          as={undefined}
          className="rf-input"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
      <label className="rf-label">{label}</label>
      {rightEl && <div className="rf-right">{rightEl}</div>}
      <div className="rf-glow-line" />
      {error && <span className="rf-error">{error}</span>}
    </div>
  );
}

// ── Steps config ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Personal Info',  icon: FiUser },
  { id: 2, label: 'Academic Info',  icon: FiBook },
  { id: 3, label: 'Set Password',   icon: FiLock },
];

export default function StudentRegister() {
  const { addStudent } = useStudents();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(1);
  const [done,    setDone]    = useState(false);
  const [savedId, setSavedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', dob: '',
    course: '', department: '', gpa: '',
    password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  // ── Validation per step ───────────────────────────────────────────────────
  const validate = (s = step) => {
    const e = {};
    if (s === 1) {
      if (!form.fullName.trim())           e.fullName = 'Full name is required';
      else if (form.fullName.trim().length < 3) e.fullName = 'At least 3 characters';
      if (!form.email.trim())              e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
      if (!form.phone.trim())              e.phone = 'Phone is required';
      else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = '10-digit number required';
      if (!form.dob)                       e.dob = 'Date of birth is required';
    }
    if (s === 2) {
      if (!form.course)     e.course     = 'Select a course';
      if (!form.department) e.department = 'Select a department';
    }
    if (s === 3) {
      if (!form.password)               e.password = 'Password is required';
      else if (form.password.length < 6) e.password = 'Minimum 6 characters';
      if (!form.confirmPassword)         e.confirmPassword = 'Please confirm your password';
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s => s + 1);
  };

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const e3 = validate(3);
    if (Object.keys(e3).length) { setErrors(e3); return; }

    setLoading(true);
    try {
      // 1. Save student record to MongoDB via Spring Boot
      const saved = await addStudent({
        fullName:   form.fullName.trim(),
        email:      form.email.trim(),
        phone:      form.phone.trim(),
        dob:        form.dob,
        course:     form.course,
        department: form.department,
        gpa:        form.gpa ? parseFloat(form.gpa) : null,
      });

      const studentId = saved?.id;
      if (!studentId) throw new Error('No student ID returned');

      // 2. Register credentials in backend (BCrypt hashed)
      const authResult = await registerStudent(studentId, form.password);
      if (!authResult?.success) {
        throw new Error(authResult?.message || 'Auth registration failed');
      }

      setSavedId(studentId);
      setDone(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Registration failed. Email may already be in use.' });
    }
    setLoading(false);
  };

  // Preview initials
  const initials = form.fullName
    ? form.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const pwStrength = getPasswordStrength(form.password);

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="reg-page">
        <div className="reg-bg">
          <div className="reg-orb ro1" /><div className="reg-orb ro2" /><div className="reg-orb ro3" />
        </div>
        <motion.div
          className="reg-success"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <motion.div
            className="reg-success-icon"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            🎉
          </motion.div>
          <h2>Welcome to SMS Pro!</h2>
          <p>Your account has been created successfully.</p>

          <div className="reg-id-reveal">
            <span className="rid-label">Your Student ID</span>
            <span className="rid-value">{savedId}</span>
            <span className="rid-note">⚠️ Save this! You need it to login.</span>
          </div>

          <div className="reg-success-creds">
            <div className="rsc-row">
              <span>Student ID</span>
              <strong>{savedId}</strong>
            </div>
            <div className="rsc-row">
              <span>Password</span>
              <strong>{'•'.repeat(form.password.length)}</strong>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link to="/student-login" className="reg-login-btn">
              Go to Login <FiArrowRight />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Main registration form ────────────────────────────────────────────────
  return (
    <div className="reg-page">
      <div className="reg-bg">
        <div className="reg-orb ro1" /><div className="reg-orb ro2" /><div className="reg-orb ro3" />
        <div className="reg-grid" />
      </div>

      <div className="reg-layout">
        {/* Left panel */}
        <motion.div
          className="reg-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Link to="/student-login" className="reg-brand">
            <motion.div
              className="reg-brand-icon"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <FiZap />
            </motion.div>
            <span>SMS <span style={{ color: 'var(--neon-cyan)' }}>Pro</span></span>
          </Link>

          <div className="reg-hero-text">
            <h1>
              Join SMS Pro
              <br />
              <span className="reg-gradient-text">Create Your Account</span>
            </h1>
            <p>
              Register once and get access to your full academic profile —
              GPA tracker, competition records, certifications and more.
            </p>
          </div>

          {/* Live preview card */}
          <motion.div
            className="reg-preview-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="rpc-header">
              <AvatarBadge
                name={form.fullName || 'Your Name'}
                avatarIndex={3}
                size={52}
              />
              <div>
                <div className="rpc-name">{form.fullName || 'Your Name'}</div>
                <div className="rpc-course">{form.course || 'Course not selected'}</div>
              </div>
            </div>
            <div className="rpc-fields">
              {[
                { label: 'Email',      value: form.email      },
                { label: 'Phone',      value: form.phone      },
                { label: 'Department', value: form.department },
              ].map(({ label, value }) => (
                <div key={label} className="rpc-row">
                  <span>{label}</span>
                  <span>{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="rpc-step-label">Step {step} of 3 — {STEPS[step - 1].label}</div>
          </motion.div>
        </motion.div>

        {/* Right panel — form */}
        <motion.div
          className="reg-right"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="reg-card">
            {/* Step indicator */}
            <div className="reg-steps">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`reg-step ${step >= s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
                  <div className="rs-circle">
                    {step > s.id ? <FiCheck /> : <s.icon />}
                  </div>
                  <span>{s.label}</span>
                  {i < STEPS.length - 1 && (
                    <div className={`rs-line ${step > s.id ? 'active' : ''}`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">

                {/* ── STEP 1: Personal Info ── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    className="reg-step-content"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="reg-step-title">
                      <FiUser /> Personal Information
                    </div>

                    <Field
                      label="Full Name"
                      icon={FiUser}
                      type="text"
                      placeholder=" "
                      value={form.fullName}
                      onChange={e => set('fullName', e.target.value)}
                      error={errors.fullName}
                    />
                    <Field
                      label="Email Address"
                      icon={FiMail}
                      type="email"
                      placeholder=" "
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      error={errors.email}
                    />
                    <Field
                      label="Phone Number (10 digits)"
                      icon={FiPhone}
                      type="tel"
                      placeholder=" "
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      error={errors.phone}
                    />
                    <Field
                      label="Date of Birth"
                      icon={FiCalendar}
                      type="date"
                      value={form.dob}
                      onChange={e => set('dob', e.target.value)}
                      error={errors.dob}
                    />
                  </motion.div>
                )}

                {/* ── STEP 2: Academic Info ── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    className="reg-step-content"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="reg-step-title">
                      <FiBook /> Academic Information
                    </div>

                    <Field
                      label="Course"
                      icon={FiBook}
                      as="select"
                      value={form.course}
                      onChange={e => set('course', e.target.value)}
                      error={errors.course}
                    >
                      <option value="">Select your course</option>
                      {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </Field>

                    <Field
                      label="Department"
                      icon={FiBook}
                      as="select"
                      value={form.department}
                      onChange={e => set('department', e.target.value)}
                      error={errors.department}
                    >
                      <option value="">Select your department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </Field>

                    <Field
                      label="Current GPA (optional, 0–10)"
                      icon={FiCheck}
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder=" "
                      value={form.gpa}
                      onChange={e => set('gpa', e.target.value)}
                      error={errors.gpa}
                    />
                  </motion.div>
                )}

                {/* ── STEP 3: Set Password ── */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    className="reg-step-content"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="reg-step-title">
                      <FiLock /> Create Your Password
                    </div>

                    <Field
                      label="Password"
                      icon={FiLock}
                      type={showPw ? 'text' : 'password'}
                      placeholder=" "
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      error={errors.password}
                      rightEl={
                        <button type="button" onClick={() => setShowPw(!showPw)}>
                          {showPw ? <FiEyeOff /> : <FiEye />}
                        </button>
                      }
                    />

                    {/* Password strength bar */}
                    {form.password && (
                      <motion.div
                        className="pw-strength"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <div className="pw-strength-bar">
                          {[1, 2, 3, 4].map(n => (
                            <div
                              key={n}
                              className="pw-bar-seg"
                              style={{
                                background: n <= pwStrength.score
                                  ? pwStrength.color
                                  : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ color: pwStrength.color }}>
                          {pwStrength.label}
                        </span>
                      </motion.div>
                    )}

                    <div className="pw-rules">
                      {[
                        { label: 'At least 6 characters', ok: form.password.length >= 6 },
                        { label: 'One uppercase letter',  ok: /[A-Z]/.test(form.password) },
                        { label: 'One number',            ok: /[0-9]/.test(form.password) },
                        { label: 'One special character', ok: /[^A-Za-z0-9]/.test(form.password) },
                      ].map(({ label, ok }) => (
                        <div key={label} className={`pw-rule ${ok ? 'met' : ''}`}>
                          <FiCheck /> {label}
                        </div>
                      ))}
                    </div>

                    <Field
                      label="Confirm Password"
                      icon={FiLock}
                      type={showCpw ? 'text' : 'password'}
                      placeholder=" "
                      value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      error={errors.confirmPassword}
                      rightEl={
                        <button type="button" onClick={() => setShowCpw(!showCpw)}>
                          {showCpw ? <FiEyeOff /> : <FiEye />}
                        </button>
                      }
                    />

                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <motion.div
                        className="pw-match"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <FiCheckCircle /> Passwords match!
                      </motion.div>
                    )}

                    {errors.submit && (
                      <div className="reg-submit-error">⚠️ {errors.submit}</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="reg-nav">
                {step > 1 && (
                  <button
                    type="button"
                    className="reg-back-btn"
                    onClick={() => setStep(s => s - 1)}
                  >
                    <FiArrowLeft /> Back
                  </button>
                )}

                {step < 3 ? (
                  <motion.button
                    type="button"
                    className="reg-next-btn"
                    onClick={next}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Next <FiArrowRight />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    className="reg-next-btn"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading
                      ? <><div className="reg-spinner" /> Creating account...</>
                      : <><FiCheckCircle /> Create Account</>
                    }
                  </motion.button>
                )}
              </div>
            </form>

            <div className="reg-footer">
              Already have an account?{' '}
              <Link to="/student-login">Sign in here →</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
