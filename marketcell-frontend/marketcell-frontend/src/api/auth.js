import api from './axios';

export const register = (gsm_number, name) =>
  api.post('/auth/register/', { gsm_number, name });

export const verifyOtp = (gsm_number, otp_code) =>
  api.post('/auth/verify-otp/', { gsm_number, otp_code });