import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verifyOtp, register } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [step, setStep] = useState('phone');
  const [gsm, setGsm] = useState('');
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!gsm) return setError('Telefon numarası girin');
    setLoading(true);
    try {
      const { data } = await register(gsm, 'Kullanıcı');
      setOtpHint(data.otp_code || '');
      setOtp(data.otp_code || '');
      setStep('otp');
    } catch (err) {
      if (err.response?.status === 400) {
        setStep('otp');
      } else {
        setError('Bir hata oluştu, tekrar dene');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) return setError('OTP kodunu girin');
    setLoading(true);
    try {
      const { data } = await verifyOtp(gsm, otp);
      login(data.user, {
        access: data.access,
        refresh: data.refresh,
      });
      navigate('/');
    } catch {
      setError('OTP hatalı, tekrar dene (simülasyon: 1234)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm border border-gray-200 rounded-2xl p-8 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {step === 'phone' ? 'Giriş Yap' : 'OTP Doğrulama'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === 'phone'
            ? 'Turkcell GSM numaranı gir'
            : `${gsm} numarasına gönderilen kodu gir`}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
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
              {loading ? 'Gönderiliyor...' : 'OTP Gönder'}
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
              onClick={() => { setStep('phone'); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Numarayı değiştir
            </button>
          </form>
        )}

        <p className="text-sm text-gray-500 text-center mt-6">
          Hesabın yok mu?{' '}
          <Link to="/register" className="text-purple-600 hover:underline font-medium">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}