import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiUserPlus, FiX, FiChevronDown } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useStudents, COURSES, DEPARTMENTS } from '../context/StudentContext';
import AvatarBadge from '../components/AvatarBadge';
import './Students.css';

export default function Students() {
  const { students, deleteStudent } = useStudents();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.fullName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchCourse = !filterCourse || s.course === filterCourse;
      const matchDept = !filterDept || s.department === filterDept;
      return matchSearch && matchCourse && matchDept;
    });
  }, [students, search, filterCourse, filterDept]);

  const handleDelete = (id) => {
    deleteStudent(id);
    toast.success('Student removed successfully!', { icon: '🗑️' });
    setDeleteConfirm(null);
  };

  const activeFilters = [filterCourse, filterDept].filter(Boolean).length;

  return (
    <div className="students-page">
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="students-container">
        {/* Header */}
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="page-title">
              <span className="title-gradient">Student</span> Directory
            </h1>
            <p className="page-sub">{filtered.length} of {students.length} students</p>
          </div>
          <Link to="/add" className="gradient-btn">
            <FiUserPlus style={{ marginRight: 8 }} /> Add Student
          </Link>
        </motion.div>

        {/* Search & Filter bar */}
        <motion.div
          className="search-bar-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}><FiX /></button>
            )}
          </div>

          <button
            className={`filter-btn ${showFilters || activeFilters > 0 ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filters
            {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
            <FiChevronDown style={{ transform: showFilters ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }} />
          </button>

          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              Grid
            </button>
            <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
              Table
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filters-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="filter-row">
                <div className="filter-group">
                  <label>Course</label>
                  <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                    <option value="">All Courses</option>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Department</label>
                  <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {activeFilters > 0 && (
                  <button className="clear-filters" onClick={() => { setFilterCourse(''); setFilterDept(''); }}>
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <motion.div className="students-grid" layout>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="empty-icon">👤</div>
                  <h3>No students found</h3>
                  <p>Try adjusting your search or filters</p>
                </motion.div>
              ) : (
                filtered.map((s, i) => (
                  <motion.div
                    key={s.id}
                    className="student-card"
                    layout
                    initial={{ opacity: 0, scale: 0.85, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                  >
                    <div className="card-glow" />
                    <div className="student-card-top">
                      <AvatarBadge name={s.fullName} avatarIndex={s.avatar} size={54} />
                      <div className="student-id-badge">{s.id}</div>
                    </div>
                    <h3 className="student-card-name">{s.fullName}</h3>
                    <p className="student-card-course">{s.course}</p>
                    <div className="student-card-tags">
                      <span className="tag tag-dept">{s.department}</span>
                      {s.gpa && (
                        <span
                          className="tag tag-gpa"
                          style={{ color: s.gpa >= 8.5 ? '#39ff14' : s.gpa >= 7.0 ? '#ffe600' : '#ff6b35' }}
                        >
                          GPA {s.gpa}
                        </span>
                      )}
                    </div>
                    <div className="student-card-info">
                      <span>{s.email}</span>
                      <span>{s.phone}</span>
                    </div>
                    <div className="student-card-actions">
                      <button
                        className="action-btn view"
                        onClick={() => navigate(`/student/${s.id}`)}
                        title="View profile"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => navigate(`/edit/${s.id}`)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteConfirm(s.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <motion.div
            className="table-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Course</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>GPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td>
                        <div className="table-student">
                          <AvatarBadge name={s.fullName} avatarIndex={s.avatar} size={36} />
                          <span>{s.fullName}</span>
                        </div>
                      </td>
                      <td><span className="table-id">{s.id}</span></td>
                      <td>{s.course}</td>
                      <td>{s.department}</td>
                      <td className="table-email">{s.email}</td>
                      <td>{s.phone}</td>
                      <td>
                        <span style={{
                          color: s.gpa >= 8.5 ? '#39ff14' : s.gpa >= 7.0 ? '#ffe600' : '#ff6b35',
                          fontWeight: 700,
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: 13,
                        }}>
                          {s.gpa || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn view" onClick={() => navigate(`/student/${s.id}`)}><FiEye /></button>
                          <button className="action-btn edit" onClick={() => navigate(`/edit/${s.id}`)}><FiEdit2 /></button>
                          <button className="action-btn delete" onClick={() => setDeleteConfirm(s.id)}><FiTrash2 /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-icon">🗑️</div>
              <h3>Delete Student</h3>
              <p>Are you sure you want to remove this student? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="gradient-btn danger" onClick={() => handleDelete(deleteConfirm)}>
                  Yes, Delete
                </button>
                <button className="outline-btn-modal" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
