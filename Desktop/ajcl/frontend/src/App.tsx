import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { ContactButton } from "@/components/common/ContactButton";

import { MarketingLayout } from "@/components/layouts/MarketingLayout";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { BookLayout } from "@/components/layouts/BookLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { RiderLayout } from "@/components/layouts/RiderLayout";
import { SendLayout } from "@/components/layouts/SendLayout";

import { LandingPage } from "@/pages/LandingPage";
import { ContactPage } from "@/pages/ContactPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { BookPage } from "@/pages/BookPage";
import { PaymentCallbackPage } from "@/pages/PaymentCallbackPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DashboardBookingsPage } from "@/pages/DashboardBookingsPage";
import { BookingDetailPage } from "@/pages/BookingDetailPage";
import { PartnerStatementPage } from "@/pages/PartnerStatementPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminOverviewPage } from "@/pages/AdminOverviewPage";
import { AdminBookingsPage } from "@/pages/AdminBookingsPage";
import { AdminBookingDetailPage } from "@/pages/AdminBookingDetailPage";
import { AdminVehiclesPage } from "@/pages/AdminVehiclesPage";
import { AdminTeamPage } from "@/pages/AdminTeamPage";
import { AdminRidersPage } from "@/pages/AdminRidersPage";
import { AdminPartnersPage } from "@/pages/AdminPartnersPage";
import { AdminPartnerDetailPage } from "@/pages/AdminPartnerDetailPage";
import { RiderLoginPage } from "@/pages/RiderLoginPage";
import { RiderJobsPage } from "@/pages/RiderJobsPage";
import { RiderJobDetailPage } from "@/pages/RiderJobDetailPage";
import { RiderProfilePage } from "@/pages/RiderProfilePage";
import { RiderRoutePage } from "@/pages/RiderRoutePage";
import { SendPage } from "@/pages/SendPage";
import { ShipmentWizardPage } from "@/pages/ShipmentWizardPage";
import { DashboardShipmentsPage } from "@/pages/DashboardShipmentsPage";
import { ShipmentDetailPage } from "@/pages/ShipmentDetailPage";
import { AdminShipmentsPage } from "@/pages/AdminShipmentsPage";
import { AdminShipmentDetailPage } from "@/pages/AdminShipmentDetailPage";
import { AdminShippingPage } from "@/pages/AdminShippingPage";
import { AdminSitePage } from "@/pages/AdminSitePage";
import { AdminBlogPage } from "@/pages/AdminBlogPage";
import { AdminNewShipmentPage } from "@/pages/AdminNewShipmentPage";
import { BlogPage } from "@/pages/BlogPage";
import { BlogPostPage } from "@/pages/BlogPostPage";
import { QuotePage } from "@/pages/QuotePage";
import { ServicesPage } from "@/pages/ServicesPage";
import { AboutPage } from "@/pages/AboutPage";
import { SeaCargoPage } from "@/pages/SeaCargoPage";
import { AirCargoPage } from "@/pages/AirCargoPage";
import { ExpressPage } from "@/pages/ExpressPage";
import { TrackingPage } from "@/pages/TrackingPage";
import { OfflinePage } from "@/pages/OfflinePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="sea-cargo" element={<SeaCargoPage />} />
            <Route path="quote" element={<QuotePage />} />
            <Route path="air-cargo" element={<AirCargoPage />} />
            <Route path="express" element={<ExpressPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<BlogPostPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route path="book" element={<BookLayout />}>
            <Route index element={<BookPage />} />
            <Route path="payment/callback" element={<PaymentCallbackPage />} />
          </Route>

          <Route path="send" element={<SendLayout />}>
            <Route index element={<SendPage />} />
            <Route path=":type" element={<ShipmentWizardPage />} />
          </Route>

          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="bookings" element={<DashboardBookingsPage />} />
            <Route path="bookings/:reference" element={<BookingDetailPage />} />
            <Route path="account" element={<PartnerStatementPage />} />
            <Route path="shipments" element={<DashboardShipmentsPage />} />
            <Route path="shipments/:reference" element={<ShipmentDetailPage />} />
          </Route>

          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="bookings/:reference" element={<AdminBookingDetailPage />} />
            <Route path="riders" element={<AdminRidersPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="partners/:id" element={<AdminPartnerDetailPage />} />
            <Route path="vehicles" element={<AdminVehiclesPage />} />
            <Route path="team" element={<AdminTeamPage />} />
            <Route path="shipments" element={<AdminShipmentsPage />} />
            <Route path="shipments/new" element={<AdminNewShipmentPage />} />
            <Route path="shipments/:reference" element={<AdminShipmentDetailPage />} />
            <Route path="shipping" element={<AdminShippingPage />} />
            <Route path="site" element={<AdminSitePage />} />
            <Route path="blog" element={<AdminBlogPage />} />
          </Route>

          <Route path="rider/login" element={<RiderLoginPage />} />
          <Route path="rider" element={<RiderLayout />}>
            <Route index element={<RiderJobsPage />} />
            <Route path="jobs/:reference" element={<RiderJobDetailPage />} />
            <Route path="route" element={<RiderRoutePage />} />
            <Route path="profile" element={<RiderProfilePage />} />
          </Route>

          <Route path="track/:token" element={<TrackingPage />} />

          <Route path="offline" element={<OfflinePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ContactButton />
        <InstallPrompt />
        <ServiceWorkerRegistrar />
      </ToastProvider>
    </AuthProvider>
  );
}
