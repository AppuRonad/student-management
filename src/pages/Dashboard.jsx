import { useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiUserPlus, FiTrendingUp, FiAward, FiArrowRight, FiStar } from 'react-icons/fi';
import { useStudents, DEPARTMENTS } from '../context/StudentContext';
import { useScrollReveal, useCounter } from '../hooks/useScrollReveal';
import AvatarBadge from '../components/AvatarBadge';
import AnnouncementBoard from '../components/AnnouncementBoard';
import AIChatbot from '../components/AIChatbot';
import './Dashboard.css';

function StatCard({ icon: Icon, label, value, color, delay }) {
  const [ref, visible] = useScrollReveal();
  const count = useCounter(value, 1200, visible);

  return (
    <motion.div
      ref={ref}
      className="stat-card"
      style={{ '--accent': color }}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.04, y: -4 }}
    >
      <div className="stat-icon-wrap">
        <Icon />
        <div className="stat-icon-glow" />
      </div>
      <div className="stat-value">{count}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-shine" />
    </motion.div>
  );
}

function DeptBar({ dept, count, total, index }) {
  const [ref, visible] = useScrollReveal();
  const pct = Math.round((count / total) * 100);

  const COLORS = ['#b44fff', '#00f5ff', '#ff2d78', '#ffe600', '#39ff14', '#ff6b35', '#a855f7'];

  return (
    <motion.div
      ref={ref}
      className="dept-bar-row"
      initial={{ opacity: 0, x: -40 }}
      animate={visible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <span className="dept-name">{dept}</span>
      <div className="dept-bar-track">
        <motion.div
          className="dept-bar-fill"
          style={{ background: COLORS[index % COLORS.length] }}
          initial={{ width: 0 }}
          animate={visible ? { width: `${pct}%` } : {}}
          transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
        />
      </div>
      <span className="dept-count">{count}</span>
    </motion.div>
  );
}

export default function Dashboard() {
  const { students, loading } = useStudents();
  const [heroRef, heroVisible] = useScrollReveal(0.1);

  const stats = useMemo(() => {
    const deptCounts = {};
    DEPARTMENTS.forEach(d => { deptCounts[d] = 0; });
    students.forEach(s => { if (deptCounts[s.department] !== undefined) deptCounts[s.department]++; });

    const recent = [...students]
      .sort((a, b) => new Date(b.enrolledDate) - new Date(a.enrolledDate))
      .slice(0, 5);

    const topGpa = [...students].sort((a, b) => (b.gpa || 0) - (a.gpa || 0)).slice(0, 3);

    return { deptCounts, recent, topGpa };
  }, [students]);

  // Show loading screen while fetching from backend
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 20,
      background: 'var(--bg-dark)',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 50, height: 50, borderRadius: '50%',
          border: '3px solid rgba(180,79,255,0.2)',
          borderTopColor: '#b44fff',
        }}
      />
      <p style={{ color: 'var(--text-secondary)', fontFamily: "'Rajdhani',sans-serif", fontSize: 16 }}>
        Connecting to MongoDB...
      </p>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Animated background orbs */}
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FiStar /> Student Management System
          </motion.div>
          <h1 className="hero-title">
            Manage Students
            <br />
            <span className="hero-title-gradient">Like Never Before</span>
          </h1>
          <p className="hero-desc">
            A next-gen platform to track, manage, and analyze student records with real-time insights.
          </p>
          <div className="hero-actions">
            <Link to="/add" className="gradient-btn">
              <FiUserPlus style={{ marginRight: 8 }} /> Add Student
            </Link>
            <Link to="/students" className="outline-btn">
              View All Students <FiArrowRight style={{ marginLeft: 8 }} />
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        >
          <div className="floating-card fc-1">
            <FiUsers style={{ color: '#00f5ff' }} />
            <span>{students.length} Students</span>
          </div>
          <div className="floating-card fc-2">
            <FiAward style={{ color: '#ffe600' }} />
            <span>Top GPA: {students.length ? Math.max(...students.map(s => s.gpa || 0)) : '—'}</span>
          </div>
          <div className="floating-card fc-3">
            <FiTrendingUp style={{ color: '#39ff14' }} />
            <span>{DEPARTMENTS.length} Depts</span>
          </div>
          <div className="hero-ring" />
          <div className="hero-ring hero-ring-2" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <StatCard icon={FiUsers} label="Total Students" value={students.length} color="#b44fff" delay={0} />
        <StatCard icon={FiAward} label="Departments" value={DEPARTMENTS.length} color="#00f5ff" delay={0.1} />
        <StatCard icon={FiTrendingUp} label="Avg GPA" value={students.length ? parseFloat((students.reduce((a,s)=>a+(s.gpa||0),0)/students.length).toFixed(1))*10 : 0} color="#ff2d78" delay={0.2} />
        <StatCard icon={FiUserPlus} label="This Month" value={students.filter(s => new Date(s.enrolledDate).getMonth() === new Date().getMonth()).length || students.length} color="#ffe600" delay={0.3} />
      </section>

      {/* Content grid */}
      <section className="content-grid">
        {/* Department breakdown */}
        <motion.div
          className="glass-card content-card"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="card-header">
            <h3>Students by Department</h3>
            <span className="card-badge">{DEPARTMENTS.length} depts</span>
          </div>
          <div className="dept-bars">
            {DEPARTMENTS.map((dept, i) => (
              <DeptBar
                key={dept}
                dept={dept}
                count={stats.deptCounts[dept] || 0}
                total={students.length}
                index={i}
              />
            ))}
          </div>
        </motion.div>

        {/* Recent registrations */}
        <motion.div
          className="glass-card content-card"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="card-header">
            <h3>Recent Registrations</h3>
            <Link to="/students" className="view-all-link">View all <FiArrowRight /></Link>
          </div>
          <div className="recent-list">
            {stats.recent.map((s, i) => (
              <motion.div
                key={s.id}
                className="recent-item"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                whileHover={{ x: 4 }}
              >
                <AvatarBadge name={s.fullName} avatarIndex={s.avatar} size={40} />
                <div className="recent-info">
                  <span className="recent-name">{s.fullName}</span>
                  <span className="recent-meta">{s.course} · {s.id}</span>
                </div>
                <div className="recent-gpa" style={{ color: s.gpa >= 8.5 ? '#39ff14' : s.gpa >= 7.0 ? '#ffe600' : '#ff6b35' }}>
                  {s.gpa || 'N/A'}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top performers */}
        <motion.div
          className="glass-card content-card top-card"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="card-header">
            <h3>Top Performers</h3>
            <FiAward style={{ color: '#ffe600' }} />
          </div>
          <div className="top-list">
            {stats.topGpa.map((s, i) => (
              <motion.div
                key={s.id}
                className="top-item"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`rank-badge rank-${i + 1}`}>{i + 1}</div>
                <AvatarBadge name={s.fullName} avatarIndex={s.avatar} size={44} />
                <div className="top-info">
                  <span className="top-name">{s.fullName}</span>
                  <span className="top-course">{s.course}</span>
                </div>
                <div className="top-gpa">
                  <span className="gpa-num">{s.gpa}</span>
                  <span className="gpa-label">GPA</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Announcements */}
      <motion.section
        className="announcements-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <AnnouncementBoard isAdmin={true} />
      </motion.section>

      {/* CTA Banner */}
      <motion.section
        className="cta-banner"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <div className="cta-content">
          <h2>Ready to add a new student?</h2>
          <p>Fill in the details and get them registered in seconds.</p>
          <Link to="/add" className="gradient-btn" style={{ fontSize: 16, padding: '12px 32px' }}>
            <FiUserPlus style={{ marginRight: 10 }} /> Register Now
          </Link>
        </div>
        <div className="cta-decoration">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="cta-bubble"
              animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>
      </motion.section>

      <AIChatbot studentContext="Admin dashboard" />
    </div>
  );
}
