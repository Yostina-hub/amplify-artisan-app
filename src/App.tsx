import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { EnhancedLayout } from "./components/EnhancedLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LiveChat } from "./components/LiveChat";
import Index from "./pages/Index";
import UnifiedDashboard from "./components/UnifiedDashboard";
import Composer from "./pages/Composer";
import CalendarView from "./pages/CalendarView";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Agents from "./pages/Agents";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ContentModeration from "./pages/admin/ContentModeration";
import SystemConfiguration from "./pages/admin/SystemConfiguration";
import PlatformOAuthApps from "./pages/admin/PlatformOAuthApps";
import EmailSettings from "./pages/admin/EmailSettings";
import CompanyEmailSettings from "./pages/CompanyEmailSettings";

import AdCampaigns from "./pages/AdCampaigns";
import InfluencerMarketing from "./pages/InfluencerMarketing";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";
import CompanyApplication from "./pages/CompanyApplication";
import CompanyManagement from "./pages/admin/CompanyManagement";
import SocialPlatformManagement from "./pages/admin/SocialPlatformManagement";
import SocialConnections from "./pages/SocialConnections";
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
import BillingManagement from "./pages/admin/BillingManagement";
import PublicContentManager from "./pages/admin/PublicContentManager";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Help from "./pages/Help";
import APIManagement from "./pages/admin/APIManagement";
import CompanyAPIManagement from "./pages/CompanyAPIManagement";

import SocialInbox from "./pages/SocialInbox";
import SocialIntelligence from "./pages/SocialIntelligence";
import Automation from "./pages/Automation";

