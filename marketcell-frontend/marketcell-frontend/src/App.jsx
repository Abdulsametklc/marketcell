import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import SellerProducts from './pages/seller/SellerProducts';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import SellerOrders from './pages/seller/SellerOrders';
import AdminPanel from './pages/admin/AdminPanel';
import Addresses from './pages/Addresses';

const ProtectedRoute = ({ children, role }) => {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (role === 'seller' && !user?.is_seller) return <Navigate to="/" />;
  if (role === 'admin' && !user?.is_admin) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <Router>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          
          <Route path="/"                  element={<Products />} />
          <Route path="/products/:id"      element={<ProductDetail />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/cart"              element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout"          element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
          <Route path="/orders"            element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/seller/orders"     element={<ProtectedRoute role="seller"><SellerOrders /></ProtectedRoute>} />
          <Route path="/seller/products" element={<ProtectedRoute role="seller"><SellerProducts /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
        </Routes>
      </main>
    </Router>
  );
}