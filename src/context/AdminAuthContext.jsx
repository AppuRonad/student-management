import { createContext, useContext, useState } from 'react';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const a = sessionStorage.getItem('sms_admin');
      return a ? JSON.parse(a) : null;
    } catch { return null; }
  });

  const loginAdmin = (adminData) => {
    setAdmin(adminData);
    sessionStorage.setItem('sms_admin', JSON.stringify(adminData));
  };

  const logoutAdmin = () => {
    setAdmin(null);
    sessionStorage.removeItem('sms_admin');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loginAdmin, logoutAdmin, isAdminLoggedIn: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
