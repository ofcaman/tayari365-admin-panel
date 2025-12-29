import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ImageSlider from "./pages/ImageSlider";
import LocationManagement from "./pages/LocationManagement";
import Subjects from "./pages/Subjects";
import SubjectsChapters from "./pages/SubjectsChapters";
import DailyMCQs from "./pages/DailyMCQs";
import TestPreparation from "./pages/TestPreparation";
import MCQs from "./pages/MCQs";
import Notices from "./pages/Notices";
import Syllabus from "./pages/Syllabus";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/slider" element={<ProtectedRoute><ImageSlider /></ProtectedRoute>} />
            <Route path="/dashboard/locations" element={<ProtectedRoute><LocationManagement /></ProtectedRoute>} />
            <Route path="/dashboard/subjects-manager" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
            <Route path="/dashboard/subjects" element={<ProtectedRoute><SubjectsChapters /></ProtectedRoute>} />
            <Route path="/dashboard/daily-mcqs" element={<ProtectedRoute><DailyMCQs /></ProtectedRoute>} />
            <Route path="/dashboard/test-preparation" element={<ProtectedRoute><TestPreparation /></ProtectedRoute>} />
            <Route path="/dashboard/mcqs" element={<ProtectedRoute><MCQs /></ProtectedRoute>} />
            <Route path="/dashboard/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
            <Route path="/dashboard/syllabus" element={<ProtectedRoute><Syllabus /></ProtectedRoute>} />
            <Route path="/dashboard/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
