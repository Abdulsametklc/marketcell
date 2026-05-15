import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, verifyOtp } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [gsm, setGsm] = useState('');
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !gsm) return setError('Tüm alanları doldur');
    setLoading(true);
    try {
      const { data } = await register(gsm, name);
      setOtpHint(data.otp_code || '');
      setOtp(data.otp_code || '');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.gsm_number?.[0] || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await verifyOtp(gsm, otp);
      login(data.user, {
        access: data.access,
        refresh: data.refresh,
      });
      navigate('/');
    } catch {
      setError('OTP hatalı (simülasyon: 1234)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm border border-gray-200 rounded-2xl p-8 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {step === 'form' ? 'Kayıt Ol' : 'OTP Doğrulama'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === 'form'
            ? 'MarketCell hesabı oluştur'
            : `${gsm} numarasına gönderilen kodu gir`}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                placeholder="Ahmet Yılmaz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon Numarası
              </label>
              <input
                type="text"
                placeholder="905551234567"
                value={gsm}
                onChange={(e) => setGsm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OTP Kodu
              </label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 tracking-widest text-center text-xl"
              />
              {otpHint && (
                <p className="text-xs text-green-600 mt-1 font-medium">Simülasyon kodu: {otpHint}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('form'); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Geri dön
            </button>
          </form>
        )}

        <p className="text-sm text-gray-500 text-center mt-6">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-purple-600 hover:underline font-medium">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}