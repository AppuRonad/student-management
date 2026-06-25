import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiUser, FiUsers } from 'react-icons/fi';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-center">

        {/* Logo */}
        <motion.div
          className="landing-logo"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="landing-logo-icon">
            <FiUsers />
          </div>
          <div className="landing-logo-text">
            SMS <span>Pro</span>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="landing-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Student Management System — next-gen academic platform
        </motion.p>

        {/* Panel buttons */}
        <motion.div
          className="landing-panels"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {/* Admin Panel */}
          <motion.button
            className="panel-card panel-admin"
            onClick={() => navigate('/admin-login')}
            whileHover={{ scale: 1.04, y: -6 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="panel-icon">
              <FiShield />
            </div>
            <div className="panel-content">
              <h2>Admin Panel</h2>
              <p>Manage students, members, analytics and complete system access</p>
            </div>
            <div className="panel-arrow">→</div>
          </motion.button>

          {/* Student Panel */}
          <motion.button
            className="panel-card panel-student"
            onClick={() => navigate('/student-login')}
            whileHover={{ scale: 1.04, y: -6 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="panel-icon">
              <FiUser />
            </div>
            <div className="panel-content">
              <h2>Student Panel</h2>
              <p>View your academic profile, GPA, certifications and achievements</p>
            </div>
            <div className="panel-arrow">→</div>
          </motion.button>

          {/* Member Panel */}
          <motion.button
            className="panel-card panel-member"
            onClick={() => navigate('/member-login')}
            whileHover={{ scale: 1.04, y: -6 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="panel-icon">
              <FiUsers />
            </div>
            <div className="panel-content">
              <h2>Member Panel</h2>
              <p>Department-level access — manage your department's students and records</p>
            </div>
            <div className="panel-arrow">→</div>
          </motion.button>
        </motion.div>

        <motion.p
          className="landing-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Sambhram Institute of Technology · VTU Affiliated
        </motion.p>
      </div>
    </div>
  );
}
