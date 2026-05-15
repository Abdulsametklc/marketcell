import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../api/orders';

const MOCK_ORDERS = [
  {
    id: 'ord-001',
    created_at: new Date().toISOString(),
    total_amount: '48597.00',
    payment_status: 'PAID',
    sub_orders: [
      { id: 'sub-001', status: 'PREPARING', store: { name: 'TechStore' } },
      { id: 'sub-002', status: 'PAID', store: { name: 'FashionStore' } },
    ],
  },
  {
    id: 'ord-002',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    total_amount: '12999.00',
    payment_status: 'PAID',
    sub_orders: [
      { id: 'sub-003', status: 'DELIVERED', store: { name: 'TechStore' } },
    ],
  },
];

const STATUS_CONFIG = {
  PAID:      { label: 'Ödendi',        color: 'bg-blue-100 text-blue-700' },
  PREPARING: { label: 'Hazırlanıyor',  color: 'bg-yellow-100 text-yellow-700' },
  SHIPPED:   { label: 'Kargoda',       color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'İptal',         color: 'bg-red-100 text-red-700' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getOrders();
      setOrders(data.results || data);
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-pulse">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">Henüz siparişiniz yok</p>
          <Link to="/" className="text-purple-600 hover:underline text-sm">
            Alışverişe başla
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/order-success/${order.id}`}
              className="border border-gray-200 rounded-xl p-5 hover:border-purple-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sipariş #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <p className="text-base font-bold text-purple-700">
                  ₺{parseFloat(order.total_amount).toLocaleString('tr-TR')}
                </p>
              </div>

              {/* Sub-order durumları */}
              <div className="flex flex-col gap-1.5">
                {order.sub_orders.map(sub => {
                  const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PAID;
                  return (
                    <div key={sub.id} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{sub.store.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}