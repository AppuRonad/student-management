import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StudentProvider } from './context/StudentContext';
import { PortalAuthProvider } from './context/PortalAuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
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

export default function App() {
  return (
    <ErrorBoundary>
      <StudentProvider>
        <PortalAuthProvider>
          <BrowserRouter>
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
              theme="dark"
              toastStyle={{
                background: 'rgba(10,10,30,0.95)',
                border: '1px solid rgba(180,79,255,0.3)',
                backdropFilter: 'blur(12px)',
              }}
            />
          </BrowserRouter>
        </PortalAuthProvider>
      </StudentProvider>
    </ErrorBoundary>
  );
}
