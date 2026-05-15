import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../api/products';
import { addToCart } from '../api/cart';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const MOCK_PRODUCT = {
  id: '1',
  name: 'iPhone 15 Pro',
  description: 'Apple iPhone 15 Pro, 48MP kamera sistemi, A17 Pro çip ve titanyum tasarımıyla güçlü bir deneyim sunar.',
  base_price: '45999.00',
  status: 'ACTIVE',
  images: [],
  store: { name: 'TechStore', id: '1' },
  category: { name: 'Telefon' },
  variants: [
    { id: 'v1', variant_type: 'color', value: 'Siyah Titanyum', price_diff: '0', stock: 5 },
    { id: 'v2', variant_type: 'color', value: 'Beyaz Titanyum', price_diff: '0', stock: 3 },
    { id: 'v3', variant_type: 'color', value: 'Mavi Titanyum', price_diff: '500', stock: 0 },
  ],
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const { increment } = useCartStore();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await getProduct(id);
      setProduct(data);
    } catch {
      setProduct(MOCK_PRODUCT);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) return navigate('/login');
    if (!selectedVariant) return setErrorMsg('Lütfen bir varyant seçin');
    if (selectedVariant.stock === 0) return setErrorMsg('Bu varyant stokta yok');

    setAddingToCart(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await addToCart(selectedVariant.id, quantity);
      increment();
      setSuccessMsg('Ürün sepete eklendi!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg('Sepete eklenemedi, tekrar dene');
    } finally {
      setAddingToCart(false);
    }
  };

  const getPrice = () => {
    if (!product) return 0;
    const base = parseFloat(product.base_price);
    const diff = selectedVariant ? parseFloat(selectedVariant.price_diff) : 0;
    return (base + diff).toLocaleString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex gap-8 animate-pulse">
        <div className="w-96 h-96 bg-gray-200 rounded-2xl flex-shrink-0"></div>
        <div className="flex-1 flex flex-col gap-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 text-gray-400">Ürün bulunamadı</div>;

  const images = product.images?.length > 0 ? product.images : [null];
  const sizeVariants = product.variants?.filter(v => v.variant_type === 'size') || [];
  const colorVariants = product.variants?.filter(v => v.variant_type === 'color') || [];

  return (
    <div>
      {/* Breadcrumb */}
      <p className="text-sm text-gray-400 mb-6">
        <span className="hover:text-gray-600 cursor-pointer" onClick={() => navigate('/')}>Ürünler</span>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sol — görsel */}
        <div className="flex-shrink-0 w-full md:w-96">
          <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center mb-3 overflow-hidden">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400">Görsel yok</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden bg-gray-100 flex items-center justify-center ${
                    selectedImage === i ? 'border-purple-500' : 'border-gray-200'
                  }`}
                >
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">{i + 1}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sağ — bilgiler */}
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{product.store?.name}</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-3xl font-bold text-purple-700 mb-4">₺{getPrice()}</p>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Renk varyantları */}
          {colorVariants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Renk</p>
              <div className="flex flex-wrap gap-2">
                {colorVariants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => v.stock > 0 && setSelectedVariant(v)}
                    disabled={v.stock === 0}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                        : v.stock === 0
                        ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {v.value}
                    {v.price_diff > 0 && ` (+₺${parseFloat(v.price_diff).toLocaleString('tr-TR')})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Beden varyantları */}
          {sizeVariants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Beden</p>
              <div className="flex flex-wrap gap-2">
                {sizeVariants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => v.stock > 0 && setSelectedVariant(v)}
                    disabled={v.stock === 0}
                    className={`w-12 h-12 rounded-lg border text-sm font-medium transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : v.stock === 0
                        ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Adet */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Adet</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-medium"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(selectedVariant?.stock || 10, q + 1))}
                className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-medium"
              >
                +
              </button>
              {selectedVariant && (
                <span className="text-xs text-gray-400 ml-2">
                  Stok: {selectedVariant.stock}
                </span>
              )}
            </div>
          </div>

          {/* Mesajlar */}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {errorMsg}
            </div>
          )}

          {/* Sepete ekle */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !selectedVariant || selectedVariant?.stock === 0}
            className="w-full bg-purple-600 text-white rounded-xl py-3 font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addingToCart
              ? 'Ekleniyor...'
              : !selectedVariant
              ? 'Varyant Seçin'
              : selectedVariant.stock === 0
              ? 'Stokta Yok'
              : 'Sepete Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}