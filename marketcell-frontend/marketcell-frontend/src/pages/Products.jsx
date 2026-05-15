import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../api/products';

const MOCK_CATEGORIES = [
  { id: '1', name: 'Elektronik', children: [
    { id: '2', name: 'Telefon' },
    { id: '3', name: 'Bilgisayar' },
  ]},
  { id: '4', name: 'Giyim', children: [
    { id: '5', name: 'Erkek' },
    { id: '6', name: 'Kadın' },
  ]},
  { id: '7', name: 'Ev & Yaşam', children: [] },
];

const MOCK_PRODUCTS = [
  { id: '1', name: 'iPhone 15 Pro', base_price: '45999.00', store: { name: 'TechStore' }, images: [], status: 'ACTIVE', category: { name: 'Telefon' } },
  { id: '2', name: 'Samsung Galaxy S24', base_price: '38999.00', store: { name: 'MobilShop' }, images: [], status: 'ACTIVE', category: { name: 'Telefon' } },
  { id: '3', name: 'MacBook Pro M3', base_price: '89999.00', store: { name: 'TechStore' }, images: [], status: 'ACTIVE', category: { name: 'Bilgisayar' } },
  { id: '4', name: 'Nike Air Max', base_price: '2499.00', store: { name: 'SportShop' }, images: [], status: 'ACTIVE', category: { name: 'Erkek' } },
  { id: '5', name: 'Levi\'s 501 Jean', base_price: '1299.00', store: { name: 'FashionStore' }, images: [], status: 'ACTIVE', category: { name: 'Erkek' } },
  { id: '6', name: 'AirPods Pro', base_price: '12999.00', store: { name: 'TechStore' }, images: [], status: 'ACTIVE', category: { name: 'Elektronik' } },
  { id: '7', name: 'Dyson V15', base_price: '18999.00', store: { name: 'HomeStore' }, images: [], status: 'ACTIVE', category: { name: 'Ev & Yaşam' } },
  { id: '8', name: 'iPad Air', base_price: '24999.00', store: { name: 'TechStore' }, images: [], status: 'ACTIVE', category: { name: 'Elektronik' } },
];

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Products() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCat, minPrice, maxPrice, sort]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, selectedCat, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.results || data)).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (debouncedSearch) params.q = debouncedSearch;
      if (selectedCat) params.cat = selectedCat;
      if (minPrice) params.min = minPrice;
      if (maxPrice) params.max = maxPrice;
      if (sort) params.sort = sort;
      const { data } = await getProducts(params);
      setProducts(data.results || data);
      setTotalCount(data.count || 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch {
      let filtered = [...MOCK_PRODUCTS];
      if (debouncedSearch) {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }
      if (minPrice) filtered = filtered.filter(p => parseFloat(p.base_price) >= parseFloat(minPrice));
      if (maxPrice) filtered = filtered.filter(p => parseFloat(p.base_price) <= parseFloat(maxPrice));
      if (sort === 'price_asc') filtered.sort((a, b) => parseFloat(a.base_price) - parseFloat(b.base_price));
      if (sort === 'price_desc') filtered.sort((a, b) => parseFloat(b.base_price) - parseFloat(a.base_price));
      setProducts(filtered);
      setTotalCount(filtered.length);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCat('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0">
        <div className="border border-gray-200 rounded-xl p-4 sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Filtreler</h2>
            <button
              onClick={clearFilters}
              className="text-xs text-purple-600 hover:underline"
            >
              Temizle
            </button>
          </div>

          {/* Kategoriler */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Kategori
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCat('')}
                className={`text-left text-sm px-2 py-1 rounded-lg ${
                  selectedCat === '' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tümü
              </button>
              {categories.map(cat => (
                <div key={cat.id}>
                  <button
                    onClick={() => setSelectedCat(cat.id)}
                    className={`text-left w-full text-sm px-2 py-1 rounded-lg ${
                      selectedCat === cat.id ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                  {cat.children?.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedCat(child.id)}
                      className={`text-left w-full text-sm px-2 py-1 pl-5 rounded-lg ${
                        selectedCat === child.id ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Fiyat aralığı */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Fiyat Aralığı (₺)
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Ana içerik */}
      <div className="flex-1">
        {/* Arama + sıralama */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="newest">En Yeni</option>
            <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
            <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
            <option value="rating">En Çok Satan</option>
          </select>
        </div>

        {/* Sonuç sayısı */}
        <p className="text-sm text-gray-500 mb-4">
          {totalCount} ürün bulundu
        </p>

        {/* Ürün grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="bg-gray-200 rounded-lg h-40 mb-3"></div>
                <div className="bg-gray-200 rounded h-4 mb-2"></div>
                <div className="bg-gray-200 rounded h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-1">Ürün bulunamadı</p>
            <p className="text-sm">Farklı arama terimleri veya filtreler dene</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-purple-200 transition-all group"
              >
                {/* Ürün görseli */}
                <div className="bg-gray-100 rounded-lg h-40 mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">Görsel yok</span>
                  )}
                </div>

                {/* Bilgiler */}
                <p className="text-xs text-gray-400 mb-1">{product.store_name}</p>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-700 line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <p className="text-base font-semibold text-purple-700">
                  ₺{parseFloat(product.base_price).toLocaleString('tr-TR')}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Sayfalama */}
        {(hasNext || hasPrev) && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!hasPrev || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Önceki
            </button>
            <span className="text-sm text-gray-500">Sayfa {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sonraki →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}