import { useState, useEffect } from 'react';
import api from '../../api/axios';

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'iPhone 15 Pro', base_price: '45999.00', status: 'ACTIVE', images: [], category: { name: 'Telefon' }, variants: [{ id: 'v1', value: 'Siyah', variant_type: 'color', stock: 5 }] },
  { id: 'p2', name: 'AirPods Pro', base_price: '12999.00', status: 'ACTIVE', images: [], category: { name: 'Elektronik' }, variants: [{ id: 'v2', value: 'Beyaz', variant_type: 'color', stock: 0 }] },
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Elektronik' },
  { id: '2', name: 'Telefon' },
  { id: '3', name: 'Bilgisayar' },
  { id: '4', name: 'Giyim' },
  { id: '5', name: 'Erkek' },
  { id: '6', name: 'Kadın' },
  { id: '7', name: 'Ev & Yaşam' },
];

const STATUS_CONFIG = {
  ACTIVE:       { label: 'Aktif',       color: 'bg-green-100 text-green-700' },
  INACTIVE:     { label: 'Pasif',       color: 'bg-gray-100 text-gray-600' },
  OUT_OF_STOCK: { label: 'Stok Yok',   color: 'bg-red-100 text-red-700' },
};

const EMPTY_FORM = {
  name: '', description: '', base_price: '', category_id: '', images: '',
  variants: [{ variant_type: 'color', value: '', price_diff: '0', stock: '' }],
};

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/seller/products/'),
        api.get('/categories/'),
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch {
      setProducts(MOCK_PRODUCTS);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      base_price: product.base_price,
      category_id: product.category?.id || '',
      images: product.images?.join(', ') || '',
      variants: product.variants?.length > 0 ? product.variants.map(v => ({
        variant_type: v.variant_type,
        value: v.value,
        price_diff: v.price_diff || '0',
        stock: v.stock,
      })) : [{ variant_type: 'color', value: '', price_diff: '0', stock: '' }],
    });
    setShowForm(true);
    setError('');
  };

  const handleNew = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { variant_type: 'color', value: '', price_diff: '0', stock: '' }],
    }));
  };

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.base_price || !form.category_id) {
      return setError('Ürün adı, fiyat ve kategori zorunludur');
    }
    for (const v of form.variants) {
      if (!v.value || v.stock === '') return setError('Tüm varyant alanlarını doldurun');
    }

    setSaving(true);
    const payload = {
      ...form,
      images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
    };

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}/`, payload);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
        setSuccessMsg('Ürün güncellendi');
      } else {
        const { data } = await api.post('/products/', payload);
        setProducts(prev => [...prev, data.data]);
        setSuccessMsg('Ürün eklendi');
      }
      handleClose();
    } catch {
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, name: form.name, base_price: form.base_price } : p));
      } else {
        setProducts(prev => [...prev, { ...payload, id: 'mock-' + Date.now(), status: 'ACTIVE', category: { name: 'Kategori' } }]);
      }
      setSuccessMsg(editingProduct ? 'Ürün güncellendi' : 'Ürün eklendi');
      handleClose();
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/products/${productId}/`);
    } catch {
      // mock modda devam
    } finally {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleStockUpdate = async (productId, variantId, newStock) => {
    try {
      await api.patch(`/products/variants/${variantId}/`, { stock: newStock });
    } catch {
      // mock
    } finally {
      setProducts(prev => prev.map(p => p.id === productId ? {
        ...p,
        variants: p.variants.map(v => v.id === variantId ? { ...v, stock: parseInt(newStock) } : v),
      } : p));
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ürünlerim</h1>
        <button
          onClick={handleNew}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700"
        >
          + Yeni Ürün Ekle
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          {successMsg}
        </div>
      )}

      {/* Ürün formu */}
      {showForm && (
        <div className="border border-purple-200 bg-purple-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">
              {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  placeholder="iPhone 15 Pro"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  placeholder="45999"
                  value={form.base_price}
                  onChange={e => setForm(p => ({ ...p, base_price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                placeholder="Ürün açıklaması..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Kategori seç</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL'leri (virgülle ayır)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.images}
                  onChange={e => setForm(p => ({ ...p, images: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Varyantlar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Varyantlar</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-xs text-purple-600 hover:underline"
                >
                  + Varyant ekle
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center bg-white rounded-lg p-3 border border-gray-200">
                    <select
                      value={v.variant_type}
                      onChange={e => updateVariant(i, 'variant_type', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="color">Renk</option>
                      <option value="size">Beden</option>
                    </select>
                    <input
                      type="text"
                      placeholder={v.variant_type === 'color' ? 'Siyah' : 'XL'}
                      value={v.value}
                      onChange={e => updateVariant(i, 'value', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      placeholder="Stok"
                      value={v.stock}
                      onChange={e => updateVariant(i, 'stock', e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      placeholder="+₺"
                      value={v.price_diff}
                      onChange={e => updateVariant(i, 'price_diff', e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-red-400 hover:text-red-600 text-sm px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-purple-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : editingProduct ? 'Güncelle' : 'Ürünü Ekle'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="border border-gray-300 text-gray-700 rounded-xl px-6 py-2.5 text-sm hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ürün listesi */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">Henüz ürününüz yok</p>
          <button onClick={handleNew} className="text-purple-600 hover:underline text-sm">
            İlk ürünü ekle
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map(product => {
            const status = STATUS_CONFIG[product.status] || STATUS_CONFIG.ACTIVE;
            return (
              <div key={product.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  {/* Görsel */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Görsel</span>
                    )}
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{product.category?.name}</p>
                    <p className="text-base font-bold text-purple-700">
                      ₺{parseFloat(product.base_price).toLocaleString('tr-TR')}
                    </p>

                    {/* Varyant stok güncelleme */}
                    {product.variants?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.variants.map(v => (
                          <div key={v.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                            <span className="text-xs text-gray-600">{v.value}:</span>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={e => handleStockUpdate(product.id, v.id, e.target.value)}
                              className="w-14 text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-400">adet</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Butonlar */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}