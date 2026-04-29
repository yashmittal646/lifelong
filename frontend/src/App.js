import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ParentDashboard from "./pages/ParentDashboard";
import ChildDetail from "./pages/ChildDetail";
import ChildView from "./pages/ChildView";
import AdultDashboard from "./pages/AdultDashboard";
import Settings from "./pages/Settings";
import AuthCallback from "./pages/AuthCallback";
import RolePicker from "./pages/RolePicker";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import "@/index.css";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--text-2)]">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.role) return <Navigate to="/onboarding/role" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "parent" ? "/parent/dashboard" : "/adult/dashboard"} replace />;
  }
  return children;
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.role) return <Navigate to="/onboarding/role" replace />;
  return <Navigate to={user.role === "parent" ? "/parent/dashboard" : "/adult/dashboard"} replace />;
}

function AppRouter() {
  const location = useLocation();
  // Detect Emergent OAuth callback synchronously during render — prevents race with AuthProvider
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding/role" element={<RolePicker />} />
      <Route path="/parent/dashboard" element={<Protected role="parent"><ParentDashboard /></Protected>} />
      <Route path="/parent/child/:id" element={<Protected role="parent"><ChildDetail /></Protected>} />
      <Route path="/child/:id" element={<Protected><ChildView /></Protected>} />
      <Route path="/adult/dashboard" element={<Protected><AdultDashboard /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}
