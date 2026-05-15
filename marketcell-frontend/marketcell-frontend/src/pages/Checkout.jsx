import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart } from '../api/cart';
import { getAddresses, createAddress, createOrder, validateCoupon } from '../api/orders';
import { useCartStore } from '../store/cartStore';

const MOCK_ADDRESSES = [
  { id: 'a1', title: 'Ev', full_address: 'Atatürk Cad. No:12 Daire:3', city: 'İstanbul', district: 'Kadıköy', is_default: true },
  { id: 'a2', title: 'İş', full_address: 'Bağdat Cad. No:45 Kat:2', city: 'İstanbul', district: 'Maltepe', is_default: false },
];

const MOCK_CART = {
  items: [
    {
      id: 'ci1', quantity: 1,
      variant: {
        price_diff: '0',
        product: { name: 'iPhone 15 Pro', base_price: '45999.00', store: { name: 'TechStore' } },
      },
    },
    {
      id: 'ci2', quantity: 2,
      variant: {
        price_diff: '0',
        product: { name: "Levi's 501 Jean", base_price: '1299.00', store: { name: 'FashionStore' } },
      },
    },
  ],
};

export default function Checkout() {
  const navigate = useNavigate();
  const { setItemCount } = useCartStore();

  const [addresses, setAddresses] = useState([]);
  const [cart, setCart] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: '', full_address: '', city: '', district: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [addrRes, cartRes] = await Promise.all([getAddresses(), getCart()]);
      const addrs = addrRes.data.results || addrRes.data;
      setAddresses(addrs);
      setCart(cartRes.data);
      const def = addrs.find(a => a.is_default) || addrs[0];
      if (def) setSelectedAddress(def.id);
    } catch {
      setAddresses(MOCK_ADDRESSES);
      setCart(MOCK_CART);
      setSelectedAddress(MOCK_ADDRESSES[0].id);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.title || !newAddress.full_address || !newAddress.city || !newAddress.district) {
      return setError('Tüm adres alanlarını doldurun');
    }
    try {
      const { data } = await createAddress(newAddress);
      setAddresses(prev => [...prev, data]);
      setSelectedAddress(data.id);
    } catch {
      const mock = { ...newAddress, id: 'a' + Date.now(), is_default: false };
      setAddresses(prev => [...prev, mock]);
      setSelectedAddress(mock.id);
    }
    setShowNewAddress(false);
    setNewAddress({ title: '', full_address: '', city: '', district: '' });
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (!selectedAddress) return setError('Lütfen bir adres seçin');
    if (!cardNumber || cardNumber.length < 16) return setError('Geçerli bir kart numarası girin');
    if (!cardNumber.startsWith('4242') && !cardNumber.startsWith('4000')) {
      return setError('Test kartı girin: 4242... (başarılı) veya 4000... (başarısız)');
    }

    setPlacing(true);
    try {
      const { data } = await createOrder(selectedAddress, cardNumber, couponInfo ? couponCode : '');
      setItemCount(0);
      navigate(`/order-success/${data.id}`);
    } catch (err) {
      if (cardNumber.startsWith('4000')) {
        setError('Ödeme başarısız! Kart reddedildi.');
      } else {
        setError(err.response?.data?.message || 'Sipariş oluşturulamadı');
      }
    } finally {
      setPlacing(false);
    }
  };

  const getItemPrice = (item) => {
    const base = parseFloat(item.variant.product.base_price);
    const diff = parseFloat(item.variant.price_diff || 0);
    return (base + diff) * item.quantity;
  };

  const getTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + getItemPrice(item), 0);
  };

  const handleValidateCoupon = async () => {
    setCouponError('');
    setCouponInfo(null);
    if (!couponCode) return;
    try {
      const { data } = await validateCoupon(couponCode.toUpperCase());
      setCouponInfo(data);
    } catch (err) {
      setCouponError(err.response?.data?.detail || 'Geçersiz kupon');
    }
  };

  const getDiscount = () => {
    if (!couponInfo || !cart?.total) return 0;
    if (couponInfo.discount_type === 'FIXED') return parseFloat(couponInfo.discount_value);
    return (getTotal() * parseFloat(couponInfo.discount_value)) / 100;
  };

  const cardHint = () => {
    if (cardNumber.startsWith('4242')) return { text: '✓ Ödeme başarılı olacak', color: 'text-green-600' };
    if (cardNumber.startsWith('4000')) return { text: '✗ Ödeme başarısız olacak', color: 'text-red-500' };
    return null;
  };

  const formatCard = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
        <div className="flex gap-6">
          <div className="flex-1 h-64 bg-gray-200 rounded-xl"></div>
          <div className="w-72 h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Ödeme</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sol — adres + kart */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Adres seçimi */}
          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="font-medium text-gray-900 mb-4">Teslimat Adresi</h2>

            <div className="flex flex-col gap-3 mb-4">
              {addresses.map(addr => (
                <label
                  key={addr.id}
                  className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedAddress === addr.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-0.5 accent-purple-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {addr.title}
                      {addr.is_default && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          Varsayılan
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{addr.full_address}</p>
                    <p className="text-xs text-gray-500">{addr.district}, {addr.city}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Yeni adres */}
            {!showNewAddress ? (
              <button
                onClick={() => setShowNewAddress(true)}
                className="text-sm text-purple-600 hover:underline"
              >
                + Yeni adres ekle
              </button>
            ) : (
              <form onSubmit={handleAddAddress} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-700">Yeni Adres</p>
                <input
                  type="text"
                  placeholder="Adres başlığı (Ev, İş...)"
                  value={newAddress.title}
                  onChange={(e) => setNewAddress(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Açık adres"
                  value={newAddress.full_address}
                  onChange={(e) => setNewAddress(p => ({ ...p, full_address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="İlçe"
                    value={newAddress.district}
                    onChange={(e) => setNewAddress(p => ({ ...p, district: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Şehir"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress(p => ({ ...p, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-purple-700"
                  >
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                  >
                    İptal
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Kupon kodu */}
          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="font-medium text-gray-900 mb-3">İndirim Kodu</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="TURKCELL10"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponInfo(null); setCouponError(''); }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <button
                type="button"
                onClick={handleValidateCoupon}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900"
              >
                Uygula
              </button>
            </div>
            {couponInfo && (
              <p className="text-green-600 text-sm mt-2">
                ✓ {couponInfo.discount_type === 'PERCENTAGE'
                  ? `%${couponInfo.discount_value} indirim uygulandı`
                  : `₺${couponInfo.discount_value} indirim uygulandı`}
              </p>
            )}
            {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
            <p className="text-xs text-gray-400 mt-2">Test kodları: TURKCELL10, MARKETCELL500</p>
          </div>

          {/* Paycell kart */}
          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="font-medium text-gray-900 mb-1">Paycell ile Ödeme</h2>
            <p className="text-xs text-gray-400 mb-4">
              Test: 4242 4242 4242 4242 (başarılı) · 4000 0000 0000 0000 (başarısız)
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kart Numarası
              </label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                value={formatCard(cardNumber)}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                maxLength={19}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono tracking-widest"
              />
              {cardHint() && (
                <p className={`text-xs mt-1 ${cardHint().color}`}>{cardHint().text}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* Sağ — sipariş özeti */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="border border-gray-200 rounded-xl p-5 sticky top-20">
            <h2 className="font-medium text-gray-900 mb-4">Sipariş Özeti</h2>

            <div className="flex flex-col gap-2 mb-4">
              {cart?.items?.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 line-clamp-1 flex-1 mr-2">
                    {item.variant.product.name} x{item.quantity}
                  </span>
                  <span className="text-gray-700 flex-shrink-0">
                    ₺{getItemPrice(item).toLocaleString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 mb-5">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Ara Toplam</span>
                <span>₺{getTotal().toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Kargo</span>
                <span className="text-green-600">Ücretsiz</span>
              </div>
              {couponInfo && (
                <div className="flex justify-between text-sm text-green-600 mb-1">
                  <span>İndirim</span>
                  <span>-₺{getDiscount().toLocaleString('tr-TR')}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base">
                <span>Toplam</span>
                <span className="text-purple-700">₺{Math.max(0, getTotal() - getDiscount()).toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full bg-purple-600 text-white rounded-xl py-3 font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {placing ? 'Sipariş veriliyor...' : 'Siparişi Onayla'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Siparişi onaylayarak satış koşullarını kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}