import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCalendar, FiSave, FiCheckCircle } from 'react-icons/fi';
import { getTrackRecord, saveAttendance } from '../services/portalApi';
import { toast } from 'react-toastify';
import './AttendanceModal.css';

/**
 * AttendanceModal — used by both Admin (Students.jsx, any student) and
 * Member (MemberDashboard.jsx, gated by perms.addAttendance, dept-scoped).
 *
 * Props:
 *   student   — { id, fullName }  (required)
 *   onClose   — () => void
 *   onSaved   — () => void  (called after a successful save, e.g. to refresh)
 */
export default function AttendanceModal({ student, onClose, onSaved }) {
  const [total,   setTotal]   = useState('');
  const [present, setPresent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!student?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const record = await getTrackRecord(student.id);
        if (!cancelled && record?.attendance) {
          setTotal(String(record.attendance.total ?? ''));
          setPresent(String(record.attendance.present ?? ''));
        }
      } catch {
        // No existing record — fine, start blank
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student?.id]);

  const totalNum   = parseInt(total, 10)   || 0;
  const presentNum = parseInt(present, 10) || 0;
  const percent    = totalNum > 0 ? Math.round((presentNum / totalNum) * 100) : 0;

  const valid = totalNum > 0 && presentNum >= 0 && presentNum <= totalNum;

  const percentColor =
    percent >= 75 ? '#39ff14' :
    percent >= 65 ? '#ffe600' :
    '#ff2d78';

  const handleSave = async () => {
    if (!valid) {
      toast.error('Present classes cannot exceed total classes');
      return;
    }
    setSaving(true);
    try {
      await saveAttendance(student.id, {
        total: totalNum,
        present: presentNum,
        percent,
      });
      toast.success(`Attendance updated for ${student.fullName}`);
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="att-overlay" onClick={onClose}>
      <motion.div
        className="att-box"
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="att-header">
          <div className="att-header-icon"><FiCalendar /></div>
          <div className="att-header-info">
            <div className="att-title">Add Attendance</div>
            <div className="att-sub">{student?.fullName} · {student?.id}</div>
          </div>
          <button className="att-close" onClick={onClose}><FiX /></button>
        </div>

        {loading ? (
          <div className="att-loading">Loading current attendance…</div>
        ) : (
          <>
            {/* Inputs */}
            <div className="att-fields">
              <div className="att-field">
                <label>Total Classes Held</label>
                <input
                  type="number"
                  min="0"
                  value={total}
                  onChange={e => setTotal(e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>
              <div className="att-field">
                <label>Classes Attended</label>
                <input
                  type="number"
                  min="0"
                  value={present}
                  onChange={e => setPresent(e.target.value)}
                  placeholder="e.g. 48"
                />
              </div>
            </div>

            {/* Live percentage preview */}
            <div className="att-preview">
              <div className="att-preview-row">
                <span>Attendance</span>
                <span className="att-percent" style={{ color: percentColor }}>{percent}%</span>
              </div>
              <div className="att-bar-track">
                <motion.div
                  className="att-bar-fill"
                  style={{ background: percentColor }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="att-policy-note">
                {percent >= 75
                  ? <span style={{ color: '#39ff14' }}><FiCheckCircle /> Meets 75% minimum requirement</span>
                  : <span style={{ color: '#ff2d78' }}>⚠️ Below 75% minimum — exam eligibility at risk</span>
                }
              </div>
            </div>

            {!valid && total !== '' && present !== '' && (
              <div className="att-error">⚠️ Present classes cannot exceed total classes</div>
            )}

            {/* Actions */}
            <div className="att-actions">
              <button className="att-cancel" onClick={onClose}>Cancel</button>
              <motion.button
                className="att-save"
                onClick={handleSave}
                disabled={saving || !valid}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiSave /> {saving ? 'Saving…' : 'Save Attendance'}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
