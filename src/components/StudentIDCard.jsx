import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiDownload, FiCreditCard, FiX } from 'react-icons/fi';
import './StudentIDCard.css';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#b44fff,#00f5ff)',
  'linear-gradient(135deg,#ff2d78,#ffe600)',
  'linear-gradient(135deg,#39ff14,#00f5ff)',
  'linear-gradient(135deg,#ffe600,#ff6b35)',
  'linear-gradient(135deg,#00f5ff,#b44fff)',
  'linear-gradient(135deg,#ff6b35,#ff2d78)',
  'linear-gradient(135deg,#b44fff,#ff2d78)',
  'linear-gradient(135deg,#39ff14,#ffe600)',
];

export default function StudentIDCard({ student }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const profileUrl = `${window.location.origin}/student/${student.id}`;
  const initials = student.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const gradient = AVATAR_GRADIENTS[(student.avatar - 1) % AVATAR_GRADIENTS.length];

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [86, 54] });
      pdf.addImage(imgData, 'PNG', 0, 0, 86, 54);
      pdf.save(`StudentID_${student.id}.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
    }
    setDownloading(false);
  };

  const downloadPNG = async () => {
    setDownloading(true);
    const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: null });
    const link = document.createElement('a');
    link.download = `StudentID_${student.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  };

  return (
    <>
      <motion.button
        className="id-card-btn"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <FiCreditCard /> Generate ID Card
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="id-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="id-modal"
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 40 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="id-modal-header">
                <h3>🪪 Student ID Card</h3>
                <button onClick={() => setOpen(false)}><FiX /></button>
              </div>

              {/* The actual card — this gets captured */}
              <div className="id-card-wrap">
                <div ref={cardRef} className="id-card">
                  {/* Card background */}
                  <div className="id-card-bg">
                    <div className="id-bg-shape s1" />
                    <div className="id-bg-shape s2" />
                    <div className="id-bg-grid" />
                  </div>

                  {/* Header */}
                  <div className="id-card-top">
                    <div className="id-logo">⚡ SMS Pro</div>
                    <div className="id-year">2024–25</div>
                  </div>

                  {/* Content */}
                  <div className="id-card-body">
                    <div className="id-avatar" style={{ background: gradient }}>
                      {initials}
                    </div>
                    <div className="id-info">
                      <div className="id-name">{student.fullName}</div>
                      <div className="id-sid">{student.id}</div>
                      <div className="id-course">{student.course}</div>
                      <div className="id-dept">{student.department}</div>
                      {student.dob && (
                        <div className="id-dob">
                          DOB: {new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <div className="id-qr">
                      <QRCodeSVG
                        value={profileUrl}
                        size={64}
                        bgColor="transparent"
                        fgColor="#b44fff"
                        level="M"
                      />
                      <div className="id-qr-label">Scan to view profile</div>
                    </div>
                  </div>

                  {/* Footer stripe */}
                  <div className="id-card-footer">
                    <span>📧 {student.email}</span>
                    <span>📞 {student.phone}</span>
                  </div>
                  <div className="id-color-stripe" />
                </div>
              </div>

              {/* Download buttons */}
              <div className="id-download-row">
                <motion.button
                  className="id-dl-btn pdf"
                  onClick={downloadPDF}
                  disabled={downloading}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {downloading ? '⏳ Generating...' : <><FiDownload /> Download PDF</>}
                </motion.button>
                <motion.button
                  className="id-dl-btn png"
                  onClick={downloadPNG}
                  disabled={downloading}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <FiDownload /> Download PNG
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
