import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { StudentProvider } from './context/StudentContext';
import { PortalAuthProvider } from './context/PortalAuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import BackgroundEffects from './components/BackgroundEffects';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentForm from './pages/StudentForm';
import StudentProfile from './pages/StudentProfile';
import Analytics from './pages/Analytics';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentPortal from './pages/StudentPortal';

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
          <BrowserRouter>
            {/* Always-present background layers on every route */}
            <BackgroundEffects />
            <Routes>
              {/* ── Admin panel ── */}
              <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
              <Route path="/students" element={<AdminLayout><Students /></AdminLayout>} />
              <Route path="/add" element={<AdminLayout><StudentForm /></AdminLayout>} />
              <Route path="/edit/:id" element={<AdminLayout><StudentForm /></AdminLayout>} />
              <Route path="/student/:id" element={<AdminLayout><StudentProfile /></AdminLayout>} />
              <Route path="/analytics" element={<AdminLayout><Analytics /></AdminLayout>} />

              {/* ── Student portal ── */}
              <Route path="/student-login"    element={<><ParticleBackground /><StudentLogin /></>} />
              <Route path="/student-register" element={<><ParticleBackground /><StudentRegister /></>} />
              <Route path="/portal"           element={<><ParticleBackground /><StudentPortal /></>} />
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
