import { useState, useEffect } from 'react';
import { getSellerOrders, updateOrderStatus, getSellerStats } from '../../api/seller';

const MOCK_STATS = {
  today_orders: 3,
  today_revenue: '48597.00',
  week_orders: 12,
  week_revenue: '187450.00',
};

const MOCK_ORDERS = [
  {
    id: 'sub-001',
    status: 'PAID',
    subtotal: '45999.00',
    created_at: new Date().toISOString(),
    order: { id: 'ord-001', buyer: { name: 'Ahmet Yılmaz', gsm_number: '905551234567' } },
    items: [
      { id: 'oi1', quantity: 1, unit_price: '45999.00', variant: { value: 'Siyah Titanyum', variant_type: 'color', product: { name: 'iPhone 15 Pro' } } },
    ],
  },
  {
    id: 'sub-002',
    status: 'PREPARING',
    subtotal: '2598.00',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    order: { id: 'ord-002', buyer: { name: 'Ayşe Kaya', gsm_number: '905559876543' } },
    items: [
      { id: 'oi2', quantity: 2, unit_price: '1299.00', variant: { value: 'M', variant_type: 'size', product: { name: "Levi's 501 Jean" } } },
    ],
  },
  {
    id: 'sub-003',
    status: 'SHIPPED',
    subtotal: '12999.00',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    order: { id: 'ord-003', buyer: { name: 'Mehmet Demir', gsm_number: '905553334455' } },
    items: [
      { id: 'oi3', quantity: 1, unit_price: '12999.00', variant: { value: 'Uzay Grisi', variant_type: 'color', product: { name: 'AirPods Pro' } } },
    ],
  },
  {
    id: 'sub-004',
    status: 'DELIVERED',
    subtotal: '38999.00',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    order: { id: 'ord-004', buyer: { name: 'Zeynep Şahin', gsm_number: '905557778899' } },
    items: [
      { id: 'oi4', quantity: 1, unit_price: '38999.00', variant: { value: 'Phantom Black', variant_type: 'color', product: { name: 'Samsung Galaxy S24' } } },
    ],
  },
];

const STATUS_CONFIG = {
  PAID:      { label: 'Ödendi',        color: 'bg-blue-100 text-blue-700',    next: 'PREPARING', nextLabel: 'Hazırlamaya Başla' },
  PREPARING: { label: 'Hazırlanıyor',  color: 'bg-yellow-100 text-yellow-700', next: 'SHIPPED',   nextLabel: 'Kargoya Ver' },
  SHIPPED:   { label: 'Kargoda',       color: 'bg-purple-100 text-purple-700', next: null,        nextLabel: null },
  DELIVERED: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700',   next: null,        nextLabel: null },
  CANCELLED: { label: 'İptal',         color: 'bg-red-100 text-red-700',       next: null,        nextLabel: null },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'PAID', label: 'Ödendi' },
  { value: 'PREPARING', label: 'Hazırlanıyor' },
  { value: 'SHIPPED', label: 'Kargoda' },
  { value: 'DELIVERED', label: 'Teslim Edildi' },
];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersRes = await getSellerOrders();
      setOrders(ordersRes.data.results || ordersRes.data);
    } catch {
      setOrders([]);
    }
    try {
      const statsRes = await getSellerStats();
      setStats(statsRes.data);
    } catch {
      setStats(MOCK_STATS);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (subOrderId, newStatus) => {
    setUpdatingId(subOrderId);
    try {
      await updateOrderStatus(subOrderId, newStatus);
    } catch {
      // mock modda devam et
    } finally {
      setOrders(prev =>
        prev.map(o => o.id === subOrderId ? { ...o, status: newStatus } : o)
      );
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o =>
    statusFilter === '' || o.status === statusFilter
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Satıcı Paneli</h1>

      {/* İstatistik kartları */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Bugünkü Sipariş</p>
            <p className="text-2xl font-bold text-gray-900">{stats.today_orders}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Bugünkü Gelir</p>
            <p className="text-2xl font-bold text-purple-700">
              ₺{parseFloat(stats.today_revenue).toLocaleString('tr-TR')}
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Haftalık Sipariş</p>
            <p className="text-2xl font-bold text-gray-900">{stats.week_orders}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Haftalık Gelir</p>
            <p className="text-2xl font-bold text-purple-700">
              ₺{parseFloat(stats.week_revenue).toLocaleString('tr-TR')}
            </p>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="flex items-center gap-3 mb-5">
        <p className="text-sm font-medium text-gray-700">Durum:</p>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                statusFilter === opt.value
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-gray-300 text-gray-600 hover:border-purple-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 ml-auto">{filteredOrders.length} sipariş</p>
      </div>

      {/* Sipariş listesi */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>Bu filtrede sipariş bulunamadı</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PAID;
            const isExpanded = expandedId === order.id;
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className={`border border-gray-200 rounded-xl overflow-hidden transition-all ${
                  isUpdating ? 'opacity-60' : ''
                }`}
              >
                {/* Sipariş satırı */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900">
                        #{order.order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {order.order.buyer.name} ·{' '}
                      {new Date(order.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-purple-700">
                    ₺{parseFloat(order.subtotal).toLocaleString('tr-TR')}
                  </p>

                  {/* Durum güncelleme butonu */}
                  {status.next && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, status.next);
                      }}
                      disabled={isUpdating}
                      className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isUpdating ? '...' : status.nextLabel}
                    </button>
                  )}

                  <span className="text-gray-400 text-xs ml-1">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Detay — genişletince görünür */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-3">Sipariş Detayı</p>
                    <div className="flex flex-col gap-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-900">{item.variant.product.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.variant.variant_type === 'color' ? 'Renk' : 'Beden'}: {item.variant.value} · Adet: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            ₺{(parseFloat(item.unit_price) * item.quantity).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      Alıcı: {order.order.buyer.name} · {order.order.buyer.gsm_number}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}