import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { getNotifications, markNotificationsRead } from '../api/orders';

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchNotifs = async () => {
      try {
        const { data } = await getNotifications();
        setUnreadCount(data.unread_count);
        setNotifications(data.notifications);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpenNotifs = async () => {
    setShowNotifs(v => !v);
    if (unreadCount > 0) {
      try { await markNotificationsRead(); setUnreadCount(0); } catch {}
    }
  };

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

              {/* Bildirim zili */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleOpenNotifs}
                  className="relative text-sm text-gray-600 hover:text-gray-900 p-1"
                  title="Bildirimler"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-8 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <p className="text-xs font-medium text-gray-500 px-4 py-2 border-b border-gray-100">Bildirimler</p>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Bildirim yok</p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => { if (n.order_id) navigate(`/order-success/${n.order_id}`); setShowNotifs(false); }}
                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-purple-50' : ''}`}
                          >
                            <p className="text-sm text-gray-800">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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