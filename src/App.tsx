import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import { DashboardRedirect } from "./components/DashboardRedirect";
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
import EmailSettings from "./pages/admin/EmailSettings";
import CompanyEmailSettings from "./pages/CompanyEmailSettings";
import SocialMediaMetrics from "./pages/SocialMediaMetrics";
import AdCampaigns from "./pages/AdCampaigns";
import SocialListening from "./pages/SocialListening";
import InfluencerMarketing from "./pages/InfluencerMarketing";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";
import CompanyApplication from "./pages/CompanyApplication";
import CompanyManagement from "./pages/admin/CompanyManagement";
import SocialPlatformManagement from "./pages/admin/SocialPlatformManagement";
import SocialMediaCredentials from "./pages/SocialMediaCredentials";
import CompanyPlatformSettings from "./pages/PlatformConfigs";
import CompanyPlatformSubscriptions from "./pages/CompanyPlatformSubscriptions";
import AdminCompanyPlatformSubscriptions from "./pages/admin/CompanyPlatformSubscriptions";
import ReachAnalytics from "./pages/admin/ReachAnalytics";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import LandingPageManager from "./pages/admin/LandingPageManager";
import IndustryManagement from "./pages/admin/IndustryManagement";
import Industry from "./pages/Industry";
import PricingManagement from "./pages/admin/PricingManagement";
import SubscriptionManagement from "./pages/admin/SubscriptionManagement";
import TrialSettings from "./pages/admin/TrialSettings";
import AuditLog from "./pages/admin/AuditLog";
import CompanyAuditLog from "./pages/CompanyAuditLog";
import SocialAuthSettings from "./pages/admin/SocialAuthSettings";
import PaymentManagement from "./pages/admin/PaymentManagement";
import PublicContentManager from "./pages/admin/PublicContentManager";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Help from "./pages/Help";
import APIManagement from "./pages/admin/APIManagement";
import CompanyAPIManagement from "./pages/CompanyAPIManagement";
import AIStudio from "./pages/AIStudio";
import SocialInbox from "./pages/SocialInbox";
import SocialIntelligence from "./pages/SocialIntelligence";
import Automation from "./pages/Automation";
import AIAnalytics from "./pages/AIAnalytics";
import ModuleBuilder from "./pages/ModuleBuilder";
import FormBuilder from "./pages/FormBuilder";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import ReportingDashboard from "./pages/ReportingDashboard";
import CRMFeatureStatus from "./pages/CRMFeatureStatus";
import Contacts from "./pages/Contacts";
import Accounts from "./pages/Accounts";
import Leads from "./pages/Leads";
import SalesPipeline from "./pages/SalesPipeline";
import Activities from "./pages/Activities";
import Products from "./pages/Products";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import EmailMarketing from "./pages/EmailMarketing";
import Documents from "./pages/Documents";
import Payments from "./pages/Payments";
import TerritoryManagement from "./pages/TerritoryManagement";
import CustomerSupport from "./pages/CustomerSupport";
import CallCenter from "./pages/CallCenter";
import ProjectManagement from "./pages/ProjectManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/industry/:slug" element={<Industry />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/company-application" element={<CompanyApplication />} />
            <Route path="/pending-approval" element={<ProtectedRoute allowUnapproved><Layout><PendingApproval /></Layout></ProtectedRoute>} />
            <Route path="/force-password" element={<ProtectedRoute allowUnapproved><Layout><ForcePasswordChange /></Layout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardRedirect /></Layout></ProtectedRoute>} />
            <Route path="/company-dashboard" element={<ProtectedRoute><Layout><CompanyDashboard /></Layout></ProtectedRoute>} />
            <Route path="/user-dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/composer" element={<ProtectedRoute><Layout><Composer /></Layout></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Layout><CalendarView /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Layout><Help /></Layout></ProtectedRoute>} />
            <Route path="/ad-campaigns" element={<ProtectedRoute><Layout><AdCampaigns /></Layout></ProtectedRoute>} />
            <Route path="/influencer-marketing" element={<ProtectedRoute><Layout><InfluencerMarketing /></Layout></ProtectedRoute>} />
            <Route path="/brand-monitoring" element={<ProtectedRoute><Layout><BrandMonitoring /></Layout></ProtectedRoute>} />
            <Route path="/social-listening" element={<ProtectedRoute><Layout><SocialListening /></Layout></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute requiredRole="agent"><Layout><Agents /></Layout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
            <Route path="/admin/companies" element={<ProtectedRoute requiredRole="admin"><Layout><CompanyManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><Layout><UserManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute requiredRole="admin"><Layout><ContentModeration /></Layout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><Layout><SystemSettings /></Layout></ProtectedRoute>} />
            <Route path="/admin/email-settings" element={<ProtectedRoute requiredRole="admin"><Layout><EmailSettings /></Layout></ProtectedRoute>} />
            <Route path="/admin/social-platforms" element={<ProtectedRoute requiredRole="admin"><Layout><SocialPlatformManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/platform-subscriptions" element={<ProtectedRoute requiredRole="admin"><Layout><AdminCompanyPlatformSubscriptions /></Layout></ProtectedRoute>} />
            <Route path="/admin/reach-analytics" element={<ProtectedRoute requiredRole="admin"><Layout><ReachAnalytics /></Layout></ProtectedRoute>} />
            <Route path="/admin/landing-page" element={<ProtectedRoute requiredRole="admin"><Layout><LandingPageManager /></Layout></ProtectedRoute>} />
            <Route path="/admin/industries" element={<ProtectedRoute requiredRole="admin"><Layout><IndustryManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/pricing" element={<ProtectedRoute requiredRole="admin"><Layout><PricingManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="admin"><Layout><SubscriptionManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><Layout><PaymentManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/trial-settings" element={<ProtectedRoute requiredRole="admin"><Layout><TrialSettings /></Layout></ProtectedRoute>} />
            <Route path="/admin/audit-log" element={<ProtectedRoute requiredRole="admin"><Layout><AuditLog /></Layout></ProtectedRoute>} />
            <Route path="/admin/social-auth" element={<ProtectedRoute requiredRole="admin"><Layout><SocialAuthSettings /></Layout></ProtectedRoute>} />
            <Route path="/admin/public-content" element={<ProtectedRoute requiredRole="admin"><Layout><PublicContentManager /></Layout></ProtectedRoute>} />
            <Route path="/admin/api-management" element={<ProtectedRoute requiredRole="admin"><Layout><APIManagement /></Layout></ProtectedRoute>} />
            <Route path="/company/email-settings" element={<ProtectedRoute><Layout><CompanyEmailSettings /></Layout></ProtectedRoute>} />
            <Route path="/company/audit-log" element={<ProtectedRoute><Layout><CompanyAuditLog /></Layout></ProtectedRoute>} />
            <Route path="/company/platform-subscriptions" element={<ProtectedRoute><Layout><CompanyPlatformSubscriptions /></Layout></ProtectedRoute>} />
            <Route path="/company/platform-settings" element={<ProtectedRoute><Layout><CompanyPlatformSettings /></Layout></ProtectedRoute>} />
            <Route path="/company/api-management" element={<ProtectedRoute><Layout><CompanyAPIManagement /></Layout></ProtectedRoute>} />
            
            {/* AI Features */}
            <Route path="/ai-studio" element={<ProtectedRoute><Layout><AIStudio /></Layout></ProtectedRoute>} />
            <Route path="/social-inbox" element={<ProtectedRoute><Layout><SocialInbox /></Layout></ProtectedRoute>} />
          <Route path="/social-intelligence" element={<ProtectedRoute><Layout><SocialIntelligence /></Layout></ProtectedRoute>} />
          <Route path="/automation" element={<ProtectedRoute><Layout><Automation /></Layout></ProtectedRoute>} />
          <Route path="/ai-analytics" element={<ProtectedRoute><Layout><AIAnalytics /></Layout></ProtectedRoute>} />
          <Route path="/social-media-credentials" element={<ProtectedRoute><Layout><SocialMediaCredentials /></Layout></ProtectedRoute>} />
          
          {/* Enterprise Builder */}
          <Route path="/module-builder" element={<ProtectedRoute><Layout><ModuleBuilder /></Layout></ProtectedRoute>} />
          <Route path="/form-builder" element={<ProtectedRoute><Layout><FormBuilder /></Layout></ProtectedRoute>} />
          <Route path="/workflow-builder" element={<ProtectedRoute><Layout><WorkflowBuilder /></Layout></ProtectedRoute>} />
          <Route path="/reporting-dashboard" element={<ProtectedRoute><Layout><ReportingDashboard /></Layout></ProtectedRoute>} />
          <Route path="/crm-roadmap" element={<ProtectedRoute><Layout><CRMFeatureStatus /></Layout></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><Layout><Contacts /></Layout></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><Layout><Accounts /></Layout></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Layout><Leads /></Layout></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute><Layout><SalesPipeline /></Layout></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute><Layout><Activities /></Layout></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
          <Route path="/quotes" element={<ProtectedRoute><Layout><Quotes /></Layout></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Layout><Invoices /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/email-marketing" element={<ProtectedRoute><Layout><EmailMarketing /></Layout></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Layout><Documents /></Layout></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Layout><Payments /></Layout></ProtectedRoute>} />
          <Route path="/territory-management" element={<ProtectedRoute><Layout><TerritoryManagement /></Layout></ProtectedRoute>} />
          <Route path="/customer-support" element={<ProtectedRoute><Layout><CustomerSupport /></Layout></ProtectedRoute>} />
          <Route path="/call-center" element={<ProtectedRoute><Layout><CallCenter /></Layout></ProtectedRoute>} />
          <Route path="/project-management" element={<ProtectedRoute><Layout><ProjectManagement /></Layout></ProtectedRoute>} />
            
            <Route path="/social-accounts" element={<ProtectedRoute><Layout><SocialMediaCredentials /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
