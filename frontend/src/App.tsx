import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Role } from './types';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import MyQRCode from './pages/student/MyQRCode';
import Scanner from './pages/admin/Scanner';
import OccupancyManagement from './pages/admin/OccupancyManagement';
import LogsManagement from './pages/admin/LogsManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole={Role.ADMIN}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/student/portal"
        element={
          <ProtectedRoute requiredRole={Role.STUDENT}>
            <StudentPortal />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/student/qr-code"
        element={
          <ProtectedRoute requiredRole={Role.STUDENT}>
            <MyQRCode />
          </ProtectedRoute>
        }
      />
      
         <Route
           path="/admin/scanner"
           element={
             <ProtectedRoute requiredRole={Role.ADMIN}>
               <Scanner />
             </ProtectedRoute>
           }
         />
         
         <Route
           path="/admin/occupancy"
           element={
             <ProtectedRoute requiredRole={Role.ADMIN}>
               <OccupancyManagement />
             </ProtectedRoute>
           }
         />
         
         <Route
           path="/admin/logs"
           element={
             <ProtectedRoute requiredRole={Role.ADMIN}>
               <LogsManagement />
             </ProtectedRoute>
           }
         />
         
         <Route
           path="/admin/analytics"
           element={
             <ProtectedRoute requiredRole={Role.ADMIN}>
               <AnalyticsDashboard />
             </ProtectedRoute>
           }
         />
      
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            userRole === Role.ADMIN ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/student/portal" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;