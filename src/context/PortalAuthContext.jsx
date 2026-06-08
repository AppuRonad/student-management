import { createContext, useContext, useState } from 'react';

const PortalAuthContext = createContext();

// ── Context Provider ─────────────────────────────────────────────────────────
export function PortalAuthProvider({ children }) {
  const [portalStudent, setPortalStudent] = useState(() => {
    try {
      const s = sessionStorage.getItem('portal_student');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const loginStudent = (student) => {
    setPortalStudent(student);
    sessionStorage.setItem('portal_student', JSON.stringify(student));
  };

  const logoutStudent = () => {
    setPortalStudent(null);
    sessionStorage.removeItem('portal_student');
  };

  return (
    <PortalAuthContext.Provider value={{ portalStudent, loginStudent, logoutStudent }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export const usePortalAuth = () => useContext(PortalAuthContext);
