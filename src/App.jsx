import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { StudentProvider } from './context/StudentContext';
import { PortalAuthProvider } from './context/PortalAuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { MemberAuthProvider } from './context/MemberAuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import BackgroundEffects from './components/BackgroundEffects';

// Pages
import LandingPage     from './pages/LandingPage';
import Dashboard       from './pages/Dashboard';
import Students        from './pages/Students';
import StudentForm     from './pages/StudentForm';
import StudentProfile  from './pages/StudentProfile';
import Analytics       from './pages/Analytics';
import StudentLogin    from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentPortal   from './pages/StudentPortal';
import AdminLogin      from './pages/AdminLogin';
import AdminRegister   from './pages/AdminRegister';
import MemberLogin     from './pages/MemberLogin';
import MemberRegister  from './pages/MemberRegister';
import MemberDashboard from './pages/MemberDashboard';
import ManageMembers   from './pages/ManageMembers';
import ViewMembers     from './pages/ViewMembers';

function AdminLayout({ children }) {
  return (
    <>
      <ParticleBackground />
      <Navbar />
      {children}
    </>
  );
}

function AppInner() {
  const { theme } = useTheme();

  return (
    <ErrorBoundary>
      <StudentProvider>
        <PortalAuthProvider>
          <AdminAuthProvider>
            <MemberAuthProvider>
              <BrowserRouter>
                <BackgroundEffects />
                <Routes>

                  {/* ── Root → Landing (login gateway) ─────────────────────── */}
                  <Route path="/"     element={<><ParticleBackground /><LandingPage /></>} />
                  <Route path="/home" element={<><ParticleBackground /><LandingPage /></>} />

                  {/* ── Admin auth ─────────────────────────────────────────── */}
                  <Route path="/admin-login"    element={<><ParticleBackground /><AdminLogin /></>} />
                  <Route path="/admin-register" element={<><ParticleBackground /><AdminRegister /></>} />

                  {/* ── Admin panel ────────────────────────────────────────── */}
                  <Route path="/dashboard"    element={<AdminLayout><Dashboard /></AdminLayout>} />
                  <Route path="/students"     element={<AdminLayout><Students /></AdminLayout>} />
                  <Route path="/add"          element={<AdminLayout><StudentForm /></AdminLayout>} />
                  <Route path="/edit/:id"     element={<AdminLayout><StudentForm /></AdminLayout>} />
                  <Route path="/student/:id"  element={<AdminLayout><StudentProfile /></AdminLayout>} />
                  <Route path="/analytics"    element={<AdminLayout><Analytics /></AdminLayout>} />
                  <Route path="/admin/members" element={<AdminLayout><ManageMembers /></AdminLayout>} />

                  {/* ── Student portal ─────────────────────────────────────── */}
                  <Route path="/student-login"    element={<><ParticleBackground /><StudentLogin /></>} />
                  <Route path="/student-register" element={<><ParticleBackground /><StudentRegister /></>} />
                  <Route path="/portal"           element={<><ParticleBackground /><StudentPortal /></>} />

                  {/* ── Member portal ──────────────────────────────────────── */}
                  <Route path="/member-login"    element={<><ParticleBackground /><MemberLogin /></>} />
                  <Route path="/member-register" element={<><ParticleBackground /><MemberRegister /></>} />
                  <Route path="/member"          element={<><ParticleBackground /><MemberDashboard /></>} />
                  <Route path="/member/view-members" element={<><ParticleBackground /><ViewMembers /></>} />

                  {/* ── Fallback ───────────────────────────────────────────── */}
                  <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>

                <ToastContainer
                  position="bottom-right"
                  autoClose={3000}
                  theme={theme === 'light' ? 'light' : 'dark'}
                  toastStyle={theme === 'dark' ? {
                    background: 'rgba(10,10,30,0.95)',
                    border: '1px solid rgba(180,79,255,0.3)',
                    backdropFilter: 'blur(12px)',
                  } : {
                    background: 'rgba(255,255,255,0.97)',
                    border: '1px solid rgba(139,45,255,0.2)',
                    backdropFilter: 'blur(12px)',
                  }}
                />
              </BrowserRouter>
            </MemberAuthProvider>
          </AdminAuthProvider>
        </PortalAuthProvider>
      </StudentProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
