import { CustomersPage } from "./admin/pages/CustomersPage";
import { ProductsPage as AdminProductsPage } from "./admin/pages/ProductsPage";
import { CategoriesPage } from "./admin/pages/CategoriesPage";
import LoginPage from "./admin/pages/LoginPage";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { ProtectedRoute } from "./admin/components/ProtectedRoute";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminLayout } from "./admin/layouts/AdminLayout";
import { OrdersPage } from "./admin/pages/OrdersPage";
import { ReviewsPage } from "./admin/pages/ReviewsPage";
import { SettingsPage } from "./admin/pages/SettingsPage";
import { ForgotPasswordPage } from "./admin/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./admin/pages/ResetPasswordPage";
import { PaymentPage } from "./pages/PaymentPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import { ShippingPolicyPage } from "./pages/ShippingPolicyPage";
import { ReturnsRefundsPage } from "./pages/ReturnsRefundsPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { LoginPage as CustomerLoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UsersPage } from "./admin/pages/UsersPage";
import { HomepagePage } from "./admin/pages/HomepagePage";
import { AboutPageEditor } from "./admin/pages/AboutPageEditor";
import { ContactPageEditor } from "./admin/pages/ContactPageEditor";
import { RequireCustomer } from "./components/RequireCustomer";
import { AdminAuthLayout } from "./admin/layouts/AdminAuthLayout";
import { InvoicePage } from "./pages/InvoicePage";
import { InvoiceManagementPage } from "./admin/components/InvoiceManagementPage";
import { NavbarFooterPage } from "./admin/pages/NavbarFooterPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AdminAuthLayout />}>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route
            path="/admin/reset-password"
            element={<ResetPasswordPage />}
          />
          <Route path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
  <Route index element={<DashboardPage />} />

  <Route path="homepage" element={<HomepagePage />} />

  <Route
    path="products"
    element={<AdminProductsPage />}
  />

  <Route
    path="orders"
    element={<OrdersPage />}
  />

  <Route
    path="categories"
    element={<CategoriesPage />}
  />

  <Route
    path="customers"
    element={<CustomersPage />}
  />

  <Route path="users" element={<UsersPage />} />

  <Route
    path="reviews"
    element={<ReviewsPage />}
  />

  <Route
    path="settings"
    element={<SettingsPage />}
  />
  <Route
  path="invoice-management"
  element={<InvoiceManagementPage />}
/>
  <Route
  path="navbar-footer"
  element={<NavbarFooterPage />}
/>
  <Route
  path="about-page"
  element={<AboutPageEditor />}
/>
<Route
  path="contact-page"
  element={<ContactPageEditor />}
/>
  </Route>
        </Route>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="login" element={<CustomerLoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route
              path="profile"
              element={
                <RequireCustomer>
                  <ProfilePage />
                </RequireCustomer>
              }
            />
            <Route path="product/:slug" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="order-success/:orderNumber" element={<OrderSuccessPage />} />
            <Route
              path="my-orders"
              element={
                <RequireCustomer>
                  <MyOrdersPage />
                </RequireCustomer>
              }
            />
            <Route
  path="invoice/:orderNumber"
  element={
    <RequireCustomer>
      <InvoicePage />
    </RequireCustomer>
  }
/>
            <Route
            path="track-order/:orderNumber"
            element={<OrderTrackingPage />}
            />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route
            path="shipping-policy"
            element={<ShippingPolicyPage />}
            />
            <Route
            path="returns-refunds"
            element={<ReturnsRefundsPage />}
            />
            <Route
            path="terms"
            element={<TermsPage />}
            />
            <Route
            path="privacy-policy"
            element={<PrivacyPolicyPage />}
            />
        </Route>
      </Routes>
    </Router>
  );}
export default App;