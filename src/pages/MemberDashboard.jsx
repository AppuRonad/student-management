import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUsers, FiLogOut, FiSearch, FiPlus, FiEdit2,
  FiTrash2, FiBarChart2, FiUser, FiSun, FiMoon, FiCalendar, FiEye,
} from 'react-icons/fi';
import { useMemberAuth } from '../context/MemberAuthContext';
import { getStudentsByDepartment } from '../services/portalApi';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import AttendanceModal from '../components/AttendanceModal';
import { AnimatePresence } from 'framer-motion';
import './MemberDashboard.css';

export default function MemberDashboard() {
  const { member, logoutMember } = useMemberAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [attendanceStudent, setAttendanceStudent] = useState(null); // { id, fullName } or null

  const perms = member?.permissions || {};

  // Redirect if not logged in
  useEffect(() => {
    if (!member) { navigate('/member-login'); return; }
    if (!perms.viewStudents) return; // will show blocked state
    loadStudents();
  }, [member]);

  const loadStudents = async () => {
    if (!member?.department) return;
    setLoading(true);
    try {
      const data = await getStudentsByDepartment(member.department);
      setStudents(data || []);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const avgGpa = students.length
    ? (students.filter(s => s.gpa).reduce((a, s) => a + s.gpa, 0) /
       students.filter(s => s.gpa).length).toFixed(2)
    : '—';

  const topGpa = students.reduce((best, s) =>
    (!best || (s.gpa || 0) > (best.gpa || 0)) ? s : best, null);

  const handleLogout = () => { logoutMember(); navigate('/'); };

  return (
    <div className="member-page">
      {/* Top bar */}
      <div className="member-topbar">
        <div className="member-brand">
          <div className="member-brand-icon"><FiUsers /></div>
          <div>
            <div className="member-brand-name">SMS Pro</div>
            <div className="member-brand-role">Member — {member?.department}</div>
          </div>
        </div>
        <div className="member-topbar-actions">
          <motion.button className="mb-icon-btn" onClick={toggleTheme} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </motion.button>
          <motion.button
            className="member-view-members-btn"
            onClick={() => navigate('/member/view-members')}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            title="View other members (read-only)"
          >
            <FiEye /> View Members
          </motion.button>
          <div className="member-profile">
            <div className="member-avatar">{member?.fullName?.[0]?.toUpperCase()}</div>
            <span>{member?.fullName}</span>
          </div>
          <motion.button className="member-logout-btn" onClick={handleLogout} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <FiLogOut /> Logout
          </motion.button>
        </div>
      </div>

      <div className="member-body">
        {/* Stats */}
        <div className="member-stats">
          <motion.div className="mstat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <FiUsers className="mstat-icon" style={{ color: '#b44fff' }} />
            <div className="mstat-val">{students.length}</div>
            <div className="mstat-label">Total Students</div>
          </motion.div>
          <motion.div className="mstat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <FiBarChart2 className="mstat-icon" style={{ color: '#00f5ff' }} />
            <div className="mstat-val">{avgGpa}</div>
            <div className="mstat-label">Avg GPA</div>
          </motion.div>
          <motion.div className="mstat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <FiUser className="mstat-icon" style={{ color: '#39ff14' }} />
            <div className="mstat-val">{topGpa?.gpa ?? '—'}</div>
            <div className="mstat-label">Top GPA</div>
          </motion.div>
          <motion.div className="mstat-card dept-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <FiUsers className="mstat-icon" style={{ color: '#ffe600' }} />
            <div className="mstat-val" style={{ fontSize: 16 }}>{member?.department}</div>
            <div className="mstat-label">Your Department</div>
          </motion.div>
        </div>

        {/* Permission warning if viewStudents is off */}
        {!perms.viewStudents && (
          <div style={{ background: 'rgba(255,230,0,0.08)', border: '1px solid rgba(255,230,0,0.2)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, color: '#ffe600', fontSize: 14, textAlign: 'center' }}>
            ⚠️ You don't have permission to view students. Contact your admin to enable access.
          </div>
        )}

        {/* Students table */}
        <div className="member-section">
          <div className="ms-header">
            <div>
              <h2 className="ms-title">Department Students</h2>
              <p className="ms-sub">{member?.department} — {students.length} student{students.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="ms-actions">
            <div className="ms-search">
            <FiSearch />
            <input
            placeholder="Search students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            />
            </div>
            {perms.addStudents && (
            <motion.button
            className="ms-add-btn"
            onClick={() => navigate('/add')}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              <FiPlus /> Add Student
                </motion.button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="ms-loading">Loading students…</div>
          ) : filtered.length === 0 ? (
            <div className="ms-empty">
              <FiUsers />
              <p>{search ? 'No students match your search' : `No students in ${member?.department} yet`}</p>
            </div>
          ) : (
            <div className="ms-table-wrap">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Course</th>
                    <th>GPA</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td>
                        <div className="ms-student-cell">
                          <div className="ms-stu-avatar">{s.fullName?.[0]}</div>
                          <div>
                            <div className="ms-stu-name">{s.fullName}</div>
                            <div className="ms-stu-email">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="ms-id">{s.id}</td>
                      <td>{s.course}</td>
                      <td>
                        <span className={`ms-gpa ${s.gpa >= 8 ? 'gpa-high' : s.gpa >= 6 ? 'gpa-mid' : 'gpa-low'}`}>
                          {s.gpa ?? '—'}
                        </span>
                      </td>
                      <td>
                        <div className="ms-row-actions">
                          {perms.viewStudents && (
                            <button className="ms-act-btn view" onClick={() => navigate(`/student/${s.id}`)}>
                              <FiUser />
                            </button>
                          )}
                          {perms.editStudents && (
                            <button className="ms-act-btn edit" onClick={() => navigate(`/edit/${s.id}`)}>
                              <FiEdit2 />
                            </button>
                          )}
                          {perms.addAttendance && (
                            <button
                              className="ms-act-btn attendance"
                              onClick={() => setAttendanceStudent({ id: s.id, fullName: s.fullName })}
                              title="Add attendance"
                            >
                              <FiCalendar />
                            </button>
                          )}
                          {!perms.viewStudents && !perms.editStudents && !perms.addAttendance && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No access</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Attendance Modal */}
      <AnimatePresence>
        {attendanceStudent && (
          <AttendanceModal
            student={attendanceStudent}
            onClose={() => setAttendanceStudent(null)}
            onSaved={loadStudents}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
