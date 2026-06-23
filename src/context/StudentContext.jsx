import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const StudentContext = createContext();

// ── API Base URL ────────────────────────────────────────────────────────────
const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/students`;

// ── Sample data (used only if backend is offline) ───────────────────────────
const SAMPLE_STUDENTS = [
  { id: 'STU001', fullName: 'Aria Chen',      email: 'aria.chen@edu.com',  phone: '9876543210', course: 'B.Tech CSE',   department: 'Computer Science', dob: '2002-03-15', enrolledDate: '2024-07-01', gpa: 9.2, avatar: 1 },
  { id: 'STU002', fullName: 'Marcus Rivera',  email: 'marcus.r@edu.com',   phone: '9871234560', course: 'B.Tech ECE',   department: 'Electronics',      dob: '2001-11-22', enrolledDate: '2024-07-01', gpa: 8.4, avatar: 2 },
  { id: 'STU003', fullName: 'Zara Patel',     email: 'zara.p@edu.com',     phone: '9865432100', course: 'MBA',          department: 'Management',       dob: '2000-05-08', enrolledDate: '2024-07-01', gpa: 8.7, avatar: 3 },
  { id: 'STU004', fullName: "Liam O'Brien",   email: 'liam.ob@edu.com',    phone: '9812345670', course: 'B.Sc Math',    department: 'Mathematics',      dob: '2003-01-30', enrolledDate: '2024-07-01', gpa: 7.5, avatar: 4 },
  { id: 'STU005', fullName: 'Priya Sharma',   email: 'priya.s@edu.com',    phone: '9898765430', course: 'B.Tech CSE',   department: 'Computer Science', dob: '2002-08-19', enrolledDate: '2024-07-01', gpa: 9.8, avatar: 5 },
  { id: 'STU006', fullName: 'Kai Nakamura',   email: 'kai.n@edu.com',      phone: '9823456780', course: 'M.Tech AI',    department: 'Computer Science', dob: '2000-12-05', enrolledDate: '2024-07-01', gpa: 8.1, avatar: 6 },
  { id: 'STU007', fullName: 'Sofia Martinez', email: 'sofia.m@edu.com',    phone: '9834567890', course: 'B.Sc Physics', department: 'Physics',          dob: '2001-04-14', enrolledDate: '2024-07-01', gpa: 7.2, avatar: 7 },
  { id: 'STU008', fullName: 'Devon Wright',   email: 'devon.w@edu.com',    phone: '9845678901', course: 'MBA',          department: 'Management',       dob: '1999-09-27', enrolledDate: '2024-07-01', gpa: 6.8, avatar: 8 },
];

export const COURSES     = ['B.Tech CSE', 'B.Tech ECE', 'M.Tech AI', 'MBA', 'B.Sc Math', 'B.Sc Physics', 'B.Com', 'BCA', 'MCA'];
export const DEPARTMENTS = ['Computer Science', 'Electronics', 'Management', 'Mathematics', 'Physics', 'Commerce', 'Information Technology'];

// ── Helper ──────────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  // 204 No Content (DELETE) has no body
  if (res.status === 204) return null;
  return res.json();
}

export function StudentProvider({ children }) {
  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [backendUp,   setBackendUp]   = useState(false); // tracks if API is reachable

  // ── On mount: try to load from backend, fallback to localStorage ──────────
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await apiFetch(API);
        if (data && data.length >= 0) {
          setBackendUp(true);
          if (data.length === 0) {
            // Backend is empty — seed sample data into MongoDB
            await seedSampleData();
          } else {
            setStudents(data);
          }
        }
      } catch (err) {
        // Backend offline — use localStorage fallback
        console.warn('Backend offline, using localStorage');
        setBackendUp(false);
        const stored = localStorage.getItem('sms_students_v2');
        setStudents(stored ? JSON.parse(stored) : SAMPLE_STUDENTS);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  // ── Sync to localStorage whenever students change (offline fallback) ──────
  useEffect(() => {
    if (!backendUp && students.length > 0) {
      localStorage.setItem('sms_students_v2', JSON.stringify(students));
    }
  }, [students, backendUp]);

  // ── Seed sample students into MongoDB on first run ────────────────────────
  const seedSampleData = async () => {
    try {
      const seeded = [];
      for (const s of SAMPLE_STUDENTS) {
        try {
          const saved = await apiFetch(API, {
            method: 'POST',
            body: JSON.stringify(s),
          });
          seeded.push(saved);
        } catch (_) {
          seeded.push(s); // skip if duplicate
        }
      }
      // Reload fresh from backend
      const fresh = await apiFetch(API);
      setStudents(fresh);
    } catch (err) {
      setStudents(SAMPLE_STUDENTS);
    }
  };

  // ── ADD ───────────────────────────────────────────────────────────────────
  const addStudent = async (student) => {
    const newStudent = {
      ...student,
      enrolledDate: new Date().toISOString().split('T')[0],
      avatar: Math.floor(Math.random() * 8) + 1,
      gpa: student.gpa ? parseFloat(student.gpa) : null,
    };

    if (backendUp) {
      try {
        const saved = await apiFetch(API, {
          method: 'POST',
          body: JSON.stringify(newStudent),
        });
        setStudents(prev => [saved, ...prev]);
        return saved;
      } catch (err) {
        toast.error('Failed to save to database');
        throw err;
      }
    } else {
      // Offline fallback
      const withId = {
        ...newStudent,
        id: `STU${String(Date.now()).slice(-3).padStart(3, '0')}`,
      };
      setStudents(prev => [withId, ...prev]);
      return withId;
    }
  };

  // ── UPDATE ────────────────────────────────────────────────────────────────
  const updateStudent = async (id, data) => {
    const updated = { ...getStudent(id), ...data, gpa: data.gpa ? parseFloat(data.gpa) : null };

    if (backendUp) {
      try {
        const saved = await apiFetch(`${API}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updated),
        });
        setStudents(prev => prev.map(s => s.id === id ? saved : s));
        return saved;
      } catch (err) {
        toast.error('Failed to update in database');
        throw err;
      }
    } else {
      setStudents(prev => prev.map(s => s.id === id ? updated : s));
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const deleteStudent = async (id) => {
    if (backendUp) {
      try {
        await apiFetch(`${API}/${id}`, { method: 'DELETE' });
        setStudents(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        toast.error('Failed to delete from database');
        throw err;
      }
    } else {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  // ── GET ONE ───────────────────────────────────────────────────────────────
  const getStudent = (id) => students.find(s => s.id === id);

  // ── SEARCH (uses backend if available) ────────────────────────────────────
  const searchStudents = async (query) => {
    if (backendUp && query) {
      try {
        return await apiFetch(`${API}?search=${encodeURIComponent(query)}`);
      } catch (_) {}
    }
    const q = query.toLowerCase();
    return students.filter(s =>
      s.fullName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  };

  return (
    <StudentContext.Provider value={{
      students,
      loading,
      backendUp,
      addStudent,
      updateStudent,
      deleteStudent,
      getStudent,
      searchStudents,
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudents = () => useContext(StudentContext);
