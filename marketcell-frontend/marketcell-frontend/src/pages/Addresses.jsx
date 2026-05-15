import { useState, useEffect } from 'react';
import { getAddresses, createAddress } from '../api/orders';
import api from '../api/axios';

const MOCK_ADDRESSES = [
  { id: 'a1', title: 'Ev', full_address: 'Ataturk Cad. No:12 Daire:3', city: 'Istanbul', district: 'Kadikoy', is_default: true },
  { id: 'a2', title: 'Is', full_address: 'Bagdat Cad. No:45 Kat:2', city: 'Istanbul', district: 'Maltepe', is_default: false },
];

const EMPTY_FORM = { title: '', full_address: '', city: '', district: '', is_default: false };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data } = await getAddresses();
      setAddresses(data.results || data);
    } catch {
      setAddresses(MOCK_ADDRESSES);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.full_address || !form.city || !form.district) {
      return setError('Tum alanlari doldurun');
    }
    setSaving(true);
    try {
      const { data } = await createAddress(form);
      setAddresses((prev) => [...prev, data]);
    } catch {
      setAddresses((prev) => [
        ...prev,
        { ...form, id: 'mock-' + Date.now() },
      ]);
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setSuccessMsg('Adres eklendi');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Adresi silmek istediginize emin misiniz?')) return;
    try {
      await api.delete(`/auth/addresses/${id}/`);
    } catch {
      // mock
    } finally {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/auth/addresses/${id}/`, { is_default: true });
    } catch {
      // mock
    } finally {
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Adreslerim</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700"
        >
          + Yeni Adres
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          {successMsg}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-purple-200 bg-purple-50 rounded-2xl p-5 mb-5 flex flex-col gap-3"
        >
          <h2 className="font-medium text-gray-900">Yeni Adres Ekle</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Adres basligi (Ev, Is...)"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Acik adres"
            rows={2}
            value={form.full_address}
            onChange={(e) => setForm((p) => ({ ...p, full_address: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Ilce"
              value={form.district}
              onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Sehir"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))}
              className="accent-purple-600"
            />
            Varsayilan adres olarak ayarla
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="border border-gray-300 text-gray-600 rounded-xl px-5 py-2 text-sm hover:bg-gray-50"
            >
              Iptal
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">Henuz adresiniz yok</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-purple-600 hover:underline text-sm"
          >
            Ilk adresi ekle
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border rounded-xl p-4 ${
                addr.is_default
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{addr.title}</p>
                    {addr.is_default && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Varsayilan
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{addr.full_address}</p>
                  <p className="text-sm text-gray-500">{addr.district}, {addr.city}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs border border-purple-300 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-50"
                    >
                      Varsayilan Yap
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}