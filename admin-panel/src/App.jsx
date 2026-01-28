import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Stores from './pages/Stores';
import Appointments from './pages/Appointments';
import QuickAppointments from './pages/QuickAppointments';
import Payments from './pages/Payments';
import PaymentMethods from './pages/PaymentMethods';
import Orders from './pages/Orders';
import Wallets from './pages/Wallets';
import IsletKazan from './pages/IsletKazan';
import WithdrawalRequests from './pages/WithdrawalRequests';
import Products from './pages/Products';
import Baskets from './pages/Baskets';
import Favorites from './pages/Favorites';
import Reviews from './pages/Reviews';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Campaigns from './pages/Campaigns';
import Coupons from './pages/Coupons';
import BakimlaStoreCoupons from './pages/BakimlaStoreCoupons';
import UserCampaigns from './pages/UserCampaigns';
import UserCoupons from './pages/UserCoupons';
import UserFavoriteStores from './pages/UserFavoriteStores';
import Addresses from './pages/Addresses';
import Notifications from './pages/Notifications';
import Services from './pages/Services';
import Invoices from './pages/Invoices';
import Points from './pages/Points';
import Rewards from './pages/Rewards';
import Accounting from './pages/Accounting';
import Forms from './pages/Forms';
import BusinessHomeAds from './pages/BusinessHomeAds';
import ClientHomeAds from './pages/ClientHomeAds';
import ClientCenterAds from './pages/ClientCenterAds';
import WalletTransactions from './pages/WalletTransactions';
import OTPs from './pages/OTPs';
import StoreDetail from './pages/StoreDetail';
import Layout from './layouts/Layout';
import { authService } from './services/authService';
import { Toaster } from 'react-hot-toast';

function PrivateRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="stores" element={<Stores />} />
          <Route path="stores/:storeId" element={<StoreDetail />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="quick-appointments" element={<QuickAppointments />} />
          <Route path="payments" element={<Payments />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="orders" element={<Orders />} />
          <Route path="wallets" element={<Wallets />} />
          <Route path="islet-kazan" element={<IsletKazan />} />
          <Route path="withdrawal-requests" element={<WithdrawalRequests />} />
          <Route path="products" element={<Products />} />
          <Route path="baskets" element={<Baskets />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="employees" element={<Employees />} />
          <Route path="customers" element={<Customers />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="bakimla-store-coupons" element={<BakimlaStoreCoupons />} />
          <Route path="user-campaigns" element={<UserCampaigns />} />
          <Route path="user-coupons" element={<UserCoupons />} />
          <Route path="user-favorite-stores" element={<UserFavoriteStores />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="services" element={<Services />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="points" element={<Points />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="forms" element={<Forms />} />
          <Route path="business-home-ads" element={<BusinessHomeAds />} />
          <Route path="client-home-ads" element={<ClientHomeAds />} />
          <Route path="client-center-ads" element={<ClientCenterAds />} />
          <Route path="wallet-transactions" element={<WalletTransactions />} />
          <Route path="otps" element={<OTPs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

