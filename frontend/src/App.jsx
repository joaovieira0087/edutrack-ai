import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SubjectsView from './pages/SubjectsView';
import SubjectDetailView from './pages/SubjectDetailView';
import CreateSubjectView from './pages/CreateSubjectView';
import CreateTaskView from './pages/CreateTaskView';
import LoginView from './pages/LoginView';
import ForgotPasswordView from './pages/ForgotPasswordView';
import CompletedTasksView from './pages/CompletedTasksView';
import AiInsightsView from './pages/AiInsightsView';
import LandingView from './pages/LandingView';
import VerifyEmailView from './pages/VerifyEmailView';
import ActivitiesTreeView from './pages/ActivitiesTreeView';
import TaskDetailsView from './pages/TaskDetailsView';

import { ToastProvider } from './context/ToastContext';
import TrashView from './pages/TrashView';

// Componente que protege rotas autenticadas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="EduTrack AI Logo" 
            className="h-16 mx-auto object-contain animate-pulse mb-4" 
          />
          <p className="text-gray-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingView />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginView />} />
      <Route path="/esqueci-senha" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordView />} />
      <Route path="/verify-email" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyEmailView />} />

      {/* Rotas protegidas */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/atividades" element={<ProtectedRoute><Layout><ActivitiesTreeView /></Layout></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><Layout><TaskDetailsView /></Layout></ProtectedRoute>} />
      <Route path="/disciplinas" element={<ProtectedRoute><Layout><SubjectsView /></Layout></ProtectedRoute>} />
      <Route path="/disciplinas/nova" element={<ProtectedRoute><Layout><CreateSubjectView /></Layout></ProtectedRoute>} />
      <Route path="/disciplinas/:id" element={<ProtectedRoute><Layout><SubjectDetailView /></Layout></ProtectedRoute>} />
      <Route path="/tarefas/nova" element={<ProtectedRoute><Layout><CreateTaskView /></Layout></ProtectedRoute>} />
      <Route path="/concluidas" element={<ProtectedRoute><Layout><CompletedTasksView /></Layout></ProtectedRoute>} />
      <Route path="/lixeira" element={<ProtectedRoute><Layout><TrashView /></Layout></ProtectedRoute>} />
      <Route path="/ai-insights" element={<ProtectedRoute><Layout><AiInsightsView /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
