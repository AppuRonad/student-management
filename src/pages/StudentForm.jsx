import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiBook, FiCalendar, FiCheck, FiArrowLeft, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useStudents, COURSES, DEPARTMENTS } from '../context/StudentContext';
import AvatarBadge from '../components/AvatarBadge';
import './StudentForm.css';

const EMPTY = { fullName: '', email: '', phone: '', course: '', department: '', dob: '', gpa: '' };

function FloatingInput({ label, icon: Icon, error, ...props }) {
  const [focused, setFocused] = useState(false);
  const hasValue = String(props.value || '').length > 0;

  return (
    <div className={`floating-field ${focused ? 'focused' : ''} ${error ? 'error' : ''} ${hasValue ? 'has-value' : ''}`}>
      <div className="field-icon"><Icon /></div>
      {props.type === 'select' ? (
        <select
          {...props}
          className="field-input"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {props.options}
        </select>
      ) : (
        <input
          {...props}
          className="field-input"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
      <label className="field-label">{label}</label>
      <div className="field-border-glow" />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { addStudent, updateStudent, getStudent } = useStudents();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const s = getStudent(id);
      if (s) setForm({ fullName: s.fullName, email: s.email, phone: s.phone, course: s.course, department: s.department, dob: s.dob, gpa: s.gpa || '' });
    }
  }, [id, isEdit, getStudent]);

  const validate = (data = form, checkStep = step) => {
    const e = {};
    if (checkStep >= 1) {
      if (!data.fullName.trim()) e.fullName = 'Full name is required';
      else if (data.fullName.trim().length < 3) e.fullName = 'Name must be at least 3 characters';
      if (!data.email.trim()) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Invalid email address';
      if (!data.phone.trim()) e.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) e.phone = 'Enter a valid 10-digit number';
    }
    if (checkStep >= 2) {
      if (!data.course) e.course = 'Please select a course';
      if (!data.department) e.department = 'Please select a department';
      if (!data.dob) e.dob = 'Date of birth is required';
    }
    return e;
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const nextStep = () => {
    const e = validate(form, step);
    const stepErrors = step === 1
      ? Object.fromEntries(Object.entries(e).filter(([k]) => ['fullName','email','phone'].includes(k)))
      : Object.fromEntries(Object.entries(e).filter(([k]) => ['course','department','dob'].includes(k)));
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allErrors = validate(form, 2);
    if (Object.keys(allErrors).length > 0) { setErrors(allErrors); return; }

    if (isEdit) {
      updateStudent(id, form);
      toast.success('Student updated successfully! ✨');
    } else {
      addStudent(form);
      toast.success('Student registered successfully! 🎉');
    }
    setSubmitted(true);
    setTimeout(() => navigate('/students'), 2000);
  };

  if (submitted) {
    return (
      <div className="form-page">
        <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
        <motion.div
          className="success-screen"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <motion.div
            className="success-icon"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <FiCheck />
          </motion.div>
          <h2>{isEdit ? 'Updated!' : 'Registered!'}</h2>
          <p>Redirecting to students list...</p>
          <div className="success-dots">
            {[0,1,2].map(i => (
              <motion.div
                key={i}
                className="dot"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="form-container">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>

          <div className="form-header">
            <h1 className="form-title">
              {isEdit ? '✏️ Edit Student' : '🎓 Register Student'}
            </h1>
            <p className="form-sub">
              {isEdit ? 'Update the student information below' : 'Fill in the details to add a new student'}
            </p>
          </div>

          {/* Step indicator */}
          {!isEdit && (
            <div className="step-indicator">
              {[1, 2].map(s => (
                <div key={s} className={`step-item ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
                  <div className="step-circle">
                    {step > s ? <FiCheck /> : s}
                  </div>
                  <span>{s === 1 ? 'Personal Info' : 'Academic Info'}</span>
                </div>
              ))}
              <div className={`step-line ${step > 1 ? 'active' : ''}`} />
            </div>
          )}
        </motion.div>

        <div className="form-layout">
          {/* Preview */}
          <motion.div
            className="form-preview glass-card"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="preview-avatar">
              <AvatarBadge name={form.fullName || 'New Student'} avatarIndex={3} size={80} />
              <div className="preview-pulse" />
            </div>
            <h3 className="preview-name">{form.fullName || 'Student Name'}</h3>
            <p className="preview-course">{form.course || 'Course not set'}</p>

            <div className="preview-fields">
              {[
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone },
                { label: 'Department', value: form.department },
                { label: 'Date of Birth', value: form.dob },
              ].map(({ label, value }) => (
                <div key={label} className="preview-row">
                  <span className="preview-label">{label}</span>
                  <span className="preview-value">{value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="preview-decoration">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="preview-orb"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="form-fields glass-card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {(step === 1 || isEdit) && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="fields-group"
                >
                  <div className="fields-heading">Personal Information</div>

                  <FloatingInput
                    label="Full Name"
                    icon={FiUser}
                    type="text"
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    error={errors.fullName}
                    placeholder=" "
                  />
                  <FloatingInput
                    label="Email Address"
                    icon={FiMail}
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    error={errors.email}
                    placeholder=" "
                  />
                  <FloatingInput
                    label="Phone Number"
                    icon={FiPhone}
                    type="tel"
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder=" "
                  />
                </motion.div>
              )}

              {(step === 2 || isEdit) && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: isEdit ? 0 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="fields-group"
                >
                  {isEdit && <div className="fields-heading" style={{ marginTop: 24 }}>Academic Information</div>}
                  {!isEdit && <div className="fields-heading">Academic Information</div>}

                  <div className="floating-field has-value">
                    <div className="field-icon"><FiBook /></div>
                    <select
                      className="field-input"
                      value={form.course}
                      onChange={e => handleChange('course', e.target.value)}
                    >
                      <option value="">Select Course</option>
                      {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <label className="field-label">Course</label>
                    {errors.course && <span className="field-error">{errors.course}</span>}
                  </div>

                  <div className="floating-field has-value">
                    <div className="field-icon"><FiBook /></div>
                    <select
                      className="field-input"
                      value={form.department}
                      onChange={e => handleChange('department', e.target.value)}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <label className="field-label">Department</label>
                    {errors.department && <span className="field-error">{errors.department}</span>}
                  </div>

                  <FloatingInput
                    label="Date of Birth"
                    icon={FiCalendar}
                    type="date"
                    value={form.dob}
                    onChange={e => handleChange('dob', e.target.value)}
                    error={errors.dob}
                  />

                  <FloatingInput
                    label="GPA (optional, 0–10)"
                    icon={FiCheck}
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={form.gpa}
                    onChange={e => handleChange('gpa', e.target.value)}
                    error={errors.gpa}
                    placeholder=" "
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-footer">
              {!isEdit && step === 2 && (
                <button type="button" className="outline-btn-modal" onClick={() => setStep(1)}>
                  ← Back
                </button>
              )}
              {!isEdit && step === 1 ? (
                <button type="button" className="gradient-btn" onClick={nextStep}>
                  Next Step →
                </button>
              ) : (
                <motion.button
                  type="submit"
                  className="gradient-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiSave style={{ marginRight: 8 }} />
                  {isEdit ? 'Save Changes' : 'Register Student'}
                </motion.button>
              )}
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
