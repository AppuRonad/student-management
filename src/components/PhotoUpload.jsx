import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiCheck, FiX } from 'react-icons/fi';
import { uploadProfilePhoto } from '../firebase/storageService';
import { isFirebaseConfigured } from '../firebase/config';
import './PhotoUpload.css';

export default function PhotoUpload({ studentId, currentPhotoUrl, onUploadComplete }) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhotoUrl || null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only image files are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be under 5MB.'); return; }

    setError('');
    setPreview(URL.createObjectURL(file));

    if (!isFirebaseConfigured) {
      // Demo mode — just show the preview
      setDone(true);
      onUploadComplete?.(URL.createObjectURL(file));
      return;
    }

    setUploading(true);
    setDone(false);
    try {
      const url = await uploadProfilePhoto(studentId, file, (pct) => setProgress(pct));
      setDone(true);
      onUploadComplete?.(url);
    } catch (err) {
      setError('Upload failed. Check Firebase Storage rules.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="photo-upload">
      {/* Preview */}
      {preview && (
        <div className="photo-preview-wrap">
          <img src={preview} alt="Profile" className="photo-preview-img" />
          {done && (
            <motion.div className="photo-done-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <FiCheck />
            </motion.div>
          )}
        </div>
      )}

      {/* Drop zone */}
      <motion.div
        className={`photo-dropzone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        whileHover={{ borderColor: 'rgba(180,79,255,0.6)' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {uploading ? (
          <div className="upload-progress-wrap">
            <div className="upload-progress-ring">
              <svg viewBox="0 0 60 60">
                <circle className="ring-bg" cx="30" cy="30" r="24" />
                <motion.circle
                  className="ring-fill"
                  cx="30" cy="30" r="24"
                  initial={{ strokeDashoffset: 151 }}
                  animate={{ strokeDashoffset: 151 - (151 * progress) / 100 }}
                  transition={{ duration: 0.2 }}
                />
              </svg>
              <span className="upload-pct">{progress}%</span>
            </div>
            <span>Uploading to Firebase...</span>
          </div>
        ) : (
          <>
            <FiUploadCloud className="dz-icon" />
            <span className="dz-text">
              {isFirebaseConfigured ? 'Drop photo or click to upload' : 'Click to preview photo'}
            </span>
            <span className="dz-sub">PNG, JPG up to 5MB</span>
          </>
        )}
      </motion.div>

      {error && <div className="photo-error">⚠️ {error}</div>}
      {!isFirebaseConfigured && (
        <div className="photo-notice">
          🔥 Connect Firebase Storage to enable real uploads
        </div>
      )}
    </div>
  );
}
