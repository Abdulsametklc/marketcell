import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link to="/" className="font-semibold text-lg text-purple-700">
          MarketCell
        </Link>

        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
          Ürünler
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {user?.is_seller && (
                <Link
                  to="/seller/orders"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Satıcı Paneli
                </Link>
              )}

              {user?.is_admin && (
                <Link
                  to="/admin"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Admin
                </Link>
              )}

              <Link
                to="/addresses"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Adreslerim
              </Link>

              <Link
                to="/orders"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Siparişlerim
              </Link>

              <Link
                to="/cart"
                className="relative text-sm text-gray-600 hover:text-gray-900"
              >
                Sepet

                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Giriş
              </Link>

              <Link
                to="/register"
                className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}