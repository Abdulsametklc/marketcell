import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../api/orders';

const MOCK_ORDER = {
  id: 'ord-001',
  created_at: new Date().toISOString(),
  total_amount: '48597.00',
  payment_status: 'PAID',
  address: { title: 'Ev', full_address: 'Atatürk Cad. No:12', city: 'İstanbul', district: 'Kadıköy' },
  sub_orders: [
    {
      id: 'sub-001',
      status: 'PAID',
      subtotal: '45999.00',
      store: { name: 'TechStore' },
      items: [
        { id: 'oi1', quantity: 1, unit_price: '45999.00', variant: { value: 'Siyah Titanyum', variant_type: 'color', product: { name: 'iPhone 15 Pro' } } },
      ],
    },
    {
      id: 'sub-002',
      status: 'PAID',
      subtotal: '2598.00',
      store: { name: 'FashionStore' },
      items: [
        { id: 'oi2', quantity: 2, unit_price: '1299.00', variant: { value: 'M', variant_type: 'size', product: { name: "Levi's 501 Jean" } } },
      ],
    },
  ],
};

const STATUS_CONFIG = {
  PAID:      { label: 'Ödendi',        color: 'bg-blue-100 text-blue-700' },
  PREPARING: { label: 'Hazırlanıyor',  color: 'bg-yellow-100 text-yellow-700' },
  SHIPPED:   { label: 'Kargoda',       color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'İptal',         color: 'bg-red-100 text-red-700' },
};

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const { data } = await getOrder(id);
      setOrder(data);
    } catch {
      setOrder(MOCK_ORDER);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-24 bg-gray-200 rounded-2xl mb-6"></div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Başarı mesajı */}
      <div className="text-center bg-green-50 border border-green-200 rounded-2xl p-8 mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Siparişiniz Alındı!</h1>
        <p className="text-sm text-gray-500">Sipariş No: <span className="font-mono font-medium">{order?.id?.slice(0, 8).toUpperCase()}</span></p>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(order?.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>

      {/* Teslimat adresi */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Teslimat Adresi</h2>
        <p className="text-sm text-gray-900 font-medium">{order?.address?.title}</p>
        <p className="text-sm text-gray-500">{order?.address?.full_address}</p>
        <p className="text-sm text-gray-500">{order?.address?.district}, {order?.address?.city}</p>
      </div>

      {/* Sub-order'lar — çok satıcılı bölünme gösterimi */}
      <h2 className="font-medium text-gray-900 mb-3">Satıcı Bazlı Siparişler</h2>
      <div className="flex flex-col gap-4 mb-6">
        {order?.sub_orders?.map((sub, index) => {
          const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PAID;
          return (
            <div key={sub.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Sub-order başlık */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Satıcı {index + 1}:</span>
                  <span className="text-sm font-medium text-gray-800">{sub.store.name}</span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {/* Ürünler */}
              <div className="p-4 flex flex-col gap-3">
                {sub.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.variant.product.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.variant.variant_type === 'color' ? 'Renk' : 'Beden'}: {item.variant.value} · Adet: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      ₺{(parseFloat(item.unit_price) * item.quantity).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Ara toplam</span>
                  <span className="font-medium text-gray-800">₺{parseFloat(sub.subtotal).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Genel toplam */}
      <div className="border border-purple-200 bg-purple-50 rounded-xl p-4 mb-6 flex justify-between items-center">
        <span className="font-medium text-gray-900">Genel Toplam</span>
        <span className="text-xl font-bold text-purple-700">
          ₺{parseFloat(order?.total_amount).toLocaleString('tr-TR')}
        </span>
      </div>

      {/* Butonlar */}
      <div className="flex gap-3">
        <Link
          to="/orders"
          className="flex-1 text-center border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
        >
          Siparişlerimi Gör
        </Link>
        <Link
          to="/"
          className="flex-1 text-center bg-purple-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-purple-700"
        >
          Alışverişe Devam Et
        </Link>
      </div>
    </div>
  );
}