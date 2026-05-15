import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem } from '../api/cart';
import { useCartStore } from '../store/cartStore';

const MOCK_CART = {
  items: [
    {
      id: 'ci1',
      quantity: 1,
      variant: {
        id: 'v1',
        value: 'Siyah Titanyum',
        variant_type: 'color',
        price_diff: '0',
        stock: 5,
        product: {
          id: '1',
          name: 'iPhone 15 Pro',
          base_price: '45999.00',
          images: [],
          store: { name: 'TechStore' },
        },
      },
    },
    {
      id: 'ci2',
      quantity: 2,
      variant: {
        id: 'v4',
        value: 'M',
        variant_type: 'size',
        price_diff: '0',
        stock: 10,
        product: {
          id: '5',
          name: "Levi's 501 Jean",
          base_price: '1299.00',
          images: [],
          store: { name: 'FashionStore' },
        },
      },
    },
  ],
};

export default function Cart() {
  const navigate = useNavigate();
  const { setItemCount } = useCartStore();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data } = await getCart();
      setCart(data);
      setItemCount(data.item_count || data.items?.length || 0);
    } catch {
      setCart(MOCK_CART);
      setItemCount(MOCK_CART.items.length);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateCartItem(itemId, newQty);
      setCart(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQty } : item
        ),
      }));
    } catch {
      setCart(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQty } : item
        ),
      }));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId);
    try {
      await removeCartItem(itemId);
    } catch {
      // mock modda devam et
    } finally {
      setCart(prev => {
        const updated = {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId),
        };
        setItemCount(updated.items.length);
        return updated;
      });
      setUpdatingId(null);
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

  // Satıcıya göre grupla
  const groupBySeller = () => {
    if (!cart?.items) return {};
    return cart.items.reduce((groups, item) => {
      const storeName = item.variant.product.store.name;
      if (!groups[storeName]) groups[storeName] = [];
      groups[storeName].push(item);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
        {[1, 2].map(i => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const groups = groupBySeller();
  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Sepetim</h1>

      {isEmpty ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">Sepetiniz boş</p>
          <p className="text-gray-400 text-sm mb-6">Ürünleri keşfetmeye başlayın</p>
          <Link
            to="/"
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sol — ürünler */}
          <div className="flex-1 flex flex-col gap-4">
            {Object.entries(groups).map(([storeName, items]) => (
              <div key={storeName} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Mağaza başlığı */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Satıcı:</span>
                  <span className="text-sm font-medium text-gray-800">{storeName}</span>
                </div>

                {/* Ürünler */}
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex gap-4 p-4 border-b border-gray-100 last:border-0 ${
                      updatingId === item.id ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Görsel */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.variant.product.images?.[0] ? (
                        <img
                          src={item.variant.product.images[0]}
                          alt={item.variant.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Görsel</span>
                      )}
                    </div>

                    {/* Bilgiler */}
                    <div className="flex-1">
                      <Link
                        to={`/products/${item.variant.product.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-purple-700 line-clamp-1"
                      >
                        {item.variant.product.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.variant.variant_type === 'color' ? 'Renk' : 'Beden'}: {item.variant.value}
                      </p>
                      <p className="text-sm font-semibold text-purple-700 mt-1">
                        ₺{getItemPrice(item).toLocaleString('tr-TR')}
                      </p>
                    </div>

                    {/* Adet + sil */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        Kaldır
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.stock}
                          className="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Sağ — özet */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="border border-gray-200 rounded-xl p-5 sticky top-20">
              <h2 className="font-medium text-gray-900 mb-4">Sipariş Özeti</h2>

              <div className="flex flex-col gap-2 mb-4">
                {cart.items.map(item => (
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

              <div className="border-t border-gray-200 pt-3 mb-4">
                <div className="flex justify-between font-semibold">
                  <span>Toplam</span>
                  <span className="text-purple-700">₺{getTotal().toLocaleString('tr-TR')}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-purple-600 text-white rounded-xl py-3 font-medium hover:bg-purple-700 transition-colors"
              >
                Ödemeye Geç
              </button>

              <Link
                to="/"
                className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3"
              >
                Alışverişe Devam Et
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}