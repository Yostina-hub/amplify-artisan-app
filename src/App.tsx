import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Composer from "./pages/Composer";
import CalendarView from "./pages/CalendarView";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Agents from "./pages/Agents";
import Auth from "./pages/Auth";
import BrandMonitoring from "./pages/BrandMonitoring";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ContentModeration from "./pages/admin/ContentModeration";
import SystemSettings from "./pages/admin/SystemSettings";
import SocialMediaMetrics from "./pages/SocialMediaMetrics";
import AdCampaigns from "./pages/AdCampaigns";
import SocialListening from "./pages/SocialListening";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/pending-approval" element={<ProtectedRoute allowUnapproved><Layout><PendingApproval /></Layout></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/composer" element={<ProtectedRoute><Layout><Composer /></Layout></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Layout><CalendarView /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="/social-metrics" element={<ProtectedRoute><Layout><SocialMediaMetrics /></Layout></ProtectedRoute>} />
            <Route path="/ad-campaigns" element={<ProtectedRoute><Layout><AdCampaigns /></Layout></ProtectedRoute>} />
            <Route path="/brand-monitoring" element={<ProtectedRoute><Layout><BrandMonitoring /></Layout></ProtectedRoute>} />
            <Route path="/social-listening" element={<ProtectedRoute><Layout><SocialListening /></Layout></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute requiredRole="agent"><Layout><Agents /></Layout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><Layout><UserManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute requiredRole="admin"><Layout><ContentModeration /></Layout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><Layout><SystemSettings /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
