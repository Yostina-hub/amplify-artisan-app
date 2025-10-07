import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Core pages - loaded immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load all other pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const DashboardRedirect = lazy(() => import("./components/DashboardRedirect").then(m => ({ default: m.DashboardRedirect })));
const Composer = lazy(() => import("./pages/Composer"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const Settings = lazy(() => import("./pages/Settings"));
const Agents = lazy(() => import("./pages/Agents"));
const BrandMonitoring = lazy(() => import("./pages/BrandMonitoring"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const CompanyApplication = lazy(() => import("./pages/CompanyApplication"));
const CompanyEmailSettings = lazy(() => import("./pages/CompanyEmailSettings"));
const AdCampaigns = lazy(() => import("./pages/AdCampaigns"));
const SocialListening = lazy(() => import("./pages/SocialListening"));
const InfluencerMarketing = lazy(() => import("./pages/InfluencerMarketing"));
const SocialMediaCredentials = lazy(() => import("./pages/SocialMediaCredentials"));
const CompanyPlatformSettings = lazy(() => import("./pages/PlatformConfigs"));
const CompanyPlatformSubscriptions = lazy(() => import("./pages/CompanyPlatformSubscriptions"));
const ForcePasswordChange = lazy(() => import("./pages/ForcePasswordChange"));
const Industry = lazy(() => import("./pages/Industry"));
const CompanyAuditLog = lazy(() => import("./pages/CompanyAuditLog"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Help = lazy(() => import("./pages/Help"));
const CompanyAPIManagement = lazy(() => import("./pages/CompanyAPIManagement"));
const AIStudio = lazy(() => import("./pages/AIStudio"));
const SocialInbox = lazy(() => import("./pages/SocialInbox"));
const SocialIntelligence = lazy(() => import("./pages/SocialIntelligence"));
const Automation = lazy(() => import("./pages/Automation"));
const AIAnalytics = lazy(() => import("./pages/AIAnalytics"));
const ModuleBuilder = lazy(() => import("./pages/ModuleBuilder"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));
const WorkflowBuilder = lazy(() => import("./pages/WorkflowBuilder"));
const ReportingDashboard = lazy(() => import("./pages/ReportingDashboard"));
const CRMFeatureStatus = lazy(() => import("./pages/CRMFeatureStatus"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Leads = lazy(() => import("./pages/Leads"));
const SalesPipeline = lazy(() => import("./pages/SalesPipeline"));
const Activities = lazy(() => import("./pages/Activities"));
const Products = lazy(() => import("./pages/Products"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Reports = lazy(() => import("./pages/Reports"));
const EmailMarketing = lazy(() => import("./pages/EmailMarketing"));
const Documents = lazy(() => import("./pages/Documents"));
const Payments = lazy(() => import("./pages/Payments"));
const TerritoryManagement = lazy(() => import("./pages/TerritoryManagement"));
const CustomerSupport = lazy(() => import("./pages/CustomerSupport"));
const CallCenter = lazy(() => import("./pages/CallCenter"));
const ProjectManagement = lazy(() => import("./pages/ProjectManagement"));
const ContractManagement = lazy(() => import("./pages/ContractManagement"));
const TTSSettings = lazy(() => import("./pages/TTSSettings"));
const CallReports = lazy(() => import("./pages/CallReports"));
const CallScripts = lazy(() => import("./pages/CallScripts"));
const ProposalGenerator = lazy(() => import("./pages/ProposalGenerator"));
const CustomerHealthScore = lazy(() => import("./pages/CustomerHealthScore"));
const DealIntelligence = lazy(() => import("./pages/DealIntelligence"));
const RelationshipMap = lazy(() => import("./pages/RelationshipMap"));
const VideoProspecting = lazy(() => import("./pages/VideoProspecting"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ContentModeration = lazy(() => import("./pages/admin/ContentModeration"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const EmailSettings = lazy(() => import("./pages/admin/EmailSettings"));
const CompanyManagement = lazy(() => import("./pages/admin/CompanyManagement"));
const SocialPlatformManagement = lazy(() => import("./pages/admin/SocialPlatformManagement"));
const AdminCompanyPlatformSubscriptions = lazy(() => import("./pages/admin/CompanyPlatformSubscriptions"));
const ReachAnalytics = lazy(() => import("./pages/admin/ReachAnalytics"));
const LandingPageManager = lazy(() => import("./pages/admin/LandingPageManager"));
const IndustryManagement = lazy(() => import("./pages/admin/IndustryManagement"));
const PricingManagement = lazy(() => import("./pages/admin/PricingManagement"));
const SubscriptionManagement = lazy(() => import("./pages/admin/SubscriptionManagement"));
const TrialSettings = lazy(() => import("./pages/admin/TrialSettings"));
const AuditLog = lazy(() => import("./pages/admin/AuditLog"));
const SocialAuthSettings = lazy(() => import("./pages/admin/SocialAuthSettings"));
const PaymentManagement = lazy(() => import("./pages/admin/PaymentManagement"));
const PublicContentManager = lazy(() => import("./pages/admin/PublicContentManager"));
const APIManagement = lazy(() => import("./pages/admin/APIManagement"));
const BranchManagement = lazy(() => import("./pages/admin/BranchManagement"));
const PermissionManagement = lazy(() => import("./pages/admin/PermissionManagement"));
const CallCenterIntegrations = lazy(() => import("./pages/admin/CallCenterIntegrations"));
const FirewallManagement = lazy(() => import("./pages/admin/FirewallManagement"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes without layout */}
              <Route path="/" element={<Index />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/industry/:slug" element={<Industry />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/company-application" element={<CompanyApplication />} />
              <Route path="*" element={<NotFound />} />

              {/* Protected routes with shared layout */}
              <Route element={<Layout />}>
                <Route path="/pending-approval" element={<ProtectedRoute allowUnapproved><PendingApproval /></ProtectedRoute>} />
                <Route path="/force-password" element={<ProtectedRoute allowUnapproved><ForcePasswordChange /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
                <Route path="/company-dashboard" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />
                <Route path="/user-dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/composer" element={<ProtectedRoute><Composer /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/ad-campaigns" element={<ProtectedRoute><AdCampaigns /></ProtectedRoute>} />
                <Route path="/influencer-marketing" element={<ProtectedRoute><InfluencerMarketing /></ProtectedRoute>} />
                <Route path="/brand-monitoring" element={<ProtectedRoute><BrandMonitoring /></ProtectedRoute>} />
                <Route path="/social-listening" element={<ProtectedRoute><SocialListening /></ProtectedRoute>} />
                <Route path="/agents" element={<ProtectedRoute requiredRole="agent"><Agents /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/companies" element={<ProtectedRoute requiredRole="admin"><CompanyManagement /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/moderation" element={<ProtectedRoute requiredRole="admin"><ContentModeration /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><SystemSettings /></ProtectedRoute>} />
                <Route path="/admin/email-settings" element={<ProtectedRoute requiredRole="admin"><EmailSettings /></ProtectedRoute>} />
                <Route path="/admin/social-platforms" element={<ProtectedRoute requiredRole="admin"><SocialPlatformManagement /></ProtectedRoute>} />
                <Route path="/admin/platform-subscriptions" element={<ProtectedRoute requiredRole="admin"><AdminCompanyPlatformSubscriptions /></ProtectedRoute>} />
                <Route path="/admin/reach-analytics" element={<ProtectedRoute requiredRole="admin"><ReachAnalytics /></ProtectedRoute>} />
                <Route path="/admin/landing-page" element={<ProtectedRoute requiredRole="admin"><LandingPageManager /></ProtectedRoute>} />
                <Route path="/admin/industries" element={<ProtectedRoute requiredRole="admin"><IndustryManagement /></ProtectedRoute>} />
                <Route path="/admin/pricing" element={<ProtectedRoute requiredRole="admin"><PricingManagement /></ProtectedRoute>} />
                <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="admin"><SubscriptionManagement /></ProtectedRoute>} />
                <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><PaymentManagement /></ProtectedRoute>} />
                <Route path="/admin/trial-settings" element={<ProtectedRoute requiredRole="admin"><TrialSettings /></ProtectedRoute>} />
                <Route path="/admin/audit-log" element={<ProtectedRoute requiredRole="admin"><AuditLog /></ProtectedRoute>} />
                <Route path="/admin/social-auth" element={<ProtectedRoute requiredRole="admin"><SocialAuthSettings /></ProtectedRoute>} />
                <Route path="/admin/public-content" element={<ProtectedRoute requiredRole="admin"><PublicContentManager /></ProtectedRoute>} />
                <Route path="/admin/api-management" element={<ProtectedRoute requiredRole="admin"><APIManagement /></ProtectedRoute>} />
                <Route path="/admin/branches" element={<ProtectedRoute requiredRole="admin"><BranchManagement /></ProtectedRoute>} />
                <Route path="/admin/permissions" element={<ProtectedRoute requiredRole="admin"><PermissionManagement /></ProtectedRoute>} />
                <Route path="/admin/call-center-integrations" element={<ProtectedRoute requiredRole="admin"><CallCenterIntegrations /></ProtectedRoute>} />
                <Route path="/admin/firewall" element={<ProtectedRoute requiredRole="admin"><FirewallManagement /></ProtectedRoute>} />

                {/* Company routes */}
                <Route path="/company/email-settings" element={<ProtectedRoute><CompanyEmailSettings /></ProtectedRoute>} />
                <Route path="/company/audit-log" element={<ProtectedRoute><CompanyAuditLog /></ProtectedRoute>} />
                <Route path="/company/platform-subscriptions" element={<ProtectedRoute><CompanyPlatformSubscriptions /></ProtectedRoute>} />
                <Route path="/company/platform-settings" element={<ProtectedRoute><CompanyPlatformSettings /></ProtectedRoute>} />
                <Route path="/company/api-management" element={<ProtectedRoute><CompanyAPIManagement /></ProtectedRoute>} />
                <Route path="/company/call-center-integrations" element={<ProtectedRoute><CallCenterIntegrations /></ProtectedRoute>} />
                <Route path="/tts-settings" element={<ProtectedRoute><TTSSettings /></ProtectedRoute>} />

                {/* AI Features */}
                <Route path="/ai-studio" element={<ProtectedRoute><AIStudio /></ProtectedRoute>} />
                <Route path="/social-inbox" element={<ProtectedRoute><SocialInbox /></ProtectedRoute>} />
                <Route path="/social-intelligence" element={<ProtectedRoute><SocialIntelligence /></ProtectedRoute>} />
                <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
                <Route path="/ai-analytics" element={<ProtectedRoute><AIAnalytics /></ProtectedRoute>} />
                <Route path="/social-media-credentials" element={<ProtectedRoute><SocialMediaCredentials /></ProtectedRoute>} />

                {/* Enterprise Builder */}
                <Route path="/module-builder" element={<ProtectedRoute><ModuleBuilder /></ProtectedRoute>} />
                <Route path="/form-builder" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
                <Route path="/workflow-builder" element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} />
                <Route path="/reporting-dashboard" element={<ProtectedRoute><ReportingDashboard /></ProtectedRoute>} />
                <Route path="/crm-roadmap" element={<ProtectedRoute><CRMFeatureStatus /></ProtectedRoute>} />

                {/* CRM */}
                <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/pipeline" element={<ProtectedRoute><SalesPipeline /></ProtectedRoute>} />
                <Route path="/deal-intelligence" element={<ProtectedRoute><DealIntelligence /></ProtectedRoute>} />
                <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
                <Route path="/proposal-generator" element={<ProtectedRoute><ProposalGenerator /></ProtectedRoute>} />
                <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/call-reports" element={<ProtectedRoute><CallReports /></ProtectedRoute>} />
                <Route path="/call-scripts" element={<ProtectedRoute><CallScripts /></ProtectedRoute>} />
                <Route path="/email-marketing" element={<ProtectedRoute><EmailMarketing /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/territory-management" element={<ProtectedRoute><TerritoryManagement /></ProtectedRoute>} />
                <Route path="/customer-support" element={<ProtectedRoute><CustomerSupport /></ProtectedRoute>} />
                <Route path="/customer-health" element={<ProtectedRoute><CustomerHealthScore /></ProtectedRoute>} />
                <Route path="/relationship-map" element={<ProtectedRoute><RelationshipMap /></ProtectedRoute>} />
                <Route path="/video-prospecting" element={<ProtectedRoute><VideoProspecting /></ProtectedRoute>} />
                <Route path="/call-center" element={<ProtectedRoute><CallCenter /></ProtectedRoute>} />
                <Route path="/project-management" element={<ProtectedRoute><ProjectManagement /></ProtectedRoute>} />
                <Route path="/contract-management" element={<ProtectedRoute><ContractManagement /></ProtectedRoute>} />

                <Route path="/social-accounts" element={<ProtectedRoute><SocialMediaCredentials /></ProtectedRoute>} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
