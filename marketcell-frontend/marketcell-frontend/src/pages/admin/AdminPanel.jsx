import { useState, useEffect } from 'react';
import api from '../../api/axios';

const MOCK_STATS = {
  total_users: 1240,
  total_sellers: 38,
  total_products: 412,
  total_orders: 893,
  total_revenue: '2847650.00',
  pending_sellers: 5,
};

const MOCK_SELLERS = [
  { id: 's1', name: 'Ahmet Yılmaz', gsm_number: '905551234567', store: { id: 'st1', name: 'TechStore', is_approved: true }, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 's2', name: 'Ayşe Kaya', gsm_number: '905559876543', store: { id: 'st2', name: 'FashionStore', is_approved: false }, created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 's3', name: 'Mehmet Demir', gsm_number: '905553334455', store: { id: 'st3', name: 'HomeStore', is_approved: false }, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 's4', name: 'Zeynep Şahin', gsm_number: '905557778899', store: { id: 'st4', name: 'SportShop', is_approved: true }, created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Elektronik', slug: 'elektronik', parent: null, level: 0 },
  { id: '2', name: 'Telefon', slug: 'telefon', parent: { name: 'Elektronik' }, level: 1 },
  { id: '3', name: 'Bilgisayar', slug: 'bilgisayar', parent: { name: 'Elektronik' }, level: 1 },
  { id: '4', name: 'Giyim', slug: 'giyim', parent: null, level: 0 },
  { id: '5', name: 'Erkek', slug: 'erkek', parent: { name: 'Giyim' }, level: 1 },
];

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sellers', label: 'Satici Yonetimi' },
  { id: 'categories', label: 'Kategori Yonetimi' },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '', parent_id: '' });
  const [savingCat, setSavingCat] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, sellersRes, catsRes] = await Promise.all([
        api.get('/admin/stats/'),
        api.get('/admin/sellers/'),
        api.get('/categories/'),
      ]);
      setStats(statsRes.data);
      setSellers(sellersRes.data.results || sellersRes.data);
      setCategories(catsRes.data.results || catsRes.data);
    } catch {
      setStats(MOCK_STATS);
      setSellers(MOCK_SELLERS);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleApproveSeller = async (storeId, approve) => {
    try {
      await api.patch(`/admin/stores/${storeId}/`, { is_approved: approve });
    } catch {
      // mock
    } finally {
      setSellers((prev) =>
        prev.map((s) =>
          s.store.id === storeId
            ? { ...s, store: { ...s.store, is_approved: approve } }
            : s
        )
      );
      showSuccess(approve ? 'Magaza onaylandi' : 'Magaza onay kaldirildi');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name || !catForm.slug) return;
    setSavingCat(true);
    try {
      const { data } = await api.post('/categories/', catForm);
      setCategories((prev) => [...prev, data.data]);
    } catch {
      const parent = categories.find((c) => c.id === catForm.parent_id);
      setCategories((prev) => [
        ...prev,
        {
          id: 'mock-' + Date.now(),
          name: catForm.name,
          slug: catForm.slug,
          parent: parent ? { name: parent.name } : null,
          level: catForm.parent_id ? 1 : 0,
        },
      ]);
    } finally {
      setSavingCat(false);
      setCatForm({ name: '', slug: '', parent_id: '' });
      setShowCatForm(false);
      showSuccess('Kategori eklendi');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Kategoriyi silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/categories/${catId}/`);
    } catch {
      // mock
    } finally {
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      showSuccess('Kategori silindi');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-8 bg-gray-200 rounded w-40 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Paneli</h1>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          {successMsg}
        </div>
      )}

      {/* Tab menu */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Toplam Kullanici</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString('tr-TR')}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Toplam Satici</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_sellers}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Toplam Urun</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Toplam Siparis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 md:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Toplam Gelir</p>
              <p className="text-2xl font-bold text-purple-700">
                {parseFloat(stats.total_revenue).toLocaleString('tr-TR')} TL
              </p>
            </div>
          </div>

          {/* Bekleyen satici onaylari */}
          {sellers.filter((s) => !s.store.is_approved).length > 0 && (
            <div>
              <h2 className="font-medium text-gray-900 mb-3">
                Bekleyen Onaylar
                <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  {sellers.filter((s) => !s.store.is_approved).length}
                </span>
              </h2>
              <div className="flex flex-col gap-3">
                {sellers
                  .filter((s) => !s.store.is_approved)
                  .map((seller) => (
                    <div
                      key={seller.id}
                      className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{seller.store.name}</p>
                        <p className="text-xs text-gray-500">
                          {seller.name} - {seller.gsm_number}
                        </p>
                      </div>
                      <button
                        onClick={() => handleApproveSeller(seller.store.id, true)}
                        className="bg-green-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-green-700"
                      >
                        Onayla
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Satici Yonetimi */}
      {activeTab === 'sellers' && (
        <div>
          <h2 className="font-medium text-gray-900 mb-4">Tum Saticilar</h2>
          <div className="flex flex-col gap-3">
            {sellers.map((seller) => (
              <div key={seller.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900">{seller.store.name}</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        seller.store.is_approved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {seller.store.is_approved ? 'Onaylandi' : 'Bekliyor'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {seller.name} - {seller.gsm_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Kayit:{' '}
                    {new Date(seller.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {seller.store.is_approved ? (
                    <button
                      onClick={() => handleApproveSeller(seller.store.id, false)}
                      className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Onayi Kaldir
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApproveSeller(seller.store.id, true)}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                    >
                      Onayla
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kategori Yonetimi */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Kategoriler</h2>
            <button
              onClick={() => setShowCatForm(!showCatForm)}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700"
            >
              + Yeni Kategori
            </button>
          </div>

          {showCatForm && (
            <form
              onSubmit={handleAddCategory}
              className="border border-purple-200 bg-purple-50 rounded-xl p-4 mb-4 flex flex-col gap-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kategori Adi</label>
                  <input
                    type="text"
                    placeholder="Elektronik"
                    value={catForm.name}
                    onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    placeholder="elektronik"
                    value={catForm.slug}
                    onChange={(e) => setCatForm((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ust Kategori (opsiyonel)</label>
                  <select
                    value={catForm.parent_id}
                    onChange={(e) => setCatForm((p) => ({ ...p, parent_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Kok kategori</option>
                    {categories
                      .filter((c) => c.level === 0)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingCat}
                  className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {savingCat ? 'Kaydediliyor...' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatForm(false)}
                  className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Iptal
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {cat.level === 1 && <span className="text-gray-300 text-lg">└</span>}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">
                      /{cat.slug}
                      {cat.parent && ` - Ust: ${cat.parent.name}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}