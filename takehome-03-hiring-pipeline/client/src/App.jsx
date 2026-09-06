import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Applications from './pages/Applications';
import ApplicationDetails from './pages/ApplicationDetails';
import MyApplications from './pages/MyApplications';
import Alerts from './pages/Alerts';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Root redirect based on role
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'recruiter') return <Navigate to="/dashboard" replace />;
  if (user.role === 'interviewer') return <Navigate to="/my-applications" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<AppLayout />}>
            <Route index element={<RootRedirect />} />
            
            {/* Recruiter Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="jobs" element={
              <ProtectedRoute allowedRoles={['recruiter', 'interviewer']}>
                <Jobs />
              </ProtectedRoute>
            } />
            <Route path="jobs/:jobId" element={
              <ProtectedRoute allowedRoles={['recruiter', 'interviewer']}>
                <JobDetails />
              </ProtectedRoute>
            } />
            <Route path="applications" element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <Applications />
              </ProtectedRoute>
            } />
            <Route path="alerts" element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <Alerts />
              </ProtectedRoute>
            } />

            {/* Interviewer Routes */}
            <Route path="my-applications" element={
              <ProtectedRoute allowedRoles={['interviewer']}>
                <MyApplications />
              </ProtectedRoute>
            } />

            {/* Shared Route (Different views handled inside based on role) */}
            <Route path="applications/:applicationId" element={
              <ProtectedRoute allowedRoles={['recruiter', 'interviewer']}>
                <ApplicationDetails />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