import ModuleBuilder from "./pages/ModuleBuilder";
import FormBuilder from "./pages/FormBuilder";

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
import ContractManagement from "./pages/ContractManagement";
import { TTSSettings } from "./components/TTSSettings";
import BranchManagement from "./pages/admin/BranchManagement";
import PermissionManagement from "./pages/admin/PermissionManagement";
import CallCenterIntegrations from "./pages/admin/CallCenterIntegrations";
import CallReports from "./pages/CallReports";
import FirewallManagement from "./pages/admin/FirewallManagement";
import LiveChatDashboard from "./pages/admin/LiveChatDashboard";
import LayoutShowcase from "./pages/LayoutShowcase";
import FinancialDocument from "./pages/FinancialDocument";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public routes without layout */}
            <Route path="/" element={<Index />} />
            <Route path="/financial-document" element={<FinancialDocument />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/industry/:slug" element={<Industry />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/company-application" element={<CompanyApplication />} />
            
            {/* Protected routes with enhanced layout */}
            <Route element={<EnhancedLayout />}>
              <Route path="/pending-approval" element={<ProtectedRoute allowUnapproved><PendingApproval /></ProtectedRoute>} />
              <Route path="/force-password" element={<ProtectedRoute allowUnapproved><ForcePasswordChange /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><UnifiedDashboard /></ProtectedRoute>} />
              <Route path="/layout-showcase" element={<ProtectedRoute><LayoutShowcase /></ProtectedRoute>} />
              <Route path="/composer" element={<ProtectedRoute><Composer /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/ad-campaigns" element={<ProtectedRoute><AdCampaigns /></ProtectedRoute>} />
              <Route path="/influencer-marketing" element={<ProtectedRoute><InfluencerMarketing /></ProtectedRoute>} />
              <Route path="/agents" element={<ProtectedRoute requiredRole="agent"><Agents /></ProtectedRoute>} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/companies" element={<ProtectedRoute requiredRole="admin"><CompanyManagement /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/moderation" element={<ProtectedRoute requiredRole="admin"><ContentModeration /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><SystemConfiguration /></ProtectedRoute>} />
              <Route path="/admin/system-config" element={<ProtectedRoute requiredRole="admin"><SystemConfiguration /></ProtectedRoute>} />
              <Route path="/admin/email-settings" element={<ProtectedRoute requiredRole="admin"><EmailSettings /></ProtectedRoute>} />
              <Route path="/admin/social-platforms" element={<ProtectedRoute requiredRole="admin"><SocialPlatformManagement /></ProtectedRoute>} />
              <Route path="/admin/platform-subscriptions" element={<ProtectedRoute requiredRole="admin"><AdminCompanyPlatformSubscriptions /></ProtectedRoute>} />
              <Route path="/admin/reach-analytics" element={<ProtectedRoute requiredRole="admin"><ReachAnalytics /></ProtectedRoute>} />
              <Route path="/admin/landing-page" element={<ProtectedRoute requiredRole="admin"><LandingPageManager /></ProtectedRoute>} />
              <Route path="/admin/industries" element={<ProtectedRoute requiredRole="admin"><IndustryManagement /></ProtectedRoute>} />
              <Route path="/admin/pricing" element={<ProtectedRoute requiredRole="admin"><PricingManagement /></ProtectedRoute>} />
              <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="admin"><SubscriptionManagement /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><PaymentManagement /></ProtectedRoute>} />
              <Route path="/admin/billing" element={<ProtectedRoute requiredRole="admin"><BillingManagement /></ProtectedRoute>} />
              <Route path="/admin/trial-settings" element={<ProtectedRoute requiredRole="admin"><TrialSettings /></ProtectedRoute>} />
              <Route path="/admin/audit-log" element={<ProtectedRoute requiredRole="admin"><AuditLog /></ProtectedRoute>} />
              <Route path="/admin/social-auth" element={<ProtectedRoute requiredRole="admin"><SocialAuthSettings /></ProtectedRoute>} />
              <Route path="/admin/public-content" element={<ProtectedRoute requiredRole="admin"><PublicContentManager /></ProtectedRoute>} />
              <Route path="/admin/api-management" element={<ProtectedRoute requiredRole="admin"><APIManagement /></ProtectedRoute>} />
              <Route path="/admin/branches" element={<ProtectedRoute requiredRole="admin"><BranchManagement /></ProtectedRoute>} />
              <Route path="/admin/permissions" element={<ProtectedRoute requiredRole="admin"><PermissionManagement /></ProtectedRoute>} />
              <Route path="/admin/call-center-integrations" element={<ProtectedRoute requiredRole="admin"><CallCenterIntegrations /></ProtectedRoute>} />
              <Route path="/admin/firewall" element={<ProtectedRoute requiredRole="admin"><FirewallManagement /></ProtectedRoute>} />
              <Route path="/admin/live-chat" element={<ProtectedRoute requiredRole="admin"><LiveChatDashboard /></ProtectedRoute>} />
              <Route path="/admin/platform-oauth-apps" element={<ProtectedRoute requiredRole="admin"><PlatformOAuthApps /></ProtectedRoute>} />
              
              {/* Company routes */}
              <Route path="/company/email-settings" element={<ProtectedRoute><CompanyEmailSettings /></ProtectedRoute>} />
              <Route path="/company/audit-log" element={<ProtectedRoute><CompanyAuditLog /></ProtectedRoute>} />
              <Route path="/company/platform-subscriptions" element={<ProtectedRoute><CompanyPlatformSubscriptions /></ProtectedRoute>} />
              <Route path="/company/api-management" element={<ProtectedRoute><CompanyAPIManagement /></ProtectedRoute>} />
              <Route path="/company/call-center-integrations" element={<ProtectedRoute><CallCenterIntegrations /></ProtectedRoute>} />
              <Route path="/tts-settings" element={<ProtectedRoute><TTSSettings /></ProtectedRoute>} />
              
              {/* AI Features */}
              {/* AI Studio removed */}
              <Route path="/social-inbox" element={<ProtectedRoute><SocialInbox /></ProtectedRoute>} />
              <Route path="/social-intelligence" element={<ProtectedRoute><SocialIntelligence /></ProtectedRoute>} />
              <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
              <Route path="/ai-analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/social-connections" element={<ProtectedRoute><SocialConnections /></ProtectedRoute>} />
              
              {/* Enterprise Builder */}
              <Route path="/module-builder" element={<ProtectedRoute><ModuleBuilder /></ProtectedRoute>} />
              <Route path="/form-builder" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
              <Route path="/workflow-builder" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
              <Route path="/reporting-dashboard" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/crm-roadmap" element={<ProtectedRoute><CRMFeatureStatus /></ProtectedRoute>} />
              
              {/* CRM */}
              <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
              <Route path="/pipeline" element={<ProtectedRoute><SalesPipeline /></ProtectedRoute>} />
              <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/call-reports" element={<ProtectedRoute><CallReports /></ProtectedRoute>} />
              <Route path="/email-marketing" element={<ProtectedRoute><EmailMarketing /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/territory-management" element={<ProtectedRoute><TerritoryManagement /></ProtectedRoute>} />
              <Route path="/customer-support" element={<ProtectedRoute><CustomerSupport /></ProtectedRoute>} />
              <Route path="/call-center" element={<ProtectedRoute><CallCenter /></ProtectedRoute>} />
              <Route path="/project-management" element={<ProtectedRoute><ProjectManagement /></ProtectedRoute>} />
              <Route path="/contract-management" element={<ProtectedRoute><ContractManagement /></ProtectedRoute>} />
              
              {/* Legacy redirects - point to new unified page */}
              <Route path="/social-accounts" element={<ProtectedRoute><SocialConnections /></ProtectedRoute>} />
              <Route path="/social-media-credentials" element={<ProtectedRoute><SocialConnections /></ProtectedRoute>} />
              <Route path="/social-platform-settings" element={<ProtectedRoute><SocialConnections /></ProtectedRoute>} />
            </Route>
            
            {/* 404 catch-all - must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <LiveChat />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
