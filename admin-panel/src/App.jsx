import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Stores from './pages/Stores';
import Appointments from './pages/Appointments';
import Payments from './pages/Payments';
import Orders from './pages/Orders';
import Wallets from './pages/Wallets';
import WithdrawalRequests from './pages/WithdrawalRequests';
import Products from './pages/Products';
import Reviews from './pages/Reviews';
import Employees from './pages/Employees';
import StoreDetail from './pages/StoreDetail';
import Layout from './layouts/Layout';
import { authService } from './services/authService';

function PrivateRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
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
          <Route path="payments" element={<Payments />} />
          <Route path="orders" element={<Orders />} />
          <Route path="wallets" element={<Wallets />} />
          <Route path="withdrawal-requests" element={<WithdrawalRequests />} />
          <Route path="products" element={<Products />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="employees" element={<Employees />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

