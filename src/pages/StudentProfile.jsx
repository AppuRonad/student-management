import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit2, FiTrash2, FiMail, FiPhone, FiBook, FiCalendar, FiAward, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStudents } from '../context/StudentContext';
import AvatarBadge from '../components/AvatarBadge';
import StudentIDCard from '../components/StudentIDCard';
import PhotoUpload from '../components/PhotoUpload';
import MessagingBox from '../components/MessagingBox';
import { getTrackRecord } from '../services/portalApi';
import './StudentProfile.css';

export default function StudentProfile() {
  const { id } = useParams();
  const { getStudent, deleteStudent, updateStudent } = useStudents();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [trackRecords, setTrackRecords] = useState(null);

  const student = getStudent(id);

  useEffect(() => {
    if (student) {
      getTrackRecord(student.id).then(data => setTrackRecords(data || {}));
    }
  }, [student]);

  if (!student) {
    return (
      <div className="profile-page">
        <div className="not-found">
          <div style={{ fontSize: 80 }}>👤</div>
          <h2>Student not found</h2>
          <Link to="/students" className="gradient-btn">← Back to Students</Link>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteStudent(id);
    toast.success('Student deleted');
    navigate('/students');
  };

  const age = student.dob
    ? Math.floor((new Date() - new Date(student.dob)) / (365.25 * 24 * 3600 * 1000))
    : null;

  const gpaColor = !student.gpa ? '#9090b0' : student.gpa >= 8.5 ? '#39ff14' : student.gpa >= 7.0 ? '#ffe600' : '#ff6b35';
  const gpaLabel = !student.gpa ? 'N/A' : student.gpa >= 8.5 ? 'Excellent' : student.gpa >= 7.0 ? 'Good' : 'Average';

  const INFO = [
    { icon: FiMail, label: 'Email', value: student.email },
    { icon: FiPhone, label: 'Phone', value: student.phone },
    { icon: FiBook, label: 'Course', value: student.course },
    { icon: FiUser, label: 'Department', value: student.department },
    { icon: FiCalendar, label: 'Date of Birth', value: student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
    { icon: FiCalendar, label: 'Enrolled On', value: student.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
  ];

  return (
    <div className="profile-page">
      <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>

      <div className="profile-container">
        <motion.button
          className="back-btn"
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FiArrowLeft /> Back
        </motion.button>

        {/* Profile Header */}
        <motion.div
          className="profile-header glass-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="profile-bg-decoration">
            <div className="profile-bg-ring" />
            <div className="profile-bg-ring ring-2" />
          </div>

          <div className="profile-avatar-wrap">
            <AvatarBadge name={student.fullName} avatarIndex={student.avatar} size={100} />
            <div className="profile-online-dot" />
          </div>

          <div className="profile-meta">
            <motion.h1
              className="profile-name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {student.fullName}
            </motion.h1>
            <div className="profile-tags">
              <span className="profile-id">{student.id}</span>
              <span className="profile-course-tag">{student.course}</span>
              <span className="profile-dept-tag">{student.department}</span>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="pstat-value" style={{ color: gpaColor }}>
                {student.gpa || 'N/A'}
              </span>
              <span className="pstat-label">GPA · {gpaLabel}</span>
            </div>
            {age && (
              <div className="profile-stat">
                <span className="pstat-value">{age}</span>
                <span className="pstat-label">Years Old</span>
              </div>
            )}
            <div className="profile-stat">
              <span className="pstat-value" style={{ color: '#00f5ff' }}>
                {student.enrolledDate ? new Date(student.enrolledDate).getFullYear() : '—'}
              </span>
              <span className="pstat-label">Enrolled</span>
            </div>
          </div>

          <div className="profile-actions">
            <Link to={`/edit/${student.id}`} className="gradient-btn">
              <FiEdit2 style={{ marginRight: 8 }} /> Edit Profile
            </Link>
            <StudentIDCard student={student} />
            <button className="gradient-btn danger" onClick={() => setShowDelete(true)}>
              <FiTrash2 style={{ marginRight: 8 }} /> Delete
            </button>
          </div>
        </motion.div>

        {/* Info grid */}
        <motion.div
          className="info-grid"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {INFO.map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              className="info-card glass-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -3, scale: 1.02 }}
            >
              <div className="info-icon"><Icon /></div>
              <div className="info-content">
                <span className="info-label">{label}</span>
                <span className="info-value">{value}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Photo Upload */}
        <motion.div
          className="glass-card"
          style={{ padding: 28 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>📷</span>
            <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700 }}>Profile Photo</h3>
          </div>
          <PhotoUpload
            studentId={student.id}
            currentPhotoUrl={student.photoUrl}
            onUploadComplete={(url) => updateStudent(student.id, { photoUrl: url })}
          />
        </motion.div>

        {/* GPA Bar */}
        {student.gpa && (
          <motion.div
            className="gpa-section glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="gpa-header">
              <FiAward style={{ color: '#ffe600' }} />
              <h3>Academic Performance</h3>
            </div>
            <div className="gpa-bar-wrap">
              <div className="gpa-bar-track">
                <motion.div
                  className="gpa-bar-fill"
                  style={{ background: `linear-gradient(90deg, ${gpaColor}, ${gpaColor}88)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(student.gpa / 10) * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="gpa-value-large" style={{ color: gpaColor }}>
                {student.gpa} / 10
              </span>
            </div>
            <div className="gpa-scale">
              <span>0</span><span>2.5</span><span>5</span><span>7.5</span><span>10</span>
            </div>
          </motion.div>
        )}

        {/* Student Progress / Track Records */}
        {trackRecords && (
          <motion.div
            className="track-records-section glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ padding: 28, marginTop: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <FiAward style={{ color: '#00f5ff', fontSize: 24 }} />
              <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700 }}>Student Progress & Achievements</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <h4 style={{ color: '#b44fff', marginBottom: 12 }}>Certifications</h4>
                {(trackRecords.certifications || []).length > 0 ? (
                  <ul style={{ paddingLeft: 20, color: '#fff' }}>
                    {trackRecords.certifications.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        <strong>{c.name}</strong> ({c.issuer}) - {c.date}
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: '#9090b0' }}>No certifications recorded.</p>}
              </div>

              <div>
                <h4 style={{ color: '#ffe600', marginBottom: 12 }}>Projects</h4>
                {(trackRecords.projects || []).length > 0 ? (
                  <ul style={{ paddingLeft: 20, color: '#fff' }}>
                    {trackRecords.projects.map((p, idx) => (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        <strong>{p.title}</strong> ({p.tech}) - Grade: <span style={{ color: '#39ff14' }}>{p.grade}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: '#9090b0' }}>No projects recorded.</p>}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Admin Messaging Box */}
      {student && <MessagingBox studentId={student.id} currentUserRole="admin" currentUserName="Administrator" />}

      {/* Delete modal */}
      <AnimatePresence>
        {showDelete && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDelete(false)}>
            <motion.div className="modal-box" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} onClick={e => e.stopPropagation()}>
              <div className="modal-icon">⚠️</div>
              <h3>Delete {student.fullName}?</h3>
              <p>This will permanently remove the student record. This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="gradient-btn danger" onClick={handleDelete}>Delete</button>
                <button className="outline-btn-modal" onClick={() => setShowDelete(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
