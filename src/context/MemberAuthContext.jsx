import { createContext, useContext, useState } from 'react';

const MemberAuthContext = createContext();

export function MemberAuthProvider({ children }) {
  const [member, setMember] = useState(() => {
    try {
      const m = sessionStorage.getItem('sms_member');
      return m ? JSON.parse(m) : null;
    } catch { return null; }
  });

  const loginMember = (memberData) => {
    setMember(memberData);
    sessionStorage.setItem('sms_member', JSON.stringify(memberData));
  };

  const logoutMember = () => {
    setMember(null);
    sessionStorage.removeItem('sms_member');
  };

  return (
    <MemberAuthContext.Provider value={{ member, loginMember, logoutMember, isMemberLoggedIn: !!member }}>
      {children}
    </MemberAuthContext.Provider>
  );
}

export const useMemberAuth = () => useContext(MemberAuthContext);
